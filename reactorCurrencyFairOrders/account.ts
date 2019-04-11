import * as CurrencyFair from '../currencyFair';
import * as E from '../effect/engine';
import {IMessage, Noop, Empty} from '../effect/message';
import * as Q from '../effect/queue';
import * as Scheduler from '../effect/scheduler';
import {compose} from '../utils';
import * as Maybe from '../monad/maybe';

export interface IModel {
  profile: CurrencyFair.IProfile
  snapshot: {[orderId: string]: CurrencyFair.IOrder}
}

export namespace Message {
  export class Type {
    static readonly Fetch = 'CurrencyFair.Account.FetchSummary'
    static readonly Summary = 'CurrencyFair.Account.Summary'
    static readonly OrderTick = 'CurrencyFair.Account.OrderTick'
    static readonly Tick = 'CurrencyFair.Account.Tick'
  }

  export class Fetch implements IMessage {
    readonly type = Type.Fetch
    constructor() {}
  }

  export class Tick implements IMessage {
    readonly type = Type.Tick
    constructor() {}
  }

  export class Summary implements IMessage {
    readonly type = Type.Summary
    constructor(public readonly payload: {summary: CurrencyFair.IBalance[], profile: CurrencyFair.IProfile}) {}
  }

  export class OrderTick implements IMessage {
    readonly type = Type.OrderTick
    constructor(public readonly payload: {order: CurrencyFair.IOrder, profile: CurrencyFair.IProfile}) {}
  }
}

export type Messages =
  | Message.Fetch
  | Scheduler.Message.DelayEvent
  | CurrencyFair.Message.ApiError
  | CurrencyFair.Message.Summary
  | CurrencyFair.Message.Order
  | Q.Message.ConsumeEvent<CurrencyFair.Message.OrderChanged>
  | CurrencyFair.Message.OrderChanged
  | Q.Message.AckEvent
  | Empty;

export function Init(profile: CurrencyFair.IProfile): IModel {
  return {profile, snapshot: {}};
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Message.Type.Fetch:
      return [
        {...state, snapshot: cleanup(state.snapshot)},
        E.batch<Messages>([
          CurrencyFair.getSummary2(state.profile),
          CurrencyFair.getOrders2(state.profile)
        ])
      ];

    case Scheduler.Message.Type.DelayEvent:
      const onlyPendingOrders = compose(Maybe.orSome<boolean, boolean>(false), Maybe.map(() => true), CurrencyFair.isPending);
      const requests = Object.keys(state.snapshot)
        .filter(orderId => onlyPendingOrders(state.snapshot[orderId]))
        .map(orderId => CurrencyFair.getOrder2(state.profile, state.snapshot[orderId]));
      return [
        state,
        E.batch(requests)
      ];

    case CurrencyFair.Message.Type.Order:
      return [
        {...state, snapshot: {...state.snapshot, [message.payload.order.id]: message.payload.order}},
        Q.Publish2({message: new Message.OrderTick({order: message.payload.order, profile: state.profile})})
      ];

    case CurrencyFair.Message.Type.Summary:
      return [
        state,
        Q.Publish2({message: new Message.Summary({summary: message.payload.summary, profile: state.profile})})
      ];

    case CurrencyFair.Message.Type.OrderChanged:
      return [
        state,
        CurrencyFair.getOrder2(state.profile, {id: message.payload.id})
      ];

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.batch<Messages>([
    Scheduler.Every2({ms: 15 * 1000}),
    E.map(() => new Message.Fetch())(Scheduler.Every2({ms: 60 * 1000})),
    Q.Subscribe2<CurrencyFair.Message.OrderChanged>({topic: CurrencyFair.Message.Type.OrderChanged})
  ]);
}

function cleanup(snapshot: {[id: string]: CurrencyFair.IOrder}): {[id: string]: CurrencyFair.IOrder} {
  const orders = Object.keys(snapshot).map(orderId => snapshot[orderId]);
  return CurrencyFair.sortOrders(orders).slice(0, 20).reduce((acc, it) => {
    acc[it.id] = it;
    return acc;
  }, {} as {[id: string]: CurrencyFair.IOrder});
}