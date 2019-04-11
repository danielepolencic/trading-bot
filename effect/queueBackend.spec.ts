import * as test from 'tape';
import * as Either from '../monad/either';
import * as Q from './queue';
import * as Backend from './queueBackend';

test('it should publish a message', assert => {
  assert.plan(1);

  const subscriptions: Backend.ISubscriptions = {};
  const cache: Backend.IDatabase = {};
  const manager = Backend.Manager(cache, subscriptions);

  manager.Publish(new Q.PublishEffect(Q.of('TOPIC'), 'test'));

  assert.deepEqual(cache['TOPIC'], ['test']);
});

test('it should receive a message', assert => {
  assert.plan(2);

  const subscriptions: Backend.ISubscriptions = {};
  const cache: Backend.IDatabase = {};
  const manager = Backend.Manager(cache, subscriptions);

  manager.Publish(new Q.PublishEffect(Q.of('TOPIC'), 'test'));
  const response = manager.Subscribe('1', new Q.SubscribeEffect(Q.of('TOPIC')));

  response.then(response =>
    Either.cata<void, {}, void, void>(
      error => assert.fail(),
      value => {
        assert.deepEqual(Object.keys(subscriptions).length, 1);
        assert.equal(value, 'test');
      })
      (response)
  );
});

test('it should delete all subscriptions', assert => {
  assert.plan(3);

  const cache: Backend.IDatabase = {};
  const subscriptions: Backend.ISubscriptions = {
    '1': {createdAt: +Date.now() - 1, value: 'test1'},
    '2': {createdAt: +Date.now() - 2, value: 'test2'},
    '3': {createdAt: +Date.now() - 3, value: 'test3'}
  };

  const manager = Backend.Manager(cache, subscriptions, 3);

  manager.Publish(new Q.PublishEffect(Q.of('TOPIC'), 'test'));
  const response = manager.Subscribe('4', new Q.SubscribeEffect(Q.of('TOPIC')));

  response.then(response =>
    Either.cata<void, {}, void, void>(
      error => assert.fail(),
      message => {
        assert.equal(Object.keys(subscriptions).length, 3);
        assert.ok(!subscriptions[3]);
        assert.ok(subscriptions['4-TOPIC']);
      })
      (response)
  );
});