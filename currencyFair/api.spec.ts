import * as test from 'tape';
import * as Api from './api';
import * as Entity from './entity';
import * as Token from './token';
import * as ℚ from '../monad/rational';
import * as Responses from './responses';
import * as Express from 'express';
import * as BodyParser from 'body-parser';
import * as Effects from '../effect/defaultEffects';
import * as Http from 'http';
import * as Currency from '../currency';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';
import * as S from '../effect/system';
import * as H from '../effect/http';
import * as Sinon from 'sinon';

import * as E from '../effect/engine';
import * as Scheduler from '../effect/scheduler';
import * as Q from '../effect/queue';
import * as Passthrough from '../effect/passthrough';

const profile: Entity.IProfile = {
  webUrl: '',
  apiUrl: 'https://api.currencyfair.com',
  username: 'daniele@uasabi.com',
  password: 'test123',
  twoFactorSecret: 'K4AB4BPLOYVQBP65',
  customerId: '190478'
};

test('it should get the quote', assert => {
  assert.plan(3);
  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/marketplaces/EUR/GBP`);
    effect.callback<Either.Either<Error, Entity.IMarketplace>>(Maybe.Nothing, ({statusCode: 200} as any) as H.HttpIncomingMessage, Maybe.of(JSON.parse(Responses.marketplace)))
      .then(Either.cata<Error, Entity.IMarketplace, void, void>(
        error => assert.fail(error.message),
        quote => {
          assert.equal(quote.rate, ℚ.parse(0.86));
      }))
      .catch(assert.fail);
  }, Api.getMarketplace(profile, {currencySell: Currency.EUR, currencyBuy: Currency.GBP}))
});

test('it should get the market #2', assert => {
  assert.plan(2);

  const effect = Api.getMarket2(profile, {currencySell: Currency.EUR, currencyBuy: Currency.GBP});
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFMarketplace>
    | Api.Message.ApiError
    | Api.Message.Market;

  const tree = E.run<Events>(function(effect: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(effect.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(effect.payload.args.uri, `${profile.apiUrl}/marketplaces/${Currency.EUR}/${Currency.GBP}`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFMarketplace>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.marketplace)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.deepEqual(message, new Api.Message.Market({market: {
      currencySell: Currency.EUR,
      currencyBuy: Currency.GBP,
      rate: ℚ.parse(0.86),
      status: Entity.MarketplaceStatus.OPEN
    }}));
  })(tree);
});

test('it should place an order', assert => {
  assert.plan(5);
  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.deepEqual(effect.args.json, {
      currencyTo: 'EUR',
      currencyFrom: 'GBP',
      type: 'SELL',
      amount: 10.12,
      rate: 1.47
    });
    assert.equal(effect.args.uri, `${profile.apiUrl}/marketplaceOrders`);
    assert.equal(effect.args.method, 'POST');
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 201} as any) as Http.IncomingMessage, JSON.parse(Responses.orderPending))
      .then(order => Either.cata<Error, Entity.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
          assert.equal(order.id, '228985295');
        })(order))
      .catch(assert.fail);
  }, Api.placeOrder(profile, {currencySell: Currency.GBP, currencyBuy: Currency.EUR, amount: ℚ.parse(10.12), rate: ℚ.parse(1.47)}));
});

test('it should place an order #2', assert => {
  assert.plan(5);
  const effect = Api.placeOrder2(profile, {currencySell: Currency.GBP, currencyBuy: Currency.EUR, amount: ℚ.parse(10.12), rate: ℚ.parse(1.47)});
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFOrder>
    | Api.Message.ApiError
    | Api.Message.Empty;

  const tree = E.run<Events>(function(effect: Token.Message.RequestEffect | H.Message.RequestEffect | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<Api.Message.OrderChanged>) {
    switch(effect.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.equal(effect.payload.args.uri, `${profile.apiUrl}/marketplaceOrders`);
        assert.equal(effect.payload.args.method, `POST`);
        assert.deepEqual(effect.payload.args.json, {
          currencyTo: 'EUR',
          currencyFrom: 'GBP',
          type: 'SELL',
          amount: 10.12,
          rate: 1.47
        });
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFOrder>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderPending)}));
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Api.Message.Empty());
      case Q.Message.Type.Publish:
        assert.equal(effect.payload.message.payload.id, '228985295');
        return Promise.resolve(new Api.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Api.Message.Empty()))(tree);
});

test('it should get a pending order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyPending))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
      error => assert.fail(error.message),
      order => {
        assert.equal(order.id, '236850805');
        assert.equal(order.currencySell, Currency.GBP);
        assert.equal(order.currencyBuy, Currency.EUR);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(5),
            amountBuy: ℚ.parse(5.7165),
            createdAt: (new Date(1477574245000)).toISOString(),
            rate: ℚ.parse(1.1433)
          }
        ] as Entity.IOrderEvent[]);
      })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a pending order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyPending)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236850805');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.GBP);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.EUR);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(5),
        amountBuy: ℚ.parse(5.7165),
        createdAt: (new Date(1477574245000)).toISOString(),
        rate: ℚ.parse(1.1433)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should get a cancelled order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyCancelled))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
      error => assert.fail(error.message),
      order => {
        assert.equal(order.id, '236842754');
        assert.equal(order.currencySell, Currency.GBP);
        assert.equal(order.currencyBuy, Currency.EUR);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(100),
            amountBuy: ℚ.parse(111.99),
            createdAt: (new Date(1477572436000)).toISOString(),
            rate: ℚ.parse(1.1199)
          },
          {
            type: Entity.OrderEventType.CANCELLED,
            amountSell: ℚ.parse(100),
            amountBuy: ℚ.parse(111.99),
            createdAt: (new Date(1477572468000)).toISOString(),
            rate: ℚ.parse(1.1199)
          }
        ] as Entity.IOrderEvent[]);
        assert.end();
    })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a cancelled order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyCancelled)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236842754');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.GBP);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.EUR);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(100),
        amountBuy: ℚ.parse(111.99),
        createdAt: (new Date(1477572436000)).toISOString(),
        rate: ℚ.parse(1.1199)
      },
      {
        type: Entity.OrderEventType.CANCELLED,
        amountSell: ℚ.parse(100),
        amountBuy: ℚ.parse(111.99),
        createdAt: (new Date(1477572468000)).toISOString(),
        rate: ℚ.parse(1.1199)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should get a completed order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyCompleted))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
      error => assert.fail(error.message),
      order => {
        assert.equal(order.id, '236782275');
        assert.equal(order.currencySell, Currency.GBP);
        assert.equal(order.currencyBuy, Currency.CHF);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(160),
            amountBuy: ℚ.parse(194.384),
            createdAt: (new Date(1477556437000)).toISOString(),
            rate: ℚ.parse(1.2149)
          },
          {
            type: Entity.OrderEventType.MATCHED,
            amountSell: ℚ.parse(160),
            amountBuy: ℚ.parse(194.384),
            createdAt: (new Date(1477556536000)).toISOString(),
            rate: ℚ.parse(1.2149)
          }
        ] as Entity.IOrderEvent[]);

        assert.end();
    })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a completed order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyCompleted)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236782275');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.GBP);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.CHF);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(160),
        amountBuy: ℚ.parse(194.384),
        createdAt: (new Date(1477556437000)).toISOString(),
        rate: ℚ.parse(1.2149)
      },
      {
        type: Entity.OrderEventType.MATCHED,
        amountSell: ℚ.parse(160),
        amountBuy: ℚ.parse(194.384),
        createdAt: (new Date(1477556536000)).toISOString(),
        rate: ℚ.parse(1.2149)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should get a partial pending order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyPartialProgress))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
      error => assert.fail(error.message),
      order => {
        assert.equal(order.id, '236844209');
        assert.equal(order.currencySell, Currency.GBP);
        assert.equal(order.currencyBuy, Currency.EUR);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(100),
            amountBuy: ℚ.parse(111.94),
            createdAt: (new Date(1477572844000)).toISOString(),
            rate: ℚ.parse(1.1194)
          },
          {
            type: Entity.OrderEventType.PART_MATCHED,
            amountSell: ℚ.parse(47.14),
            amountBuy: ℚ.parse(52.768516),
            createdAt: (new Date(1477572857000)).toISOString(),
            rate: ℚ.parse(1.1194)
          },
          {
            type: Entity.OrderEventType.UPDATED,
            amountSell: ℚ.parse(52.86),
            amountBuy: ℚ.parse(59.166198),
            createdAt: (new Date(1477573370000)).toISOString(),
            rate: ℚ.parse(1.1193)
          }
        ] as Entity.IOrderEvent[]);

        assert.end();
    })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a partial pending order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyPartialProgress)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236844209');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.GBP);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.EUR);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(100),
        amountBuy: ℚ.parse(111.94),
        createdAt: (new Date(1477572844000)).toISOString(),
        rate: ℚ.parse(1.1194)
      },
      {
        type: Entity.OrderEventType.PART_MATCHED,
        amountSell: ℚ.parse(47.14),
        amountBuy: ℚ.parse(52.768516),
        createdAt: (new Date(1477572857000)).toISOString(),
        rate: ℚ.parse(1.1194)
      },
      {
        type: Entity.OrderEventType.UPDATED,
        amountSell: ℚ.parse(52.86),
        amountBuy: ℚ.parse(59.166198),
        createdAt: (new Date(1477573370000)).toISOString(),
        rate: ℚ.parse(1.1193)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should get a partial cancelled order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyPartialCancelled))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
      error => assert.fail(error.message),
      order => {
        assert.equal(order.id, '236844209');
        assert.equal(order.currencySell, Currency.GBP);
        assert.equal(order.currencyBuy, Currency.EUR);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(100),
            amountBuy: ℚ.parse(111.94),
            createdAt: (new Date(1477572844000)).toISOString(),
            rate: ℚ.parse(1.1194)
          },
          {
            type: Entity.OrderEventType.PART_MATCHED,
            amountSell: ℚ.parse(47.14),
            amountBuy: ℚ.parse(52.768516),
            createdAt: (new Date(1477572857000)).toISOString(),
            rate: ℚ.parse(1.1194)
          },
          {
            type: Entity.OrderEventType.UPDATED,
            amountSell: ℚ.parse(52.86),
            amountBuy: ℚ.parse(59.166198),
            createdAt: (new Date(1477573370000)).toISOString(),
            rate: ℚ.parse(1.1193)
          },
          {
            type: Entity.OrderEventType.CANCELLED,
            amountSell: ℚ.parse(52.86),
            amountBuy: ℚ.parse(59.166198),
            createdAt: (new Date(1477573816000)).toISOString(),
            rate: ℚ.parse(1.1193)
          }
        ] as Entity.IOrderEvent[]);

        assert.end();
    })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a partial cancelled order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyPartialCancelled)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236844209');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.GBP);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.EUR);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(100),
        amountBuy: ℚ.parse(111.94),
        createdAt: (new Date(1477572844000)).toISOString(),
        rate: ℚ.parse(1.1194)
      },
      {
        type: Entity.OrderEventType.PART_MATCHED,
        amountSell: ℚ.parse(47.14),
        amountBuy: ℚ.parse(52.768516),
        createdAt: (new Date(1477572857000)).toISOString(),
        rate: ℚ.parse(1.1194)
      },
      {
        type: Entity.OrderEventType.UPDATED,
        amountSell: ℚ.parse(52.86),
        amountBuy: ℚ.parse(59.166198),
        createdAt: (new Date(1477573370000)).toISOString(),
        rate: ℚ.parse(1.1193)
      },
      {
        type: Entity.OrderEventType.CANCELLED,
        amountSell: ℚ.parse(52.86),
        amountBuy: ℚ.parse(59.166198),
        createdAt: (new Date(1477573816000)).toISOString(),
        rate: ℚ.parse(1.1193)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should get a partial completed order', assert => {
  assert.plan(6);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
    effect.callback<Either.Either<Error, Entity.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.historyPartialCompleted))
    .then(order => Either.cata<Error, Entity.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
        assert.equal(order.id, '236184631');
        assert.equal(order.currencySell, Currency.EUR);
        assert.equal(order.currencyBuy, Currency.GBP);
        assert.deepEqual(order.events, [
          {
            type: Entity.OrderEventType.CREATED,
            amountSell: ℚ.parse(453.06),
            amountBuy: ℚ.parse(403.812378),
            createdAt: (new Date(1477388607000)).toISOString(),
            rate: ℚ.parse(0.8913)
          },
          {
            type: Entity.OrderEventType.PART_MATCHED,
            amountSell: ℚ.parse(27.08),
            amountBuy: ℚ.parse(24.136404),
            createdAt: (new Date(1477388643000)).toISOString(),
            rate: ℚ.parse(0.8913)
          },
          {
            type: Entity.OrderEventType.MATCHED,
            amountSell: ℚ.parse(425.98),
            amountBuy: ℚ.parse(379.675974),
            createdAt: (new Date(1477388647000)).toISOString(),
            rate: ℚ.parse(0.8913)
          }
        ] as Entity.IOrderEvent[]);

        assert.end();
      })(order))
    .catch(assert.fail);
  }, Api.getOrder(profile, order));
});

test('it should get a partial completed order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: []
  };

  const effect = Api.getOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.historyPartialCompleted)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

 E.walk<Events>(message => {
    assert.equal((message as Api.Message.Order).payload.order.id, '236184631');
    assert.equal((message as Api.Message.Order).payload.order.currencySell, Currency.EUR);
    assert.equal((message as Api.Message.Order).payload.order.currencyBuy, Currency.GBP);
    assert.deepEqual((message as Api.Message.Order).payload.order.events, [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(453.06),
        amountBuy: ℚ.parse(403.812378),
        createdAt: (new Date(1477388607000)).toISOString(),
        rate: ℚ.parse(0.8913)
      },
      {
        type: Entity.OrderEventType.PART_MATCHED,
        amountSell: ℚ.parse(27.08),
        amountBuy: ℚ.parse(24.136404),
        createdAt: (new Date(1477388643000)).toISOString(),
        rate: ℚ.parse(0.8913)
      },
      {
        type: Entity.OrderEventType.MATCHED,
        amountSell: ℚ.parse(425.98),
        amountBuy: ℚ.parse(379.675974),
        createdAt: (new Date(1477388647000)).toISOString(),
        rate: ℚ.parse(0.8913)
      }
    ] as Entity.IOrderEvent[]);
  })(tree);
});

test('it should cancel a pending order', assert => {
  assert.plan(4);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: (new Date()).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.method, 'DELETE');
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
    assert.deepEqual(effect.args.qs, {amount: 20});
  }, Api.cancelOrder(profile, order));
});

test('it should cancel a pending order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: (new Date()).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.cancelOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFOrder>
    | Api.Message.ApiError
    | Api.Message.Empty;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<Api.Message.OrderChanged>) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
        assert.deepEqual(message.payload.args.method, `DELETE`);
        assert.deepEqual(message.payload.args.qs, {amount: 20});
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFOrder>({error: Maybe.Nothing, incomingMessage: {statusCode: 204} as any, response: Maybe.Nothing}));
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Api.Message.Empty());
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.id, '123');
        return Promise.resolve(new Api.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Api.Message.Empty()))(tree);
});

test('it should cancel a partial order', assert => {
  assert.plan(4);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        createdAt: (new Date()).toISOString()
      },
      {
        type: Entity.OrderEventType.PART_MATCHED,
        amountSell: ℚ.parse(5),
        amountBuy: ℚ.parse(2.5),
        rate: ℚ.parse(0.5),
        createdAt: (new Date(Date.now() + 1)).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.method, 'DELETE');
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
    assert.deepEqual(effect.args.qs, {amount: 15});
  }, Api.cancelOrder(profile, order));
});

test('it should cancel a partial order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        type: Entity.OrderEventType.CREATED,
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        createdAt: (new Date()).toISOString()
      },
      {
        type: Entity.OrderEventType.PART_MATCHED,
        amountSell: ℚ.parse(5),
        amountBuy: ℚ.parse(2.5),
        rate: ℚ.parse(0.5),
        createdAt: (new Date(Date.now() + 1)).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.cancelOrder2(profile, order);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFOrder>
    | Api.Message.ApiError
    | Api.Message.Empty;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<Api.Message.OrderChanged>) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
        assert.deepEqual(message.payload.args.method, `DELETE`);
        assert.deepEqual(message.payload.args.qs, {amount: 15});
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFOrder>({error: Maybe.Nothing, incomingMessage: {statusCode: 204} as any, response: Maybe.Nothing}));
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Api.Message.Empty());
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.id, '123');
        return Promise.resolve(new Api.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Api.Message.Empty()))(tree);
});

test('it should retrieve orders', assert => {
  assert.plan(52);

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.deepEqual(effect.args.qs, {page_size: 5});
    effect.callback<Either.Either<Error, Entity.IOrder[]>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.orders))
    .then(errorOrOrders => {
      [228985294, 228979568, 228978782, 228977096, 228977095, 228571785, 228366475, 228363434, 228334184, 228332456, 228281150, 228263007, 228260008, 228258821, 228258438, 228257950, 228257747, 223562637, 223562116, 223561925, 223561790, 223561640, 223560647, 223560239, 223560074]
      .forEach((id, index) => {
        Either.map((it: Entity.IOrder[]) => assert.equal(it[index].id, `${id}`))(errorOrOrders);
        Either.map((it: Entity.IOrder[]) => assert.ok(it[index].events.length === 0))(errorOrOrders);
      });
    })
    .catch(assert.fail);
  }, Api.getOrders(profile));
});

test('it should retrieve orders #2', assert => {
  assert.plan(50);
  const validOrders = [228985294, 228979568, 228978782, 228977096, 228977095, 228571785, 228366475, 228363434, 228334184, 228332456, 228281150, 228263007, 228260008, 228258821, 228258438, 228257950, 228257747, 223562637, 223562116, 223561925, 223561790, 223561640, 223560647, 223560239, 223560074];
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFOrders>
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        if (message.payload.args.uri === `${profile.apiUrl}/users/${profile.customerId}/orders`) {
          return Promise.resolve(new H.Message.ResponseEvent<Api.ICFOrders>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: JSON.parse(Responses.orders)}));
        }
        const urls = validOrders.map(it => `${profile.apiUrl}/users/${profile.customerId}/orders/${it}/history`);
        (urls.find(it => message.payload.args.uri === it)) ? assert.pass() : assert.fail();
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: JSON.parse(Responses.historyCompleted)}));
      default:
        assert.fail(`Unknown effect ${(message as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(Api.getOrders2(profile));

  E.walk<Events>(message => assert.ok(message instanceof Api.Message.Order))(tree);
});

test('it should fail while retriving empty orders #2', assert => {
  assert.plan(2);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFOrders>
    | H.Message.ResponseEvent<Api.ICFHistory>
    | Api.Message.ApiError
    | Api.Message.Order;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect | Api.Message.ApiError | Passthrough.Message.Event<Api.Message.ApiError>) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        if (message.payload.args.uri === `${profile.apiUrl}/users/${profile.customerId}/orders`) {
          return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: JSON.parse(Responses.ordersEmpty)}))
        }
        assert.fail();
        return Promise.reject(undefined);
      case Passthrough.Message.Type.Event:
        assert.pass();
        return Promise.resolve(message.payload.message);
      default:
        assert.fail(`Unknown effect ${(message as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(Api.getOrders2(profile));

  E.walk<Events>(message => assert.ok(message instanceof Api.Message.ApiError))(tree);
});

test('it should get a full summary', assert => {
  assert.plan(9);

  const interpreter = Sinon.stub();

  S.run(interpreter, Api.getBalance(profile));

  assert.ok(interpreter.firstCall.args[0] instanceof H.HttpCurrencyFairEffect);
  assert.equal((interpreter.firstCall.args[0] as H.HttpCurrencyFairEffect).args.uri, `${profile.apiUrl}/users/${profile.customerId}/summaries`);
  (interpreter.firstCall.args[0] as H.HttpCurrencyFairEffect).callback<Either.Either<Error, Entity.IBalance[]>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.fullBalance))
  .then(errorOrBalance => {
    Either.cata(
      (error: Error) => assert.fail(error.message),
      (balance: Entity.IBalance[]) => {
        assert.equal(balance.length, 6);
        assert.deepEqual(balance[0], {currency: Currency.CAD, available: ℚ.parse(0)});
        assert.deepEqual(balance[1], {currency: Currency.CHF, available: ℚ.parse(207.12)});
        assert.deepEqual(balance[2], {currency: Currency.EUR, available: ℚ.parse(117.38)});
        assert.deepEqual(balance[3], {currency: Currency.GBP, available: ℚ.parse(466.99)});
        assert.deepEqual(balance[4], {currency: Currency.NZD, available: ℚ.parse(9.03)});
        assert.deepEqual(balance[5], {currency: Currency.USD, available: ℚ.parse(0)});
      })(errorOrBalance);
  });
});

test('it should get a full summary #2', assert => {
  assert.plan(8);

  const effect = Api.getSummary2(profile);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFSummary>
    | Api.Message.ApiError
    | Api.Message.Summary;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/summaries`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFHistory>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.fullBalance)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Api.Message.Summary).payload.summary.length, 6);
    assert.deepEqual((message as Api.Message.Summary).payload.summary[0], {currency: Currency.CAD, available: ℚ.parse(0)});
    assert.deepEqual((message as Api.Message.Summary).payload.summary[1], {currency: Currency.CHF, available: ℚ.parse(207.12)});
    assert.deepEqual((message as Api.Message.Summary).payload.summary[2], {currency: Currency.EUR, available: ℚ.parse(117.38)});
    assert.deepEqual((message as Api.Message.Summary).payload.summary[3], {currency: Currency.GBP, available: ℚ.parse(466.99)});
    assert.deepEqual((message as Api.Message.Summary).payload.summary[4], {currency: Currency.NZD, available: ℚ.parse(9.03)});
    assert.deepEqual((message as Api.Message.Summary).payload.summary[5], {currency: Currency.USD, available: ℚ.parse(0)});
  })(tree);
});

test('it should get an empty summary', assert => {
  assert.plan(3);

  const interpreter = Sinon.stub();

  S.run(interpreter, Api.getBalance(profile));

  assert.ok(interpreter.firstCall.args[0] instanceof H.HttpCurrencyFairEffect);
  assert.equal((interpreter.firstCall.args[0] as H.HttpCurrencyFairEffect).args.uri, `${profile.apiUrl}/users/${profile.customerId}/summaries`);
  (interpreter.firstCall.args[0] as H.HttpCurrencyFairEffect).callback<Either.Either<Error, Entity.IBalance[]>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.emptyBalance))
  .then(errorOrBalance => {
    Either.cata(
      (error: Error) => assert.fail(error.message),
      (balance: Entity.IBalance[]) => {
        assert.equal(balance.length, 0);
      })(errorOrBalance);
  });
});

test('it should get an empty summary #2', assert => {
  assert.plan(2);

  const effect = Api.getSummary2(profile);
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<Api.ICFSummary>
    | Api.Message.ApiError
    | Api.Message.Summary;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/summaries`);
        return Promise.resolve(new H.Message.ResponseEvent<Api.ICFSummary>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.emptyBalance)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.equal((message as Api.Message.Summary).payload.summary.length, 0))(tree);
});

test('it should update a pending order', assert => {
  assert.plan(4);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: (new Date()).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  S.run((effect: H.HttpCurrencyFairEffect, q: Function) => {
    assert.ok(effect instanceof H.HttpCurrencyFairEffect);
    assert.equal(effect.args.method, 'PATCH');
    assert.equal(effect.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
    assert.deepEqual(effect.args.json, {rate: 1.11, amount: 20});
  }, Api.updateOrder(profile, {order, rate: ℚ.parse(1.11)}));
});

test('it should update a pending order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: (new Date()).toISOString()
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.updateOrder2(profile, {order, rate: ℚ.parse(1.11)});
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<void>
    | Api.Message.ApiError
    | Api.Message.Empty;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect | Q.Message.PublishEffect<Api.Message.OrderChanged> | Scheduler.Message.DelayEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
        assert.deepEqual(message.payload.args.method, `PATCH`);
        assert.deepEqual(message.payload.args.json, {
          amount: 20,
          rate: 1.11
        });
        return Promise.resolve(new H.Message.ResponseEvent<void>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: Maybe.Nothing}));
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Api.Message.Empty());
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.id, '123');
        return Promise.resolve(new Api.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Api.Message.Empty()))(tree);
});

test('it should not update a completed order #2', assert => {
  assert.plan(1);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: '2017-02-21T09:04:40.979Z'
      },
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.MATCHED,
        createdAt: '2017-02-21T09:04:48.921Z'
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.updateOrder2(profile, {order, rate: ℚ.parse(1.11)});

  const tree = E.run(function(message: any) {
    switch(message.type) {
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk(message => assert.ok(message instanceof Api.Message.ApiError))(tree);
});

test('it should not update a cancelled order #2', assert => {
  assert.plan(1);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: '2017-02-21T09:04:40.979Z'
      },
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CANCELLED,
        createdAt: '2017-02-21T09:04:48.921Z'
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.updateOrder2(profile, {order, rate: ℚ.parse(1.11)});
  const tree = E.run(function(message: any) {
    switch(message.type) {
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk(message => assert.ok(message instanceof Api.Message.ApiError))(tree);
});

test('it should update a partial order #2', assert => {
  assert.plan(5);

  const order: Entity.IOrder = {
    id: '123',
    currencySell: Currency.GBP,
    currencyBuy: Currency.EUR,
    events: [
      {
        amountSell: ℚ.parse(20),
        amountBuy: ℚ.parse(10),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.CREATED,
        createdAt: '2017-02-21T09:04:40.979Z'
      },
      {
        amountSell: ℚ.parse(10),
        amountBuy: ℚ.parse(5),
        rate: ℚ.parse(0.5),
        type: Entity.OrderEventType.PART_MATCHED,
        createdAt: '2017-02-21T09:04:48.921Z'
      }
    ] as Entity.IOrderEvent[]
  };

  const effect = Api.updateOrder2(profile, {order, rate: ℚ.parse(1.11)});
  type Events =
    | Token.Message.ResponseEvent
    | H.Message.ResponseEvent<void>
    | Api.Message.ApiError
    | Api.Message.Empty;

  const tree = E.run<Events>(function(message: Token.Message.RequestEffect | H.Message.RequestEffect | Q.Message.PublishEffect<Api.Message.OrderChanged> | Scheduler.Message.DelayEffect) {
    switch(message.type) {
      case Token.Message.Type.TokenRequest:
        return Promise.resolve(new Token.Message.ResponseEvent({token: 'abc'}));
      case H.Message.Type.Request:
        assert.deepEqual(message.payload.args.uri, `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`);
        assert.deepEqual(message.payload.args.method, `PATCH`);
        assert.deepEqual(message.payload.args.json, {
          amount: 10,
          rate: 1.11
        });
        return Promise.resolve(new H.Message.ResponseEvent<void>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: Maybe.Nothing}));
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Api.Message.Empty());
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.id, '123');
        return Promise.resolve(new Api.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Api.Message.Empty()))(tree);
});