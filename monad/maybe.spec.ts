import * as test from 'tape';
import * as Maybe from './maybe';
import {compose} from '../utils';

test('1st monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Maybe.of(x);
  Maybe.Do.of(1).fmap(fn).map(a => Maybe.Do.of(fn(1)).map(b => assert.equal(a, b)));
});

test('2nd monad law', assert => {
  assert.plan(1);
  Maybe.Do.of(2).fmap(Maybe.of).map(x => assert.equal(x, 2));
});

test('3rd monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Maybe.of(x);
  const gn = (x: number) => Maybe.of(x + 1);
  Maybe.Do.of(3).fmap(fn).fmap(gn).map(a => {
    Maybe.Do.of(3).fmap(x => Maybe.Do.of(fn(x)).fmap(gn).value).map(b => assert.equal(a, b));
  });
});

test('it apply to another object of the same type', assert => {
  assert.plan(1);
  const add = (a: number) => (b: number) => a + b;
  const three = compose(Maybe.ap, Maybe.map(add))(Maybe.of(1))(Maybe.of(2));
  Maybe.map(three => assert.equal(three, 3))(three);
});

test('it should map 1 argument', assert => {
  assert.plan(1);
  const plus1 = Maybe.map((x: number) => x + 1);
  Maybe.map(two => assert.equal(two, 2))(plus1(Maybe.of(1)));
});

test('it should fmap 1 argument', assert => {
  assert.plan(1);
  const plus1 = Maybe.fmap((x: number) => Maybe.of(x + 1));
  Maybe.map(two => assert.equal(two, 2))(plus1(Maybe.of(1)));
});

test('it should ap 1 argument', assert => {
  assert.plan(1);
  const plus1 = Maybe.ap(Maybe.of((x: number) => x + 1));
  Maybe.map(two => assert.equal(two, 2))(plus1(Maybe.of(1)));
});

test('it should orElse 1 argument', assert => {
  assert.plan(1);
  const plus1 = Maybe.orElse(Maybe.of('one'));
  Maybe.map(one => assert.equal(one, 'one'))(plus1(Maybe.Nothing));
});

test('it should orElse 1 argument', assert => {
  assert.plan(1);
  const plus1 = Maybe.orSome('one');
  assert.equal(plus1(Maybe.Nothing), 'one');
});

test('it not apply to another object', assert => {
  assert.plan(1);
  const nil = Maybe.lift2<number, number, number>((a, b) => a + b, Maybe.Nothing, Maybe.of(2));
  Maybe.map(n => assert.fail(`${n}`))(nil);
  assert.pass();
});