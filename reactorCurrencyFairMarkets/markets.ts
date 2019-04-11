import * as Scheduler from '../effect/scheduler';
import * as Currency from '../currency';
import * as CurrencyFair from '../currencyFair';
import * as E from '../effect/engine';
import {IMessage, Empty, Noop} from '../effect/message';
import * as ℚ from '../monad/rational';
import * as Q from '../effect/queue';

export interface IQuoteTick {
  rate: ℚ.ℚ
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
}

export namespace Message {
  export class Type {
    static readonly AddMarketRequest = 'CurrencyFair.Quotes.AddMarketRequest'
    static readonly FetchAll = 'CurrencyFair.Quotes.FetchAll'
    static readonly Tick = 'CurrencyFair.Quotes.Tick'
  }

  export class AddMarketRequest implements IMessage {
    readonly type = Type.AddMarketRequest
    constructor(public readonly payload: IMarket) {}
  }

  export class FetchAll implements IMessage {
    readonly type = Type.FetchAll
    constructor() {}
  }

  export class Tick implements IMessage {
    readonly type = Type.Tick
    constructor(public readonly payload: CurrencyFair.IMarketplace) {}
  }
}

export type Messages =
  | Message.AddMarketRequest
  | Message.FetchAll
  | CurrencyFair.Message.ApiError
  | CurrencyFair.Message.Market
  | Q.Message.AckEvent
  | Empty;

export interface IMarket {
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
  profile: CurrencyFair.IProfile
}

export interface IModel {
  queue: IMarket[]
}

export function Init(): IModel {
  return {queue: []};
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Message.Type.AddMarketRequest:
      return [
        {...state, queue: state.queue.concat(message.payload)},
        Noop()
      ];

    case Message.Type.FetchAll:
      const requests = state.queue.map(it => CurrencyFair.getMarket2(it.profile, {currencyBuy: it.currencyBuy, currencySell: it.currencySell}))
      return [
        state,
        E.batch(requests)
      ];

    case CurrencyFair.Message.Type.Market:
      return [
        state,
        Q.Publish2({message: new Message.Tick(message.payload.market)})
      ];

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.map(() => new Message.FetchAll())(Scheduler.Every2({ms: 15 * 1000}));
}