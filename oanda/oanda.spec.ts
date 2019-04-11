import * as test from 'tape';
import * as Oanda from './index';
import * as ℚ from '../monad/rational';
import * as Responses from './responses';
import * as Http from 'http';
import * as Currency from '../currency';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';
import * as S from '../effect/system';
import * as H from '../effect/http';
import * as Sinon from 'sinon';

import * as E from '../effect/engine';
import {compose} from '../utils';
import * as Q from '../effect/queue';
import {Empty} from '../effect/message';

const profile: Oanda.IProfile = {
  url: 'http://localhost:4567',
  token: '523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c',
  accountId: '101-004-3555295-001'
};

const longOrder: Oanda.IOrder = {
  id: '1',
  currencyBuy: Currency.EUR,
  currencySell: Currency.USD,
  price: ℚ.parse(1.01),
  pl: ℚ.parse(0),
  units: ℚ.parse(10)
};

const shortOrder: Oanda.IOrder = {
  id: '2',
  currencyBuy: Currency.USD,
  currencySell: Currency.EUR,
  price: ℚ.parse(1.01),
  pl: ℚ.parse(0),
  units: ℚ.parse(10)
};

test('it should retrieve a single price', assert => {
  assert.plan(5);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/pricing`);
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    assert.deepEqual(effect.args.qs, {instruments: `EUR_GBP`});
    effect.callback<Either.Either<Error, Oanda.IPrice>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.price)).then(oandaPrice => {
      Either.cata<Error, Oanda.IPrice, void, void>(
        error => assert.fail(error.message),
        oandaPrice => assert.equal(oandaPrice.price, ℚ.parse(0.8585)))
        (oandaPrice);
    })
    .catch(assert.fail);
  }, Oanda.getPrice(profile, {currencyBuy: Currency.GBP, currencySell: Currency.EUR}));
});

test('it should retrieve a single price #2', assert => {
  assert.plan(3);

  const effect = Oanda.getPrice2(profile, {currencyBuy: Currency.GBP, currencySell: Currency.EUR});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Price;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/pricing`);
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.price)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.equal((message as Oanda.Message.Price).payload.price.price, ℚ.parse(0.8585)))(tree);
});

test('it should handle an invalid instrument', assert => {
  assert.plan(5);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/pricing`);
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    assert.deepEqual(effect.args.qs, {instruments: `EUR_GBP`})
    effect.callback<Either.Either<Error, Oanda.IPrice>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.price)).then(oandaPrice => {
      Either.cata<Error, Oanda.IPrice, void, void>(
        error => assert.fail(error.message),
        oandaPrice => assert.equal(oandaPrice.price, ℚ.inverse(ℚ.parse(0.8585))))
        (oandaPrice);
    })
    .catch(assert.fail);
  }, Oanda.getPrice(profile, {currencySell: Currency.GBP, currencyBuy: Currency.EUR}));
});

test('it should handle an invalid instrument #2', assert => {
  assert.plan(3);

  const effect = Oanda.getPrice2(profile, {currencySell: Currency.GBP, currencyBuy: Currency.EUR});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Price;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/pricing`);
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.price)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.equal((message as Oanda.Message.Price).payload.price.price, compose(ℚ.inverse, ℚ.parse)(0.8585)))(tree);
});

test('it should process a LONG order', assert => {
  assert.plan(11);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/orders`);
    assert.equal(effect.args.method, 'POST');
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    assert.deepEqual(effect.args.json, {
      order: {
        instrument: `EUR_USD`,
        units: '5',
        type: 'MARKET'
      }
    });
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 201} as any) as Http.IncomingMessage, JSON.parse(Responses.orderLong))
      .then(order => Either.cata<Error, Oanda.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
          assert.equal(order.id, '251');
          assert.equal(order.currencyBuy, Currency.EUR);
          assert.equal(order.currencySell, Currency.USD);
          assert.equal(order.price, ℚ.inverse(ℚ.parse(1.11446)));
          assert.equal(order.pl, ℚ.parse(0));
          assert.equal(order.units, ℚ.parse(5));
        })
        (order))
      .catch(assert.fail);
  }, Oanda.openPosition(profile, {
    currencyBuy: Currency.EUR,
    currencySell: Currency.USD,
    amount: ℚ.parse(5),
  }));
});

test('it should process a LONG order #2', assert => {
  assert.plan(11);

  const effect = Oanda.openPosition2(profile, {
    currencyBuy: Currency.EUR,
    currencySell: Currency.USD,
    amount: ℚ.parse(5),
  });
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/orders`);
        assert.equal(message.payload.args.method, `POST`);
        assert.deepEqual(message.payload.args.json, {
          order: {
            instrument: `EUR_USD`,
            units: '5',
            type: 'MARKET'
          }
        });
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderLong)}));
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.order.id, '251');
        assert.equal(message.payload.message.payload.order.currencyBuy, Currency.EUR);
        assert.equal(message.payload.message.payload.order.currencySell, Currency.USD);
        assert.equal(message.payload.message.payload.order.price, compose(ℚ.inverse, ℚ.parse)(1.11446));
        assert.equal(message.payload.message.payload.order.pl, ℚ.parse(0));
        assert.equal(message.payload.message.payload.order.units, ℚ.parse(5));
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should process a SHORT order', assert => {
  assert.plan(11);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/orders`);
    assert.equal(effect.args.method, 'POST');
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    assert.deepEqual(effect.args.json, {
      order: {
        instrument: `EUR_USD`,
        units: '-5',
        type: 'MARKET'
      }
    });
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 201} as any) as Http.IncomingMessage, JSON.parse(Responses.orderLong))
      .then(order => Either.cata<Error, Oanda.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
          assert.equal(order.id, '251');
          assert.equal(order.currencyBuy, Currency.USD);
          assert.equal(order.currencySell, Currency.EUR);
          assert.deepEqual(order.price, ℚ.parse(1.11446));
          assert.deepEqual(order.pl, ℚ.parse(0));
          assert.deepEqual(order.units, ℚ.parse(5));
        })
        (order))
      .catch(assert.fail);
  }, Oanda.openPosition(profile, {
    currencyBuy: Currency.USD,
    currencySell: Currency.EUR,
    amount: ℚ.parse(5),
  }));
});

test('it should process a SHORT order #2', assert => {
  assert.plan(11);

  const interpreter = Sinon.stub();
  const effect = Oanda.openPosition2(profile, {
    currencyBuy: Currency.USD,
    currencySell: Currency.EUR,
    amount: ℚ.parse(5),
  });
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  interpreter
    .withArgs(Sinon.match((message: any) => message instanceof H.Message.RequestEffect))
    .callsArgWith(1, new H.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderShort)}));

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/orders`);
        assert.equal(message.payload.args.method, `POST`);
        assert.deepEqual(message.payload.args.json, {
          order: {
            instrument: `EUR_USD`,
            units: '-5',
            type: 'MARKET'
          }
        });
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderLong)}));
      case Q.Message.Type.Publish:
        assert.equal(message.payload.message.payload.order.id, '251');
        assert.equal(message.payload.message.payload.order.currencyBuy, Currency.USD);
        assert.equal(message.payload.message.payload.order.currencySell, Currency.EUR);
        assert.equal(message.payload.message.payload.order.price, ℚ.parse(1.11446));
        assert.equal(message.payload.message.payload.order.pl, ℚ.parse(0));
        assert.equal(message.payload.message.payload.order.units, ℚ.parse(5));
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should close a LONG trade', assert => {
  assert.plan(6);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}/close`);
    assert.equal(effect.args.method, 'PUT');
    assert.deepEqual(effect.args.json, {units: '10'});
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.orderLong))
      .then(order => Either.cata<Error, Oanda.IOrder, void, void>(
        error => assert.fail(error.message),
        order => assert.ok(order))
        (order))
      .catch(assert.fail);
  }, Oanda.closePosition(profile, {order: longOrder, units: longOrder.units}));
});

test('it should close a LONG trade #2', assert => {
  assert.plan(5);

  const effect = Oanda.closePosition2(profile, {order: longOrder, units: longOrder.units});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}/close`);
        assert.equal(message.payload.args.method, 'PUT');
        assert.deepEqual(message.payload.args.json, {units: '10'});
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderLong)}));
      case Q.Message.Type.Publish:
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should close a SHORT trade #2', assert => {
  assert.plan(5);

  const effect = Oanda.closePosition2(profile, {order: shortOrder, units: shortOrder.units});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}/close`);
        assert.equal(message.payload.args.method, 'PUT');
        assert.deepEqual(message.payload.args.json, {units: '10'});
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderShort)}));
      case Q.Message.Type.Publish:
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should close a partial LONG trade #2', assert => {
  assert.plan(5);

  const effect = Oanda.closePosition2(profile, {order: longOrder, units: ℚ.parse(5)});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}/close`);
        assert.equal(message.payload.args.method, 'PUT');
        assert.deepEqual(message.payload.args.json, {units: '5'});
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderLong)}));
      case Q.Message.Type.Publish:
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should close a partial SHORT trade #2', assert => {
  assert.plan(5);

  const effect = Oanda.closePosition2(profile, {order: shortOrder, units: ℚ.parse(5)});
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Empty;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect | Q.Message.PublishEffect<Oanda.Message.OrderChanged>) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}/close`);
        assert.equal(message.payload.args.method, 'PUT');
        assert.deepEqual(message.payload.args.json, {units: '5'});
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.orderShort)}));
      case Q.Message.Type.Publish:
        return Promise.resolve(new Oanda.Message.Empty());
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.deepEqual(message, new Oanda.Message.Empty()))(tree);
});

test('it should close a SHORT trade', assert => {
  assert.plan(6);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}/close`);
    assert.equal(effect.args.method, 'PUT');
    assert.deepEqual(effect.args.json, {units: '10'});
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.orderLong))
      .then(order => Either.map(order => assert.ok(order))(order))
      .catch(assert.fail);
  }, Oanda.closePosition(profile, {order: shortOrder, units: shortOrder.units}));
});

test('it should close a partial LONG trade', assert => {
  assert.plan(5);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}/close`);
    assert.equal(effect.args.method, 'PUT');
    assert.deepEqual(effect.args.json, {units: '5'});
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
  }, Oanda.closePosition(profile, {order: longOrder, units: ℚ.parse(5)}));
});

test('it should close a partial SHORT trade', assert => {
  assert.plan(5);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}/close`);
    assert.equal(effect.args.method, 'PUT');
    assert.deepEqual(effect.args.json, {units: '5'});
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
  }, Oanda.closePosition(profile, {order: shortOrder, units: ℚ.parse(5)}));
});

test('it should retrieve a LONG trade', assert => {
  assert.plan(8);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}`);
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.tradeLong))
      .then(order => Either.cata<Error, Oanda.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
          assert.equal(order.currencySell, Currency.USD);
          assert.equal(order.currencyBuy, Currency.EUR);
          assert.equal(order.price, ℚ.inverse(ℚ.parse(1.13033)));
          assert.equal(order.pl, ℚ.parse(-0.01438));
          assert.equal(order.units, ℚ.parse(100));
        })
        (order))
      .catch(assert.fail);
  }, Oanda.getPosition(profile, longOrder));
});

test('it should retrieve a LONG trade #2', assert => {
  assert.plan(6);

  const effect = Oanda.getPosition2(profile, longOrder);
    type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Order;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${longOrder.id}`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.tradeLong)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Oanda.Message.Order).payload.order.currencySell, Currency.USD);
    assert.equal((message as Oanda.Message.Order).payload.order.currencyBuy, Currency.EUR);
    assert.equal((message as Oanda.Message.Order).payload.order.price, compose(ℚ.inverse, ℚ.parse)(1.13033));
    assert.equal((message as Oanda.Message.Order).payload.order.pl, ℚ.parse(-0.01438));
    assert.equal((message as Oanda.Message.Order).payload.order.units, ℚ.parse(100));
  })(tree);
});

test('it should retrieve a SHORT trade #2', assert => {
  assert.plan(6);

  const effect = Oanda.getPosition2(profile, shortOrder);
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Order;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.tradeShort)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Oanda.Message.Order).payload.order.currencySell, Currency.EUR);
    assert.equal((message as Oanda.Message.Order).payload.order.currencyBuy, Currency.USD);
    assert.equal((message as Oanda.Message.Order).payload.order.price, ℚ.parse(1.13033));
    assert.equal((message as Oanda.Message.Order).payload.order.pl, ℚ.parse(-0.01438));
    assert.equal((message as Oanda.Message.Order).payload.order.units, ℚ.parse(100));
  })(tree);
});

test('it should retrieve a SHORT trade', assert => {
  assert.plan(8);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades/${shortOrder.id}`);
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    effect.callback<Either.Either<Error, Oanda.IOrder>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.tradeShort))
      .then(order => Either.cata<Error, Oanda.IOrder, void, void>(
        error => assert.fail(error.message),
        order => {
          assert.equal(order.currencySell, Currency.EUR);
          assert.equal(order.currencyBuy, Currency.USD);
          assert.equal(order.price, ℚ.parse(1.13033));
          assert.equal(order.pl, ℚ.parse(-0.01438));
          assert.equal(order.units, ℚ.parse(100));
        })
        (order))
      .catch(assert.fail);
  }, Oanda.getPosition(profile, shortOrder));
});

test('it should retrieve all open orders', assert => {
  assert.plan(13);

  S.run((effect: H.HttpEffect, next: Function) => {
    assert.ok(effect instanceof H.HttpEffect);
    assert.equal(effect.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades`);
    assert.equal(effect.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
    effect.callback<Either.Either<Error, Oanda.IOrder[]>>(Maybe.Nothing, ({statusCode: 200} as any) as Http.IncomingMessage, JSON.parse(Responses.trades))
      .then(order => Either.cata<Error, Oanda.IOrder[], void, void>(
        error => assert.fail(error.message),
        orders => {
          assert.equal(orders[0].currencySell, Currency.GBP);
          assert.equal(orders[0].currencyBuy, Currency.JPY);
          assert.equal(orders[0].price, ℚ.parse(144.290));
          assert.equal(orders[0].pl, ℚ.parse(-0.0263));
          assert.equal(orders[0].units, ℚ.parse(100));
          assert.equal(orders[1].currencySell, Currency.USD);
          assert.equal(orders[1].currencyBuy, Currency.EUR);
          assert.equal(orders[1].price, ℚ.inverse(ℚ.parse(1.06254)));
          assert.equal(orders[1].pl, ℚ.parse(-0.0119));
          assert.equal(orders[1].units, ℚ.parse(100));
        })
        (order))
      .catch(assert.fail);
  }, Oanda.getPositions(profile));
});

test('it should retrieve all open orders #2', assert => {
  assert.plan(12);

  const effect = Oanda.getPositions2(profile);
  type Events =
    | H.Message.ResponseEvent<any>
    | Oanda.Message.ApiError
    | Oanda.Message.Orders;

  const tree = E.run<Events>(function(message: H.Message.RequestEffect) {
    switch(message.type) {
      case H.Message.Type.Request:
        assert.equal(message.payload.args.uri, `${profile.url}/v3/accounts/${profile.accountId}/trades`);
        assert.equal(message.payload.args.headers.Authorization, `Bearer 523b578178d73b5afa3327681e3a1fed-d93df70e93641d80b4890a0fd284755c`);
        return Promise.resolve(new H.Message.ResponseEvent({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(Responses.trades)}));
      default:
        assert.fail(`Unknown effect ${(effect as any).constructor.name}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => {
    assert.equal((message as Oanda.Message.Orders).payload.orders[0].currencySell, Currency.GBP);
    assert.equal((message as Oanda.Message.Orders).payload.orders[0].currencyBuy, Currency.JPY);
    assert.equal((message as Oanda.Message.Orders).payload.orders[0].price, ℚ.parse(144.290));
    assert.equal((message as Oanda.Message.Orders).payload.orders[0].pl, ℚ.parse(-0.0263));
    assert.equal((message as Oanda.Message.Orders).payload.orders[0].units, ℚ.parse(100));
    assert.equal((message as Oanda.Message.Orders).payload.orders[1].currencySell, Currency.USD);
    assert.equal((message as Oanda.Message.Orders).payload.orders[1].currencyBuy, Currency.EUR);
    assert.equal((message as Oanda.Message.Orders).payload.orders[1].price, ℚ.inverse(ℚ.parse(1.06254)));
    assert.equal((message as Oanda.Message.Orders).payload.orders[1].pl, ℚ.parse(-0.0119));
    assert.equal((message as Oanda.Message.Orders).payload.orders[1].units, ℚ.parse(100));
  })(tree);
});