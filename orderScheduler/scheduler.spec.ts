import * as test from 'tape';
import * as Scheduler from './scheduler';
import * as CurrencyFair from '../currencyFair';
import * as Currency from '../currency';
import * as Maybe from '../monad/maybe';
import * as ℚ from '../monad/rational';
import * as Http from '../effect/http';
import * as E from '../effect/engine';
import {Empty} from '../effect/message';
import * as Passthrough from '../effect/passthrough';
import * as Time from '../effect/scheduler';
import * as Q from '../effect/queue';

const profile: CurrencyFair.IProfile = {
  webUrl: '',
  apiUrl: '',
  username: '',
  password: '',
  twoFactorSecret: '',
  customerId: 'customerId'
};

const orderRequest: Scheduler.IRequest = {
  currencyBuy: Currency.GBP,
  currencySell: Currency.EUR,
  directQuote: Maybe.Nothing,
  indirectQuote: Maybe.Nothing,
  spread: Maybe.Nothing
};

const orderRequestWithIndirectQuote: Scheduler.IRequest = {
  currencyBuy: Currency.GBP,
  currencySell: Currency.EUR,
  directQuote: Maybe.Nothing,
  indirectQuote: Maybe.of(ℚ.parse(1.1234)),
  spread: Maybe.Nothing
};

const market: CurrencyFair.IMarketplace = {
  currencyBuy: orderRequest.currencyBuy,
  currencySell: orderRequest.currencySell,
  rate: ℚ.parse(0.8660),
  status: CurrencyFair.MarketplaceStatus.OPEN
};

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
  }]
};

const balance: CurrencyFair.IBalance = {
  currency: Currency.GBP,
  available: ℚ.parse(50)
};

test('it should init', assert => {
  assert.plan(1);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  assert.deepEqual(state, Scheduler.Init());
});

test('it should add a profile', assert => {
  assert.plan(3);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.AddProfile({profile}));

  const tree = E.run<Scheduler.Messages>(function(message: Empty) {
    assert.ok(message instanceof Empty);
    return Promise.resolve(new Empty());
  })(effect);

  E.walk<Scheduler.Messages>(message => assert.ok(message instanceof Empty))(tree);

  assert.deepEqual(currentState.profiles[profile.customerId], profile);
});

test('it should add a request', assert => {
  assert.plan(3);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.AddRequest({currencyBuy: orderRequest.currencyBuy, currencySell: orderRequest.currencySell}));

  const tree = E.run<Scheduler.Messages>(function(message: Empty) {
    assert.ok(message instanceof Empty);
    return Promise.resolve(new Empty());
  })(effect);

  E.walk<Scheduler.Messages>(message => assert.ok(message instanceof Empty))(tree);

  assert.deepEqual(currentState.orderRequests[`${orderRequest.currencyBuy}${orderRequest.currencySell}`], orderRequest);
});

test('it should update a direct quote', assert => {
  assert.plan(3);

  const state: Scheduler.IModel = {
    orderRequests: {
      [`${orderRequest.currencyBuy}${orderRequest.currencySell}`]: orderRequest
    },
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.UpdateDirectQuote({market, id: `${orderRequest.currencyBuy}${orderRequest.currencySell}`}));

  const tree = E.run<Scheduler.Messages>(function(message: Empty) {
    assert.ok(message instanceof Empty);
    return Promise.resolve(new Empty());
  })(effect);

  E.walk<Scheduler.Messages>(message => assert.ok(message instanceof Empty))(tree);

  assert.deepEqual(currentState.orderRequests[`${orderRequest.currencyBuy}${orderRequest.currencySell}`], {
    ...orderRequest,
    directQuote: Maybe.of(market.rate)
  });
});

test('it should update a direct quote and the spread', assert => {
  assert.plan(3);

  const state: Scheduler.IModel = {
    orderRequests: {
      [`${orderRequestWithIndirectQuote.currencyBuy}${orderRequestWithIndirectQuote.currencySell}`]: orderRequestWithIndirectQuote
    },
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.UpdateDirectQuote({market, id: `${orderRequestWithIndirectQuote.currencyBuy}${orderRequestWithIndirectQuote.currencySell}`}));

  const tree = E.run<Scheduler.Messages>(function(message: Empty) {
    assert.ok(message instanceof Empty);
    return Promise.resolve(new Empty());
  })(effect);

  E.walk<Scheduler.Messages>(message => assert.ok(message instanceof Empty))(tree);

  assert.deepEqual(currentState.orderRequests[`${orderRequestWithIndirectQuote.currencyBuy}${orderRequestWithIndirectQuote.currencySell}`], {
    ...orderRequestWithIndirectQuote,
    directQuote: Maybe.of(market.rate),
    spread: Maybe.of(ℚ.multiplyBy(market.rate)(ℚ.parse(1.1234)))
  });
});

test('it should update the active orders', assert => {
  assert.plan(1);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.OrderUpdate({order: pendingCurrencyFairOrder, profileId: '123'}));

  assert.deepEqual(currentState.activeOrders['123'], {[pendingCurrencyFairOrder.id]: pendingCurrencyFairOrder});
});

test('it should update the balance', assert => {
  assert.plan(1);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.FIRST_RUN
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.SummaryUpdate({summary: [balance], profileId: '123'}));

  assert.deepEqual(currentState.balances['123'], [balance]);
});

test('it should unlock the state', assert => {
  assert.plan(1);

  const state: Scheduler.IModel = {
    orderRequests: {},
    activeOrders: {},
    profiles: {},
    balances: {},
    status: Scheduler.Status.IN_PROGRESS
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.Init());

  assert.deepEqual(currentState.status, Scheduler.Status.IDLE);
});

test('it should sort requests', assert => {
  assert.plan(11);

  const profile1: CurrencyFair.IProfile = {
    webUrl: '',
    apiUrl: '',
    username: '',
    password: '',
    twoFactorSecret: '',
    customerId: 'profile1'
  };
  const profile2: CurrencyFair.IProfile = {
    webUrl: '',
    apiUrl: '',
    username: '',
    password: '',
    twoFactorSecret: '',
    customerId: 'profile2'
  };
  const orderRequestGBPEUR: Scheduler.IRequest = {
    currencyBuy: Currency.GBP,
    currencySell: Currency.EUR,
    directQuote: Maybe.of(ℚ.parse(0.85525)),
    indirectQuote: Maybe.of(ℚ.parse(1.16924)),
    spread: Maybe.of(ℚ.parse(1.004))
  };
  const orderRequestUSDEUR: Scheduler.IRequest = {
    currencyBuy: Currency.USD,
    currencySell: Currency.EUR,
    directQuote: Maybe.of(ℚ.parse(1.06977)),
    indirectQuote: Maybe.of(ℚ.parse(0.93478)),
    spread: Maybe.of(ℚ.parse(1.003))
  };
  const orderRequestSGDEUR: Scheduler.IRequest = {
    currencyBuy: Currency.SGD,
    currencySell: Currency.EUR,
    directQuote: Maybe.of(ℚ.parse(1.06977)),
    indirectQuote: Maybe.of(ℚ.parse(1.53169)),
    spread: Maybe.of(ℚ.parse(1.002))
  };
  const orderRequestGBPSGD: Scheduler.IRequest = {
    currencyBuy: Currency.GBP,
    currencySell: Currency.SGD,
    directQuote: Maybe.of(ℚ.parse(0.55660)),
    indirectQuote: Maybe.of(ℚ.parse(1.79662)),
    spread: Maybe.of(ℚ.parse(1.001))
  };
  const balanceGBP: CurrencyFair.IBalance = {
    currency: Currency.GBP,
    available: ℚ.parse(100)
  };
  const balanceEUR: CurrencyFair.IBalance = {
    currency: Currency.EUR,
    available: ℚ.parse(50)
  };
  const balanceUSD: CurrencyFair.IBalance = {
    currency: Currency.USD,
    available: ℚ.parse(10)
  };
  const balanceSGD: CurrencyFair.IBalance = {
    currency: Currency.SGD,
    available: ℚ.parse(0)
  };
  const state: Scheduler.IModel = {
    orderRequests: {
      [`${orderRequestGBPEUR.currencyBuy}${orderRequestGBPEUR.currencySell}`]: orderRequestGBPEUR,
      [`${orderRequestUSDEUR.currencyBuy}${orderRequestUSDEUR.currencySell}`]: orderRequestUSDEUR,
      [`${orderRequestSGDEUR.currencyBuy}${orderRequestSGDEUR.currencySell}`]: orderRequestSGDEUR,
      [`${orderRequestGBPSGD.currencyBuy}${orderRequestGBPSGD.currencySell}`]: orderRequestGBPSGD
    },
    activeOrders: {
      [profile1.customerId]: {[pendingCurrencyFairOrder.id]: pendingCurrencyFairOrder}
    },
    profiles: {
      [profile1.customerId]: profile1,
      [profile2.customerId]: profile2
    },
    balances: {
      [profile1.customerId]: [balanceEUR, balanceGBP],
      [profile2.customerId]: [balanceUSD, balanceGBP, balanceSGD]
    },
    status: Scheduler.Status.IDLE
  };

  const scorecards = Scheduler.collectScoreCards(state);

  assert.equal(scorecards.length, 8);
  assert.equal(scorecards[0].score, ℚ.parse(1.003));
  assert.equal(scorecards[0].profile, profile1);
  assert.equal(ℚ.toFloat(scorecards[1].score), 1.002);
  assert.equal(scorecards[1].profile, profile1);
  scorecards.slice(2).forEach(scorecard => {
    assert.equal(scorecard.score, ℚ.parse(0));
  });
});

test('it should update a direct quote and place an order', assert => {
  assert.plan(2);

  const balanceEUR: CurrencyFair.IBalance = {
    currency: Currency.EUR,
    available: ℚ.parse(50)
  };
  const market: CurrencyFair.IMarketplace = {
    currencyBuy: orderRequest.currencyBuy,
    currencySell: orderRequest.currencySell,
    rate: ℚ.parse(0.9160),
    status: CurrencyFair.MarketplaceStatus.OPEN
  };
  const state: Scheduler.IModel = {
    orderRequests: {
      [`${orderRequestWithIndirectQuote.currencyBuy}${orderRequestWithIndirectQuote.currencySell}`]: orderRequestWithIndirectQuote
    },
    activeOrders: {},
    profiles: {
      [profile.customerId]: profile
    },
    balances: {
      [profile.customerId]: [balanceEUR]
    },
    status: Scheduler.Status.IDLE
  };

  const [currentState, effect] = Scheduler.Update(state, new Scheduler.Message.UpdateDirectQuote({market, id: `${orderRequestWithIndirectQuote.currencyBuy}${orderRequestWithIndirectQuote.currencySell}`}));

  type Events = Scheduler.Messages | Http.Message.ResponseEvent<any> | CurrencyFair.MessageToken.ResponseEvent;
  const tree = E.run<Events>(function(message: Http.Message.RequestEffect | CurrencyFair.MessageToken.RequestEffect | Passthrough.Message.Event<any> | Time.Message.DelayEffect | Q.Message.PublishEffect<any>) {
    switch(message.type) {
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return Promise.resolve(new CurrencyFair.MessageToken.ResponseEvent({token: '123'}));
      case Http.Message.Type.Request:
        return Promise.resolve(new Http.Message.ResponseEvent<any>({error: Maybe.Nothing, incomingMessage: {statusCode: 200} as any, response: Maybe.of(CurrencyFair.mockOrderPending)}));
      case Passthrough.Message.Type.Event:
        return Promise.resolve(message.payload.message);
      case Time.Message.Type.DelayEffect:
        return Promise.resolve(new Empty());
      case Q.Message.Type.Publish:
        return Promise.resolve(new Empty());
      default:
        assert.fail(`Unknwon effect ${(message as any).type}`);
        return Promise.reject(undefined);
    }
  })(effect);

  E.walk<Events>(message => assert.ok(message instanceof CurrencyFair.Message.Empty, message.type))(tree);

  assert.deepEqual(currentState.status, Scheduler.Status.IN_PROGRESS);
});