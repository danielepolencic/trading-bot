import * as test from 'tape';
import * as PendingOrder from './pendingOrder';
import * as CurrencyFair from '../currencyFair';
import * as Currency from '../currency';
import * as ℚ from '../monad/rational';
import * as OrderManager from './orderManager';
import * as Maybe from '../monad/maybe';
import * as Q from '../effect/queue';
import * as Account from '../reactorCurrencyFairOrders/account';

const marketEURGBP: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8550),
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
  }]
};

const pendingCurrencyFairOrderUpdated: CurrencyFair.IOrder = {
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
    createdAt: (new Date()).toISOString()
  }, {
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.PART_MATCHED,
    createdAt: (new Date(+Date.now() + 1)).toISOString()
  }, {
    rate: marketEURGBP.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(marketEURGBP.rate),
    type: CurrencyFair.OrderEventType.MATCHED,
    createdAt: (new Date(+Date.now() + 2)).toISOString()
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

  const model: OrderManager.IModel = {pendingOrders: {}};
  assert.deepEqual(model, OrderManager.Init());
});

test('it should receive a new order', assert => {
  assert.plan(1);

  const state: OrderManager.IModel = {pendingOrders: {}};

  const [newState, effect] = OrderManager.Update(state, new Q.Message.ConsumeEvent({message: new Account.Message.OrderTick({order: pendingCurrencyFairOrder, profile})}));

  assert.deepEqual(newState.pendingOrders[pendingCurrencyFairOrder.id], PendingOrder.Init({
    profile,
    order: pendingCurrencyFairOrder,
    minSpread: ℚ.parse(1.000),
    increment: ℚ.parse(0.0001)
  }))
});

test('it should not add a terminated order', assert => {
  assert.plan(1);

  const state: OrderManager.IModel = {pendingOrders: {}};

  const [newState, effect] = OrderManager.Update(state, new Q.Message.ConsumeEvent({message: new Account.Message.OrderTick({order: completedCurrencyFairOrder, profile})}));

  assert.deepEqual(newState.pendingOrders, {});
});

test('it should update an order', assert => {
  assert.plan(1);

  const state: OrderManager.IModel = {pendingOrders: {
    [pendingCurrencyFairOrder.id]: PendingOrder.Init({
      profile,
      order: pendingCurrencyFairOrder,
      minSpread: ℚ.parse(1.000),
      increment: ℚ.parse(0.0001)
    })
  }};

  const [newState, effect] = OrderManager.Update(state, new Q.Message.ConsumeEvent({message: new Account.Message.OrderTick({order: pendingCurrencyFairOrderUpdated, profile})}));

  assert.deepEqual(newState.pendingOrders[pendingCurrencyFairOrder.id], PendingOrder.Init({
    profile,
    order: pendingCurrencyFairOrderUpdated,
    minSpread: ℚ.parse(1.000),
    increment: ℚ.parse(0.0001)
  }))
});

test('it should delete an order', assert => {
  assert.plan(1);

  const state: OrderManager.IModel = {pendingOrders: {
    [pendingCurrencyFairOrder.id]: PendingOrder.Init({
      profile,
      order: pendingCurrencyFairOrder,
      minSpread: ℚ.parse(1.000),
      increment: ℚ.parse(0.0001)
    })
  }};

  const [newState, effect] = OrderManager.Update(state, new Q.Message.ConsumeEvent({message: new Account.Message.OrderTick({order: completedCurrencyFairOrder, profile})}));

  assert.deepEqual(newState.pendingOrders, {})
});

test('it should forward messages', assert => {
  assert.plan(1);

  const pendingOrderState: PendingOrder.IModel = {
    order: pendingCurrencyFairOrder,
    profile,
    minSpread: ℚ.parse(0.002),
    increment: ℚ.parse(0.0001),
    directQuote: Maybe.Nothing,
    indirectQuote: Maybe.Nothing,
    status: PendingOrder.Status.UPDATING
  };
  const state: OrderManager.IModel = {pendingOrders: {[`${pendingCurrencyFairOrder.id}`]: pendingOrderState}};

  const [newState, effect] = OrderManager.Update(state, new OrderManager.Message.PendingOrderMessage({message: new CurrencyFair.Message.Empty(), id: `${pendingCurrencyFairOrder.id}`}));

  assert.deepEqual(newState.pendingOrders[pendingOrderState.order.id].status, PendingOrder.Status.VALID);
});