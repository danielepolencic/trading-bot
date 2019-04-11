import * as test from 'tape';
import * as Entity from './entity';
import * as Currency from '../currency';
import * as ℚ from '../monad/rational';

const quoteEURGBP: Entity.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8550),
  status: Entity.MarketplaceStatus.OPEN
};

const quoteEURCHF: Entity.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.CHF,
  rate: ℚ.parse(0.8560),
  status: Entity.MarketplaceStatus.OPEN
};

const one: Entity.IOrder = {
  id: `1`,
  currencySell: quoteEURCHF.currencySell,
  currencyBuy: quoteEURCHF.currencyBuy,
  events: [{
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: Entity.OrderEventType.CREATED,
    createdAt: (new Date()).toISOString()
  }, {
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURCHF.rate),
    type: Entity.OrderEventType.PART_MATCHED,
    createdAt: (new Date()).toISOString()
  }]
};

const two: Entity.IOrder = {
  id: `2`,
  currencySell: quoteEURCHF.currencySell,
  currencyBuy: quoteEURCHF.currencyBuy,
  events: [{
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: Entity.OrderEventType.CREATED,
    createdAt: (new Date()).toISOString()
  }, {
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURCHF.rate),
    type: Entity.OrderEventType.PART_MATCHED,
    createdAt: (new Date()).toISOString()
  }]
};

const oneUpdated: Entity.IOrder = {
  id: `1`,
  currencySell: quoteEURCHF.currencySell,
  currencyBuy: quoteEURCHF.currencyBuy,
  events: [{
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(100),
    amountSell: ℚ.parse(0),
    type: Entity.OrderEventType.CREATED,
    createdAt: (new Date()).toISOString()
  }, {
    rate: quoteEURCHF.rate,
    amountBuy: ℚ.parse(50),
    amountSell: ℚ.multiplyBy(50)(quoteEURCHF.rate),
    type: Entity.OrderEventType.PART_MATCHED,
    createdAt: (new Date(+ Date.now() + 1)).toISOString()
  }]
};

test('it should dedupe orders and keep the most recent', assert => {
  assert.plan(1);
  const orders = Entity.filterUniqueOrders([one, oneUpdated]);

  assert.deepEqual(orders, [oneUpdated]);
});

test('it should keep all unique orders', assert => {
  assert.plan(1);
  const orders = Entity.filterUniqueOrders([one, two]);

  assert.deepEqual(orders, [one, two]);
});

test('it should remove duplicates', assert => {
  assert.plan(1);
  const orders = Entity.filterUniqueOrders([one, one, one]);

  assert.deepEqual(orders, [one]);
});

test('it sorts orders', assert => {
  assert.plan(1);
  const orders = Entity.sortOrders([one, oneUpdated]);

  assert.deepEqual(orders, [oneUpdated, one]);
});