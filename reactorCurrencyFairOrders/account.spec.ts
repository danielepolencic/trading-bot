import * as test from 'tape';
import * as Account from './account';
import * as Currency from '../currency';
import * as CurrencyFair from '../currencyFair';
import * as Sinon from 'sinon';
import * as Q from '../effect/queue';
import * as Http from '../effect/http';
import * as ℚ from '../monad/rational';
import * as Identity from '../monad/identity';
import * as E from '../effect/engine';
import * as Maybe from '../monad/maybe';
import * as Scheduler from '../effect/scheduler';
import {Empty} from '../effect/message';

const quoteEURGBP: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8550),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const quoteEURGBPUpdated: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8540),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

const completedCurrencyFairOrder: CurrencyFair.IOrder = {
  id: `1234`,
  currencySell: quoteEURGBP.currencySell,
  currencyBuy: quoteEURGBP.currencyBuy,
  events: [{
    rate: quoteEURGBP.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: CurrencyFair.OrderEventType.CREATED,
    createdAt: '2017-01-22T10:59:44.759Z'
  }, {
    rate: quoteEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURGBP.rate),
    type: CurrencyFair.OrderEventType.PART_MATCHED,
    createdAt: '2017-01-22T10:59:44.760Z'
  }, {
    rate: ℚ.subtractTo(0.0001)(quoteEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURGBP.rate),
    type: CurrencyFair.OrderEventType.UPDATED,
    createdAt: '2017-01-22T10:59:44.761Z'
  }, {
    rate: ℚ.subtractTo(0.0001)(quoteEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: Identity.Do.of(quoteEURGBP.rate)
      .map(ℚ.subtractTo(0.0001))
      .map(ℚ.multiplyBy(50))
      .extract(),
    type: CurrencyFair.OrderEventType.MATCHED,
    createdAt: '2017-01-22T10:59:44.762Z'
  }]
};

const pendingCurrencyFairOrder: CurrencyFair.IOrder = {
  id: `1234`,
  currencySell: quoteEURGBP.currencySell,
  currencyBuy: quoteEURGBP.currencyBuy,
  events: [{
    rate: quoteEURGBP.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: CurrencyFair.OrderEventType.CREATED,
    createdAt: '2017-01-22T10:59:44.759Z'
  }, {
    rate: quoteEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURGBP.rate),
    type: CurrencyFair.OrderEventType.PART_MATCHED,
    createdAt: '2017-01-22T10:59:44.760Z'
  }, {
    rate: ℚ.subtractTo(0.0001)(quoteEURGBP.rate),
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURGBP.rate),
    type: CurrencyFair.OrderEventType.UPDATED,
    createdAt: '2017-01-22T10:59:44.761Z'
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

const summary: CurrencyFair.IBalance[] = [
  {
    currency: Currency.GBP,
    available: ℚ.parse(10)
  }
];

test('it should init', assert => {
  assert.plan(1);

  const state = Account.Init(profile);
  assert.deepEqual(state, {profile, snapshot: []});
});

test('it should remove old orders', assert => {
  assert.plan(2);

  const pendingOrders: CurrencyFair.IOrder[] = Array.from(Array(21).keys()).map(id => ({...pendingCurrencyFairOrder, id: `${id}`}))
  const snapshot: {[orderId: string]: CurrencyFair.IOrder} = pendingOrders.concat([completedCurrencyFairOrder]).reduce((acc, it) => {
    acc[it.id] = it;
    return acc;
  }, {} as {[orderId: string]: CurrencyFair.IOrder});
  const state: Account.IModel = {profile, snapshot};

  const [newState, effect] = Account.Update(state, new Account.Message.Fetch());

  assert.equal(Object.keys(newState.snapshot).length, 20);
  assert.ok(Object.keys(newState.snapshot).find(orderId => orderId === completedCurrencyFairOrder.id));
});

test('it should retrieve a summary', assert => {
  assert.plan(1);

  const state: Account.IModel = {profile, snapshot: {}};
  const [newState, effect] = Account.Update(state, new Account.Message.Fetch());

  type Events = Account.Messages | Http.Message.ResponseEvent<any> | CurrencyFair.MessageToken.ResponseEvent;
  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        if (message.payload.args.uri.endsWith('summaries')) {
          return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockBalance)}));
        }
        return Promise.reject(undefined);
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Summary))(tree);
});

test('it should retrieve the orders', assert => {
  assert.plan(25);

  const state: Account.IModel = {profile, snapshot: {}};
  const [newState, effect] = Account.Update(state, new Account.Message.Fetch());

  type Events = Account.Messages | Http.Message.ResponseEvent<any> | CurrencyFair.MessageToken.ResponseEvent;
  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        if (message.payload.args.uri.endsWith('orders')) {
          return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockOrders)}));
        }
        if (message.payload.args.uri.endsWith('history')) {
          return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockHistory)}));
        }
        return Promise.reject(undefined);
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Order))(tree);
});

test('it should retrieve pending orders', assert => {
  assert.plan(1);

  const state: Account.IModel = {profile, snapshot: {
    [completedCurrencyFairOrder.id]: completedCurrencyFairOrder,
    [pendingCurrencyFairOrder.id]: pendingCurrencyFairOrder
  }};
  const [newState, effect] = Account.Update(state, new Scheduler.Message.DelayEvent());

  type Events = Account.Messages | Http.Message.ResponseEvent<any> | CurrencyFair.MessageToken.ResponseEvent;
  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockHistory)}));
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Order))(tree);
});

test('it should add an order', assert => {
  assert.plan(2);

  const state: Account.IModel = {profile, snapshot: {}};

  const [newState, effect] = Account.Update(state, new CurrencyFair.Message.Order({order: completedCurrencyFairOrder}));

  assert.equal(Object.keys(newState.snapshot).length, 1);
  assert.deepEqual(newState.snapshot[completedCurrencyFairOrder.id], completedCurrencyFairOrder);
});

test('it should broadcast an order', assert => {
  assert.plan(2);

  const state: Account.IModel = {profile, snapshot: {}};

  const [newState, effect] = Account.Update(state, new CurrencyFair.Message.Order({order: completedCurrencyFairOrder}));

  const tree = E.run<Account.Messages>(function(message: Q.Message.PublishEffect<Account.Message.OrderTick>) {
    switch(message.type) {
      case Q.Message.Type.Publish:
        assert.deepEqual(message.payload.message.payload.order, completedCurrencyFairOrder);
        return Promise.resolve(new Empty());
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Account.Messages>(message => assert.ok(message instanceof Empty))(tree);
});

test('it should broadcast a summary', assert => {
  assert.plan(2);

  const state: Account.IModel = {profile, snapshot: {}};

  const [newState, effect] = Account.Update(state, new CurrencyFair.Message.Summary({summary}));

  const tree = E.run<Account.Messages>(function(message: Q.Message.PublishEffect<CurrencyFair.Message.Summary>) {
    switch(message.type) {
      case Q.Message.Type.Publish:
        assert.deepEqual(message.payload.message.payload.summary, summary);
        return Promise.resolve(new Empty());
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Account.Messages>(message => assert.ok(message instanceof Empty))(tree);
});

test('it should update the order', assert => {
  assert.plan(1);

  const state: Account.IModel = {profile, snapshot: {}};

  const [newState, effect] = Account.Update(state, new CurrencyFair.Message.OrderChanged({id: completedCurrencyFairOrder.id}));

  type Events = Account.Messages | Http.Message.ResponseEvent<any> | CurrencyFair.MessageToken.ResponseEvent;
  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {} as any, response: JSON.parse(CurrencyFair.mockHistory)}));
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Order))(tree);
});