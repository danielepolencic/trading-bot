import * as CurrencyFair from '../currencyFair';
import * as ℚ from '../monad/rational';
import * as Currency from '../currency';
import * as Maybe from '../monad/maybe';
import * as Q from '../effect/queue';
import * as Markets from '../reactorCurrencyFairMarkets/markets';
import * as Account from '../reactorCurrencyFairOrders/account';
import * as Identity from '../monad/identity';
import {compose} from '../utils';
import * as E from '../effect/engine';
import {IMessage, Noop, Empty} from '../effect/message';

export enum Status {
  IN_PROGRESS,
  IDLE,
  FIRST_RUN
}

export type Messages =
  | Message.Init
  | CurrencyFair.Message.ApiError
  | CurrencyFair.Message.Empty
  | Message.OrderUpdate
  | Message.SummaryUpdate
  | Message.UpdateDirectQuote
  | Message.UpdateIndirectQuote
  | Message.AddProfile
  | Message.AddRequest
  | Empty;

export namespace Message {
  export class Type {
    public static readonly AddRequest = 'Scheduler.AddRequest'
    public static readonly AddProfile = 'Scheduler.AddProfile'
    public static readonly UpdateDirectQuote = 'Scheduler.UpdateDirectQuote'
    public static readonly UpdateIndirectQuote = 'Scheduler.UpdateIndirectQuote'
    public static readonly OrderUpdate = 'Scheduler.OrderUpdate'
    public static readonly SummaryUpdate = 'Scheduler.SummaryUpdate'
    public static readonly Init = 'Scheduler.Init'
  }

  export class Init implements IMessage {
    public readonly type = Type.Init
    constructor() {}
  }

  export class AddRequest implements IMessage {
    public readonly type = Type.AddRequest
    constructor(public readonly payload: {currencyBuy: Currency.ANY, currencySell: Currency.ANY}) {}
  }

  export class AddProfile implements IMessage {
    public readonly type = Type.AddProfile
    constructor(public readonly payload: {profile: CurrencyFair.IProfile}) {}
  }

  export class UpdateDirectQuote implements IMessage {
    public readonly type = Message.Type.UpdateDirectQuote
    constructor(public readonly payload: {market: CurrencyFair.IMarketplace, id: string}) {}
  }

  export class UpdateIndirectQuote implements IMessage {
    public readonly type = Message.Type.UpdateIndirectQuote
    constructor(public readonly payload: {market: CurrencyFair.IMarketplace, id: string}) {}
  }

  export class OrderUpdate implements IMessage {
    public readonly type = Type.OrderUpdate
    constructor(public readonly payload: {order: CurrencyFair.IOrder, profileId: string}) {}
  }

  export class SummaryUpdate implements IMessage {
    public readonly type = Type.SummaryUpdate
    constructor(public readonly payload: {summary: CurrencyFair.IBalance[], profileId: string}) {}
  }
}

export interface IRequest {
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
  directQuote: Maybe.Maybe<ℚ.ℚ>
  indirectQuote: Maybe.Maybe<ℚ.ℚ>
  spread: Maybe.Maybe<ℚ.ℚ>
}

export interface IModel {
  orderRequests: {[id: string]: IRequest}
  profiles: {[id: string]: CurrencyFair.IProfile}
  activeOrders: {[profileId: string]: {[orderId: string]: CurrencyFair.IOrder}}
  balances: {[profileId: string]: CurrencyFair.IBalance[]}
  status: Status
}

export function Init(): IModel {
  return {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Status.FIRST_RUN
  };
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Message.Type.AddProfile:
      return [
        {...state, profiles: {...state.profiles, [message.payload.profile.customerId]: message.payload.profile}},
        Noop()
      ];

    case Message.Type.AddRequest:
      return [
        {
          ...state,
          orderRequests: {
            ...state.orderRequests,
            [`${message.payload.currencyBuy}${message.payload.currencySell}`]: {
              currencyBuy: message.payload.currencyBuy,
              currencySell: message.payload.currencySell,
              directQuote: Maybe.Nothing,
              indirectQuote: Maybe.Nothing,
              spread: Maybe.Nothing
            }
          }
        },
        Noop()
      ];

    case Message.Type.UpdateDirectQuote:
      const maybeStateWithDirectQuote = Maybe.Do.of(state.orderRequests[message.payload.id])
        .map(request => {
          const updatedRequest: IRequest = {
            ...request,
            directQuote: Maybe.of(message.payload.market.rate),
            spread: Maybe.lift2((directQuote, indirectQuote) => {
              return ℚ.multiplyBy(indirectQuote)(directQuote)
            }, Maybe.of(message.payload.market.rate), request.indirectQuote)
          }
          const newState: IModel = {
            ...state,
            orderRequests: {
              ...state.orderRequests,
              [message.payload.id]: updatedRequest
            }
          };
          return newState;
        })
        .value;

      switch(state.status) {
        case Status.IDLE:
          return Maybe.Do.of(maybeStateWithDirectQuote)
            .map(state => PlaceOrder(state))
            .orSome([state, Noop()] as [IModel, E.Engine<Messages>]);

        default:
          return [
            Maybe.orSome(state)(maybeStateWithDirectQuote) as IModel,
            Noop()
          ];
      }

    case Message.Type.UpdateIndirectQuote:
      const maybeStateWithIndirectQuote = Maybe.Do.of(state.orderRequests[message.payload.id])
        .map(request => {
          const updatedRequest: IRequest = {
            ...request,
            indirectQuote: Maybe.of(message.payload.market.rate),
            spread: Maybe.lift2((directQuote, indirectQuote) => {
              return ℚ.multiplyBy(indirectQuote)(directQuote)
            }, request.directQuote, Maybe.of(message.payload.market.rate))
          }
          const newState: IModel = {
            ...state,
            orderRequests: {
              ...state.orderRequests,
              [message.payload.id]: updatedRequest
            }
          };
          return newState;
        })
        .value;

      switch(state.status) {
        case Status.IDLE:
          return Maybe.Do.of(maybeStateWithIndirectQuote)
            .map(state => PlaceOrder(state))
            .orSome([state, Noop()] as [IModel, E.Engine<Messages>]);

        default:
          return [
            Maybe.orSome(state)(maybeStateWithIndirectQuote) as IModel,
            Noop()
          ];
      }

    case Message.Type.OrderUpdate:
      const activeOrders = {...(state.activeOrders[message.payload.profileId] || {}), [message.payload.order.id]: message.payload.order};
      switch(state.status) {
        case Status.IDLE:
          return PlaceOrder({
            ...state,
            activeOrders: {...state.activeOrders, [message.payload.profileId]: activeOrders}
          });
        case Status.FIRST_RUN:
          return [
            {...state, activeOrders: {...state.activeOrders, [message.payload.profileId]: activeOrders}, status: Status.IDLE},
            Noop()
          ];
        case Status.IN_PROGRESS:
          return [
            {...state, activeOrders: {...state.activeOrders, [message.payload.profileId]: activeOrders}},
            Noop()
          ];
        default:
          return [state, Noop()]
      }

    case Message.Type.SummaryUpdate:
      switch(state.status) {
        case Status.IDLE:
          return PlaceOrder({
            ...state,
            balances: {...state.balances, [message.payload.profileId]: message.payload.summary}
          });
        default:
          return [
            {...state, balances: {...state.balances, [message.payload.profileId]: message.payload.summary}},
            Noop()
          ];
      }

    case Message.Type.Init:
    case CurrencyFair.Message.Type.Error:
    case CurrencyFair.Message.Type.Empty:
      switch(state.status) {
        case Status.FIRST_RUN:
        case Status.IN_PROGRESS:
          return [
            {...state, status: Status.IDLE},
            Noop()
          ];
        default:
          return [state, Noop()];
      }

    default:
      return [state, Noop()];
  }
}

function PlaceOrder(state: IModel): [IModel, E.Engine<Messages>] {
  const maybePlaceOrder = (scorecard: IScorecard) => compose(
    Maybe.map<ℚ.ℚ, [IModel, E.Engine<CurrencyFair.Message.Empty | CurrencyFair.Message.ApiError>]>(() => [
      {...state, status: Status.IN_PROGRESS},
      CurrencyFair.placeOrder2(scorecard.profile, {
        currencyBuy: scorecard.currencyBuy,
        currencySell: scorecard.currencySell,
        amount: scorecard.balance,
        rate: compose(ℚ.addTo(scorecard.directQuote), ℚ.parse)(0.10) // hack to trigger the price update
      })
    ]),
    ℚ.isLesserThan(ℚ.parse(1.002))
  )(scorecard.score);

  return compose(
    Maybe.orSome<[IModel, E.Engine<Messages>], [IModel, E.Engine<Messages>]>([state, Noop()]),
    Maybe.fmap(maybePlaceOrder)
  )(Maybe.of(collectScoreCards(state)[0]));
}

interface IScorecard {
  profile: CurrencyFair.IProfile
  balance: ℚ.ℚ
  similarOrdersAlreadyLive: CurrencyFair.IOrder[]
  similarOrdersWithSharedCurrencyDirectionAlreadyLive: CurrencyFair.IOrder[]
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
  directQuote: ℚ.ℚ
  indirectQuote: ℚ.ℚ
  spread: ℚ.ℚ
  score: ℚ.ℚ
}

function sortScorecards(scorecards: IScorecard[]): IScorecard[] {
  return scorecards.slice(0).sort((a, b) => {
    return ℚ.toFloat(b.score) - ℚ.toFloat(a.score);
  });
}

function score(scorecard: IScorecard): ℚ.ℚ {
  return Identity.Do.of(scorecard.balance)
    .map(balance => {
      return Maybe.Do.of(ℚ.isGreaterThan(balance)(ℚ.parse(0)))
        .map(() => ℚ.parse(1))
        .orSome(ℚ.parse(0));
    })
    .map(ℚ.multiplyBy(scorecard.similarOrdersAlreadyLive.length > 0 ? 0 : 1))
    .map(ℚ.multiplyBy(scorecard.similarOrdersWithSharedCurrencyDirectionAlreadyLive.length > 0 ? 0 : 1))
    .map(ℚ.multiplyBy(scorecard.spread))
    .extract();
}

export function collectScoreCards({profiles, activeOrders, balances, orderRequests} : IModel): IScorecard[] {
  const onlyPendingOrders = compose(Maybe.orSome<boolean, boolean>(false), Maybe.map(() => true), CurrencyFair.isPending);
  const allActiveOrders = Object.keys(activeOrders)
    .reduce((acc, id) => {
      Object.keys(activeOrders[id]).forEach(orderId => acc.push(activeOrders[id][orderId]));
      return acc;
    }, [] as CurrencyFair.IOrder[])
    .filter(onlyPendingOrders);

  const scorecards = Object.keys(profiles).map(profileId => {
    return Object.keys(orderRequests).map((orderRequestId): IScorecard => {
      const {currencyBuy, currencySell, directQuote, indirectQuote, spread} = orderRequests[orderRequestId];
      return {
        currencyBuy,
        currencySell,
        directQuote: Maybe.orSome<ℚ.ℚ, ℚ.ℚ>(ℚ.parse(0))(directQuote),
        indirectQuote: Maybe.orSome<ℚ.ℚ, ℚ.ℚ>(ℚ.parse(0))(indirectQuote),
        spread: Maybe.orSome<ℚ.ℚ, ℚ.ℚ>(ℚ.parse(0))(spread),
        profile: profiles[profileId],
        balance: Maybe.Do.of(balances[profileId])
          .fmap(balance => Maybe.of<CurrencyFair.IBalance>(balance.find(it => it.currency === currencySell)))
          .map(balance => balance.available)
          .orSome(ℚ.parse(0)),
        similarOrdersAlreadyLive: allActiveOrders.filter(it => {
          return it.currencyBuy === currencyBuy && it.currencySell === currencySell;
        }),
        similarOrdersWithSharedCurrencyDirectionAlreadyLive: Maybe.Do.of(activeOrders[profileId])
          .map(activeOrders => Object.keys(activeOrders)
            .reduce((acc, orderId) => acc.concat(activeOrders[orderId]), [] as CurrencyFair.IOrder[])
            .filter(onlyPendingOrders)
            .filter(it => {
              return it.currencyBuy === currencySell || it.currencyBuy === currencySell;
            }))
          .orSome([]),
        score: ℚ.parse(0)
      };
    });
  })
  .reduce((acc, it) => acc.concat(it), [])
  .map(scorecard => ({...scorecard, score: score(scorecard)}));

  return sortScorecards(scorecards);
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  const directQuotes = Object.keys(state.orderRequests).map(key => {
    const request = state.orderRequests[key];
    return E.map((message: Q.Message.ConsumeEvent<Markets.Message.Tick>) => {
      const market = message.payload.message.payload;
      return market.currencyBuy === request.currencyBuy && market.currencySell === request.currencySell ?
      new Message.UpdateDirectQuote({market, id: key}) : new Empty();
    })(Q.Subscribe2<Markets.Message.Tick>({topic: Markets.Message.Type.Tick}));
  });
  const indirectQuotes = Object.keys(state.orderRequests).map(key => {
    const request = state.orderRequests[key];
    return E.map((message: Q.Message.ConsumeEvent<Markets.Message.Tick>) => {
      const market = message.payload.message.payload;
      return market.currencyBuy === request.currencySell && market.currencySell === request.currencyBuy ?
      new Message.UpdateIndirectQuote({market, id: key}) : new Empty();
    })(Q.Subscribe2<Markets.Message.Tick>({topic: Markets.Message.Type.Tick}));
  });
  const orderUpdates = Object.keys(state.profiles).map(key => {
    return E.map((message: Q.Message.ConsumeEvent<Account.Message.OrderTick>) => {
      return message.payload.message.payload.profile.customerId === state.profiles[key].customerId ?
        new Message.OrderUpdate({order: message.payload.message.payload.order, profileId: key}) : new Empty();
    })(Q.Subscribe2<Account.Message.OrderTick>({topic: Account.Message.Type.OrderTick}));
  });
  const summaries = Object.keys(state.profiles).map(key => {
    return E.map((message: Q.Message.ConsumeEvent<Account.Message.Summary>) => {
      return message.payload.message.payload.profile.customerId === state.profiles[key].customerId ?
        new Message.SummaryUpdate({summary: message.payload.message.payload.summary, profileId: key}) : new Empty();
    })(Q.Subscribe2<Account.Message.Summary>({topic: Account.Message.Type.Summary}));
  });

  return E.batch<Messages>(([] as E.Engine<Messages>[])
    .concat(directQuotes)
    .concat(indirectQuotes)
    .concat(orderUpdates)
    .concat(summaries)
  );
}