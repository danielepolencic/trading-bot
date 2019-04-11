import * as test from 'tape';
import * as Identity from './identity';
import * as Maybe from './maybe';
import * as Free from './freer';
import {compose, identity} from '../utils';

const FreeWithIdentity = Free.freeMonad<Identity.IsIdentity>(Identity);
const LiftFreeWithIdentity = <A>(a: A) => Free.liftFree<Identity.IsIdentity, A>(Identity)(Identity.of(a));

test('Free 1st monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => LiftFreeWithIdentity(x);
  compose(
    compose(FreeWithIdentity.ap, FreeWithIdentity.map(a => (b: number) => assert.equal(a, b)))(fn(1)),
    FreeWithIdentity.fmap(fn)
  )(LiftFreeWithIdentity(1));
});

test('Free 2nd monad law', assert => {
  assert.plan(1);
  compose(
    FreeWithIdentity.map(x => assert.equal(x, 2)),
    FreeWithIdentity.fmap(LiftFreeWithIdentity)
  )(LiftFreeWithIdentity(2));
});

test('Free 3rd monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => LiftFreeWithIdentity(x);
  const gn = (x: number) => LiftFreeWithIdentity(x + 1);
  const ma = compose(FreeWithIdentity.fmap(gn), FreeWithIdentity.fmap(fn))(LiftFreeWithIdentity(3));
  const mb = FreeWithIdentity.fmap(compose(FreeWithIdentity.fmap(gn), fn))(LiftFreeWithIdentity(3));
  compose(FreeWithIdentity.ap, FreeWithIdentity.map(a => (b: number) => assert.equal(a, b)))(ma)(mb);
});

const FreeWithMaybe = Free.freeMonad<Maybe.IsMaybe>(Maybe);
const LiftFreeWithMaybe = <A>(a: A) => Free.liftFree<Maybe.IsMaybe, A>(Maybe)(Maybe.of(a));
const runMaybe = <A>(ffa: Free.Free<Maybe.IsMaybe, A>) => Free.foldFree<Maybe.IsMaybe, A>(Maybe, Maybe.orSome<A, any>('Nil'))(ffa);

test('Free should maybe', assert => {
  assert.plan(1);
  const maybe1 = LiftFreeWithMaybe(1);
  const maybe2 = LiftFreeWithMaybe(2);
  const result = compose(FreeWithMaybe.fmap(() => FreeWithMaybe.map<number, number>(x => x + 1)(maybe2)), FreeWithMaybe.map<number, number>(x => x + 10))(maybe1);
  assert.equal(runMaybe(result), 3);
});

test('Free should maybe nothing', assert => {
  assert.plan(1);
  const maybeNothing = LiftFreeWithMaybe(undefined);
  const maybe2 = LiftFreeWithMaybe(2);
  const result = compose(FreeWithMaybe.fmap(() => FreeWithMaybe.map<number, number>(x => x + 1)(maybe2)), FreeWithMaybe.map<undefined, number>(x => 10))(maybeNothing);
  assert.equal(runMaybe(result), 'Nil');
});