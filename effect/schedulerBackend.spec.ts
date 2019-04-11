import * as test from 'tape';
import * as Scheduler from './scheduler';
import * as Backend from './schedulerBackend';
import * as Sinon from 'sinon';
import * as Either from '../monad/either';

test('it should create a subscription', assert => {
  assert.plan(2);

  const cache: Backend.IDatabase = {};
  const setInterval = Sinon.stub();
  const manager = Backend.Manager(cache, {}, setInterval);

  const response = manager.Every('1', new Scheduler.EveryEffect(1000));
  setInterval.callArg(0);

  response.then(response =>
    Either.cata<void, void, void, void>(
      error => {
        assert.equal(cache['1000'].interval, 1000);
        assert.deepEqual(cache['1000'].queue, []);
      },
      message => assert.fail())
      (response)
  );
});

test('it should create add a message', assert => {
  assert.plan(2);

  const cache: Backend.IDatabase = {};
  const setInterval = Sinon.stub();
  const manager = Backend.Manager(cache, {}, setInterval);

  const response = manager.Every('1', new Scheduler.EveryEffect(-1000));
  setInterval.callArg(0);

  response.then(response =>
    Either.cata<void, void, void, void>(
      error => {
        assert.equal(cache['-1000'].interval, -1000);
        assert.deepEqual(cache['-1000'].queue, [true]);
      },
      message => assert.fail())
      (response)
  );
});

test('it should retrieve a message', assert => {
  assert.plan(3);

  const cache: Backend.IDatabase = {};
  const subscriptions: Backend.ISubscriptions = {};
  const setInterval = Sinon.stub();
  const manager = Backend.Manager(cache, subscriptions, setInterval);

  manager.Every('1', new Scheduler.EveryEffect(-1000));
  setInterval.callArg(0);
  const response = manager.Every('1', new Scheduler.EveryEffect(-1000));

  response.then(response =>
    Either.cata<void, void, void, void>(
      error => assert.fail(),
      message => {
        assert.equal(cache['-1000'].interval, -1000);
        assert.deepEqual(cache['-1000'].queue, []);
        assert.deepEqual(subscriptions['1'].value, true);
      })
      (response)
  );
});

test('it should delete all subscriptions', assert => {
  assert.plan(3);

  const cache: Backend.IDatabase = {};
  const subscriptions: Backend.ISubscriptions = {
    '1': {createdAt: +Date.now() - 1, value: true},
    '2': {createdAt: +Date.now() - 2, value: true},
    '3': {createdAt: +Date.now() - 3, value: true}
  };
  const setInterval = Sinon.stub();
  const manager = Backend.Manager(cache, subscriptions, setInterval, 3);

  const response = manager.Every('4', new Scheduler.EveryEffect(-1000));

  response.then(response =>
    Either.cata<void, void, void, void>(
      error => {
        assert.equal(Object.keys(subscriptions).length, 3);
        assert.ok(!subscriptions[3]);
        assert.ok(subscriptions[4]);
      },
      message => assert.fail())
      (response)
  );
});