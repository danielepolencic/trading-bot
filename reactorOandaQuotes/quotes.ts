import * as S from '../effect/system';
import * as Scheduler from '../effect/scheduler';
import * as Oanda from '../oanda';
import * as Currency from '../currency';
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
    static readonly AddQuoteRequest = 'Oanda.Quotes.AddQuoteRequest'
    static readonly FetchAll = 'Oanda.Quotes.FetchAll'
    static readonly Tick = 'Oanda.Quotes.Tick'
  }

  export class AddQuoteRequest implements IMessage {
    readonly type = Type.AddQuoteRequest
    constructor(public readonly payload: IQuote) {}
  }

  export class FetchAll implements IMessage {
    readonly type = Type.FetchAll
    constructor() {}
  }

  export class Tick implements IMessage {
    readonly type = Type.Tick
    constructor(public readonly payload: IQuoteTick) {}
  }
}

export type Messages =
  | Message.AddQuoteRequest
  | Message.FetchAll
  | Oanda.Message.ApiError
  | Oanda.Message.Price
  | Q.Message.AckEvent
  | Empty;

export interface IQuote {
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
  profile: Oanda.IProfile
}

export interface IModel {
  queue: IQuote[]
}

export function Init(): IModel {
  return {queue: []};
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Message.Type.AddQuoteRequest:
      return [
        {...state, queue: state.queue.concat(message.payload)},
        Noop()
      ];

    case Message.Type.FetchAll:
      const requests = state.queue.map(it => Oanda.getPrice2(it.profile, {currencyBuy: it.currencyBuy, currencySell: it.currencySell}))
      return [
        state,
        E.batch(requests)
      ];

    case Oanda.Message.Type.Price:
      return [
        state,
        Q.Publish2({message: new Message.Tick({
          rate: message.payload.price.price,
          currencyBuy: message.payload.price.currencyBuy,
          currencySell: message.payload.price.currencySell
        })})
      ];

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.map(() => new Message.FetchAll())(Scheduler.Every2({ms: 10 * 1000}));
}