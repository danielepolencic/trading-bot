import * as test from 'tape';
import * as ℚ from '../monad/rational';
import * as Currency from '../currency';
import * as CurrencyFair from '../currencyFair';
import * as Markets from './markets';
import * as Http from '../effect/http';
import * as E from '../effect/engine';
import * as Maybe from '../monad/maybe';

test('it should init', assert => {
  assert.plan(1);

  const model: Markets.IModel = {queue: []};

  assert.deepEqual(Markets.Init(), model);
});

test('it should add a marketplace', assert => {
  assert.plan(1);

  const state: Markets.IModel = {queue: []};
  const request: Markets.IMarket = {currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile: {webUrl: '', apiUrl: '', username: '', password: '', twoFactorSecret: '', customerId: '1'}};

  const [newState, effect] = Markets.Update(state, new Markets.Message.AddMarketRequest(request));

  assert.deepEqual(newState.queue, [request]);
});

test('it should fetch marketplaces', assert => {
  assert.plan(2);

  const marketA: Markets.IMarket = {currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile: {webUrl: '', apiUrl: '', username: '', password: '', twoFactorSecret: '', customerId: '1'}};
  const marketB: Markets.IMarket = {currencyBuy: Currency.USD, currencySell: Currency.CHF, profile: {webUrl: '', apiUrl: '', username: '', password: '', twoFactorSecret: '', customerId: '1'}};
  const state: Markets.IModel = {queue: [marketA, marketB]};

  const [newState, effect] = Markets.Update(state, new Markets.Message.FetchAll());
  type Events =
    | CurrencyFair.MessageToken.ResponseEvent
    | Http.Message.ResponseEvent<any>
    | Markets.Messages;

  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockMarketplace)}));
      default:
        assert.fail(`Unknown effect ${(message as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Market))(tree);
});