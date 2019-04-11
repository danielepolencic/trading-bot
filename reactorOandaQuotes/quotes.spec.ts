import * as test from 'tape';
import * as Actor from '../effect/actor';
import * as ℚ from '../monad/rational';
import * as Currency from '../currency';
import * as Oanda from '../oanda';
import * as Quotes from './quotes';
import * as E from '../effect/engine';
import * as Http from '../effect/http';
import * as Maybe from '../monad/maybe';

const profile: Oanda.IProfile = {
  url: '',
  token: '',
  accountId: ''
};

test('it should init', assert => {
  assert.plan(1);

  const model: Quotes.IModel = {queue: []};
  assert.deepEqual(Quotes.Init(), model);
});

test('it should add a quote', assert => {
  assert.plan(1);

  const state: Quotes.IModel = {queue: []};
  const quote: Quotes.IQuote = {currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile};

  const [newState, effect] = Quotes.Update(state, new Quotes.Message.AddQuoteRequest(quote));

  assert.deepEqual(newState.queue, [quote]);
});

test('it should fetch quotes', assert => {
  assert.plan(2);

  const quoteA: Quotes.IQuote = {currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile};
  const quoteB: Quotes.IQuote = {currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile};
  const state: Quotes.IModel = {queue: [quoteA, quoteB]};

  const [newState, effect] = Quotes.Update(state, new Quotes.Message.FetchAll());
  type Events =
    | Http.Message.ResponseEvent<any>
    | Quotes.Messages;

  const tree = E.run<Events>(function(message: Http.Message.RequestEffect) {
    return Promise.resolve(new Http.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Oanda.mockPrice)}))
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof Oanda.Message.Price))(tree);
});