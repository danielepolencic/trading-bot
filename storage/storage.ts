import * as Q from '../effect/queue';
import * as Database from '../effect/database';
import * as Currency from '../currency';
import * as ℚ from '../monad/rational';
import * as MarketsCurrencyFair from '../reactorCurrencyFairMarkets/markets';
import * as QuotesOanda from '../reactorOandaQuotes/quotes';
import * as E from '../effect/engine';
import {Noop, Empty} from '../effect/message';

export interface IModel {}

export function Init(): IModel {
  return {};
}

export type Messages =
  | Q.Message.ConsumeEvent<MarketsCurrencyFair.Message.Tick>
  | Q.Message.ConsumeEvent<QuotesOanda.Message.Tick>
  | Empty;

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Q.Message.Type.Consume:

      switch(message.payload.message.type) {
        case MarketsCurrencyFair.Message.Type.Tick:
          return [
            state,
            Database.Set2<IQuoteTick>({
              key: `CurrencyFairQuotes:${message.payload.message.payload.currencyBuy}:${message.payload.message.payload.currencySell}`,
              value: {rate: message.payload.message.payload.rate, time: `${+ Date.now()}`}
            })
          ];
        case QuotesOanda.Message.Type.Tick:
          return [
            state,
            Database.Set2<IQuoteTick>({
              key: `OandaQuotes:${message.payload.message.payload.currencyBuy}:${message.payload.message.payload.currencySell}`,
              value: {rate: message.payload.message.payload.rate, time: `${+ Date.now()}`}
            })
          ];
        default:
          return [state, Noop()];
      }

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.batch<Messages>([
    Q.Subscribe2<MarketsCurrencyFair.Message.Tick>({topic: MarketsCurrencyFair.Message.Type.Tick}),
    Q.Subscribe2<QuotesOanda.Message.Tick>({topic: QuotesOanda.Message.Type.Tick})
  ]);
}

export interface IQuoteTick {
  rate: ℚ.ℚ
  time: string
}