import * as test from 'tape';
import * as PendingOrder from './pendingOrder';
import * as CurrencyFair from '../currencyFair';
import * as Currency from '../currency';
import * as ℚ from '../monad/rational';
import * as Effect from '../effect/defaultEffects';
import * as Maybe from '../monad/maybe';
import * as Http from '../effect/http';
import * as Identity from '../monad/identity';
import * as E from '../effect/engine';
import {Empty, Type} from '../effect/message';
import * as Passthrough from '../effect/passthrough';
import * as Scheduler from '../effect/scheduler';
import * as Q from '../effect/queue';

const marketEURGBP: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8550),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const marketEURGBPUpdated: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8549),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const marketGBPEUROver: CurrencyFair.IMarketplace = {
  currencySell: Currency.GBP,
  currencyBuy: Currency.EUR,
  rate: ℚ.parse(1.1725),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const marketGBPEURUnder: CurrencyFair.IMarketplace = {
  currencySell: Currency.GBP,
  currencyBuy: Currency.EUR,
  rate: ℚ.parse(1.1701),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const pendingCurrencyFairOrder: CurrencyFair.IOrder = {
  id: `1234`,
  currencySell: marketEURGBP.currencySell,
  currencyBuy: marketEURGBP.currencyBuy,
  events: [{
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: CurrencyFair.OrderEventType.CREATED,
    createdAt: (new Date()).toISOString()
  }, {
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.PART_MATCHED,
    createdAt: (new Date(+Date.now() + 1)).toISOString()
  }, {
    rate: ℚ.subtractTo(0.0001)(marketEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.UPDATED,
    createdAt: (new Date(+Date.now() + 2)).toISOString()
  }]
};

const completedCurrencyFairOrder: CurrencyFair.IOrder = {
  id: `1234`,
  currencySell: marketEURGBP.currencySell,
  currencyBuy: marketEURGBP.currencyBuy,
  events: [{
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: CurrencyFair.OrderEventType.CREATED,
    createdAt: '2017-01-22T10:59:44.759Z'
  }, {
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.PART_MATCHED,
    createdAt: '2017-01-22T10:59:44.760Z'
  }, {
    rate: ℚ.subtractTo(0.0001)(marketEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.UPDATED,
    createdAt: '2017-01-22T10:59:44.761Z'
  }, {
    rate: ℚ.subtractTo(0.0001)(marketEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: Identity.Do.of(marketEURGBP.rate)
      .map(ℚ.subtractTo(0.0001))
      .map(ℚ.multiplyBy(50))
      .extract(),
    type: CurrencyFair.OrderEventType.MATCHED,
    createdAt: '2017-01-22T10:59:44.762Z'
  }]
};

const profile: CurrencyFair.IProfile = {
  webUrl: '',
  apiUrl: '',
  username: '',
  password: '',
  twoFactorSecret: '',
  customerId: 'customerId'
};

test('it should init', assert => {
  assert.plan(1);

  const request = {order: pendingCurrencyFairOrder, profile, minSpread: ℚ.parse(0.002), increment: ℚ.parse(0.0001)};
  assert.deepEqual({...request, directQuote: Maybe.Nothing, indirectQuote: Maybe.Nothing, status: PendingOrder.Status.VALID}, PendingOrder.Init(request));
});

test('it should update a direct quote for the first time & sync the order', assert => {
  assert.plan(3);

  const state: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(1.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.Nothing,
    indirectQuote: Maybe.of(marketGBPEUROver.rate),
    status: PendingOrder.Status.VALID
  };

  const [newState, effect] = PendingOrder.Update(state, new PendingOrder.Message.DirectQuote({market: marketEURGBP}));

  type Events = PendingOrder.Messages | CurrencyFair.MessageToken.ResponseEvent | Http.Message.ResponseEvent<any>;
  const tree = E.run<Events>(function(message: Empty | Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect | Passthrough.Message.Event<any> | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<any>) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Type.Empty:
        return Promise.resolve(new Empty());
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: Maybe.Nothing}));
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Empty());
      case Q.Message.Type.Publish:
        return Promise.resolve(new Q.Message.AckEvent());
      default:
        assert.fail(`Unknown effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  let i = 0;
  assert.deepEqual(newState.directQuote, marketEURGBP.rate);
  E.walk<Events>(message => {
    i += 1;
    switch(i) {
      case 1:
        assert.ok(message instanceof Empty);
        break;
      case 2:
        assert.ok(message instanceof CurrencyFair.Message.Empty);
        break;
      default:
        return assert.fail();
    }
  })(tree);
});

test('it should cancel the order when the direct quote is not favourable', assert => {
  assert.plan(3);

  const state: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(1.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.Nothing,
    indirectQuote: Maybe.of(marketGBPEURUnder.rate),
    status: PendingOrder.Status.VALID
  };

  const [newState, effect] = PendingOrder.Update(state, new PendingOrder.Message.DirectQuote({market: marketEURGBPUpdated}));

  type Events = PendingOrder.Messages | CurrencyFair.MessageToken.ResponseEvent | Http.Message.ResponseEvent<any>;
  const tree = E.run<Events>(function(message: Empty | Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect | Passthrough.Message.Event<any> | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<any>) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Type.Empty:
        return Promise.resolve(new Empty());
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {statusCode: 204} as any, response: Maybe.Nothing}));
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Empty());
      case Q.Message.Type.Publish:
        return Promise.resolve(new Q.Message.AckEvent());
      default:
        assert.fail(`Unknown effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  let i = 0;
  assert.deepEqual(newState.status, PendingOrder.Status.ABORTING);
  E.walk<Events>(message => {
    i += 1;
    switch(i) {
      case 1:
        assert.ok(message instanceof Empty);
        break;
      case 2:
        assert.ok(message instanceof CurrencyFair.Message.Empty);
        break;
      default:
        return assert.fail();
    }
  })(tree);
});

test('it should update an indirect quote and ignore the spread', assert => {
  assert.plan(2);

  const state: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(1.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.of(marketEURGBP.rate),
    indirectQuote: Maybe.Nothing,
    status: PendingOrder.Status.VALID
  };

  const [newState, effect] = PendingOrder.Update(state, new PendingOrder.Message.IndirectQuote({market: marketGBPEUROver}));

  type Events = PendingOrder.Messages | CurrencyFair.MessageToken.ResponseEvent | Http.Message.ResponseEvent<any>;
  const tree = E.run<Events>(function(message: Empty | Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect | Passthrough.Message.Event<any> | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<any>) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Type.Empty:
        return Promise.resolve(new Empty());
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: Maybe.Nothing}));
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Empty());
      case Q.Message.Type.Publish:
        return Promise.resolve(new Q.Message.AckEvent());
      default:
        assert.fail(`Unknown effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  assert.deepEqual(newState.indirectQuote, marketGBPEUROver.rate);
  E.walk<Events>(message => assert.ok(message instanceof Empty))(tree);
});

test('it should update an indirect quote and cancel the order', assert => {
  assert.plan(2);

  const state: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(1.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.of(marketEURGBP.rate),
    indirectQuote: Maybe.Nothing,
    status: PendingOrder.Status.VALID
  };

  const [newState, effect] = PendingOrder.Update(state, new PendingOrder.Message.IndirectQuote({market: marketGBPEURUnder}));

  type Events = PendingOrder.Messages | CurrencyFair.MessageToken.ResponseEvent | Http.Message.ResponseEvent<any>;
  const tree = E.run<Events>(function(message: Empty | Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect | Passthrough.Message.Event<any> | Scheduler.Message.DelayEffect | Q.Message.PublishEffect<any>) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Type.Empty:
        return Promise.resolve(new Empty());
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {statusCode: 204} as any, response: Maybe.Nothing}));
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      case Scheduler.Message.Type.DelayEffect:
        return Promise.resolve(new Empty());
      case Q.Message.Type.Publish:
        return Promise.resolve(new Q.Message.AckEvent());
      default:
        assert.fail(`Unknown effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  assert.deepEqual(newState.status, PendingOrder.Status.ABORTING);
  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Empty))(tree);
});

test('it should unlock the order', assert => {
  assert.plan(1);

  const state: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(1.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.of(marketEURGBP.rate),
    indirectQuote: Maybe.of(marketGBPEUROver.rate),
    status: PendingOrder.Status.UPDATING
  };

  const [newState, effect] = PendingOrder.Update(state, new CurrencyFair.Message.Empty());

  assert.equal(newState.status, PendingOrder.Status.VALID);
});