import * as test from 'tape';
import * as Identity from './identity';

test('1st monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Identity.of(x);
  Identity.Do.of(1).fmap(fn).map(a => Identity.Do.of(fn(1)).map(b => assert.equal(a, b)));
});

test('2nd monad law', assert => {
  assert.plan(1);
  Identity.Do.of(2).fmap(Identity.of).map(x => assert.equal(x, 2));
});

test('3rd monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Identity.of(x);
  const gn = (x: number) => Identity.of(x + 1);
  Identity.Do.of(3).fmap(fn).fmap(gn).map(a => {
    Identity.Do.of(3).fmap(x => Identity.Do.of(fn(x)).fmap(gn).value).map(b => assert.equal(a, b));
  });
});

test('it apply to another object of the same type', assert => {
  assert.plan(1);
  function add(a: number) {return (b: number) => a + b;}
  const three = Identity.ap(Identity.map(add)(Identity.of(1)))(Identity.of(2));
  Identity.map(three => assert.equal(three, 3))(three);
});