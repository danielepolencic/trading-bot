import * as test from 'tape';
import * as ℚ from '../monad/rational';
import * as Currency from '../currency';
import * as CurrencyFair from '../currencyFair';
import * as Accounts from './accounts';
import * as Account from './account';
import * as E from '../effect/engine';
import * as Q from '../effect/queue';
import {Empty} from '../effect/message';

const profile: CurrencyFair.IProfile = {
  webUrl: '',
  apiUrl: '',
  username: 'user1',
  password: '',
  twoFactorSecret: '',
  customerId: '1'
};

const quoteEURGBP: CurrencyFair.IMarketplace = {
  currencySell: Currency.EUR,
  currencyBuy: Currency.GBP,
  rate: ℚ.parse(0.8550),
  status: CurrencyFair.MarketplaceStatus.OPEN
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

test('it should init', assert => {
  assert.plan(1);

  const model: Accounts.IModel = {accounts: {}};

  assert.deepEqual(model, Accounts.Init());
});

test('it should add an account', assert => {
  assert.plan(1);

  const model: Accounts.IModel = {accounts: {}};

  const [state, effect] = Accounts.Update(model, new Accounts.Message.AddAccount({profile}));

  assert.deepEqual(state, {accounts: {[profile.username]: Account.Init(profile)}});
});

test('it should forward an update', assert => {
  assert.plan(3);

  const model: Accounts.IModel = {accounts: {[profile.username]: Account.Init(profile)}};

  const [state, effect] = Accounts.Update(model, new Accounts.Message.Update({id: profile.username, message: new CurrencyFair.Message.Order({order: pendingCurrencyFairOrder})}));

  const tree = E.run<Accounts.Messages>(function(message: Q.Message.PublishEffect<Account.Message.OrderTick>) {
    switch(message.type) {
      case Q.Message.Type.Publish:
        assert.deepEqual(message.payload.message.payload.order, pendingCurrencyFairOrder);
        return Promise.resolve(new Empty());
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Accounts.Messages>(message => assert.ok(message instanceof Accounts.Message.Update, message.type))(tree);

  assert.deepEqual(state.accounts[profile.username].snapshot[pendingCurrencyFairOrder.id], pendingCurrencyFairOrder);
});