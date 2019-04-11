import * as CurrencyFair from '../currencyFair';
import * as Q from '../effect/queue';
import * as Currency from '../currency';
import * as ℚ from '../monad/rational';
import * as Markets from '../reactorCurrencyFairMarkets/markets';
import * as Maybe from '../monad/maybe';
import * as E from '../effect/engine';
import {IMessage, Noop, Empty} from '../effect/message';
import {compose} from '../utils';

export enum Status {
  VALID,
  ABORTING,
  UPDATING
}

export interface IModel {
  order: CurrencyFair.IOrder
  profile: CurrencyFair.IProfile
  minSpread: ℚ.ℚ
  increment: ℚ.ℚ
  directQuote: Maybe.Maybe<ℚ.ℚ>
  indirectQuote: Maybe.Maybe<ℚ.ℚ>
  status: Status
}

export type Messages =
  | Message.DirectQuote
  | Message.IndirectQuote
  | CurrencyFair.Message.ApiError
  | CurrencyFair.Message.Empty
  | Empty;

export namespace Message {
  export class Type {
    public static readonly DirectQuote = 'DirectQuote'
    public static readonly IndirectQuote = 'IndirectQuote'
  }

  export class DirectQuote implements IMessage {
    public readonly type = Type.DirectQuote
    constructor(public readonly payload: {market: CurrencyFair.IMarketplace}) {}
  }

  export class IndirectQuote implements IMessage {
    public readonly type = Type.IndirectQuote
    constructor(public readonly payload: {market: CurrencyFair.IMarketplace}) {}
  }
}

export function Init({order, profile, minSpread, increment}: {order: CurrencyFair.IOrder, profile: CurrencyFair.IProfile, minSpread: ℚ.ℚ, increment: ℚ.ℚ}): IModel {
  return {
    order,
    profile,
    minSpread,
    increment,
    directQuote: Maybe.Nothing,
    indirectQuote: Maybe.Nothing,
    status: Status.VALID
  };
}

function SpreadUnder(state: IModel, message: Message.DirectQuote | Message.IndirectQuote): [IModel, E.Engine<Messages>] {
  const revisedSpread = Maybe.lift2((indirectQuote, directQuote) => {
    return compose(ℚ.multiplyBy(indirectQuote), ℚ.subtractTo(state.increment))(directQuote);
  }, state.indirectQuote, state.directQuote);

  switch(state.status) {
    case Status.VALID:
      return compose(
        Maybe.orSome<[IModel, E.Engine<Messages>], [IModel, E.Engine<Messages>]>([state, Noop()]),
        Maybe.map<ℚ.ℚ, [IModel, E.Engine<Messages>]>(() => [
          {...state, status: Status.ABORTING},
          CurrencyFair.cancelOrder2(state.profile, state.order)
        ]),
        Maybe.fmap(ℚ.isGreaterThan(state.minSpread))
      )(revisedSpread);
    default:
      return [state, Noop()];
  }
}

function SyncOrder(state: IModel, message: Message.DirectQuote | Message.IndirectQuote): [IModel, E.Engine<Messages>] {
  const rates = Maybe.lift2((lastEvent, directQuote) => {
    return [lastEvent.rate, directQuote] as [ℚ.ℚ, ℚ.ℚ];
  }, Maybe.of(state.order.events[state.order.events.length - 1]), state.directQuote);

  switch(state.status) {
    case Status.VALID:
      return compose(
        Maybe.orSome<[IModel, E.Engine<CurrencyFair.Message.Empty | CurrencyFair.Message.ApiError>], [IModel, E.Engine<Empty>]>([state, Noop()]),
        Maybe.map<ℚ.ℚ, [IModel, E.Engine<CurrencyFair.Message.Empty | CurrencyFair.Message.ApiError>]>(rate => [
          {...state, status: Status.UPDATING},
          CurrencyFair.updateOrder2(state.profile, {order: state.order, rate})
        ]),
        Maybe.fmap<[ℚ.ℚ, ℚ.ℚ], ℚ.ℚ>(([lastEventRate, directQuote]) => lastEventRate === directQuote ? Maybe.Nothing : Maybe.of(directQuote))
      )(rates);
    default:
      return [state, Noop()];
  }
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {

    case Message.Type.DirectQuote:
      const [spreadUnderState, spreadUnderEffect] = SpreadUnder({...state, directQuote: Maybe.of(message.payload.market.rate)}, message);
      const [syncOrderState, syncOrderEffect] = SyncOrder(spreadUnderState, message);

      return [
        syncOrderState,
        E.batch([
          spreadUnderEffect,
          syncOrderEffect
        ])
      ];

    case Message.Type.IndirectQuote:
      switch (state.status) {
        case Status.VALID:
          return SpreadUnder({...state, indirectQuote: Maybe.of(message.payload.market.rate)}, message);
        default:
          return [state, Noop()];
      }

    case CurrencyFair.Message.Type.Error:
    case CurrencyFair.Message.Type.Empty:
      return [
        {...state, status: Status.VALID},
        Noop()
      ];

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  const directQuote = E.map((message: Q.Message.ConsumeEvent<Markets.Message.Tick>) => {
    const market = message.payload.message.payload;
    return market.currencyBuy === state.order.currencyBuy && market.currencySell === state.order.currencySell ?
    new Message.DirectQuote({market}) : new Empty();
  })(Q.Subscribe2<Markets.Message.Tick>({topic: Markets.Message.Type.Tick}));
  const indirectQuote = E.map((message: Q.Message.ConsumeEvent<Markets.Message.Tick>) => {
    const market = message.payload.message.payload;
    return market.currencyBuy === state.order.currencySell && market.currencySell === state.order.currencyBuy ?
    new Message.IndirectQuote({market}) : new Empty();
  })(Q.Subscribe2<Markets.Message.Tick>({topic: Markets.Message.Type.Tick}));

  return E.batch<Messages>([
    directQuote,
    indirectQuote
  ]);
}