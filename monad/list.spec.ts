import * as test from 'tape';
import * as Free from './freer';
import * as List from './list';
import {HKT} from './HKT';
import {compose} from '../utils';

const FreeWithList = Free.freeMonad<List.IsList>(List);
const LiftFreeWithList = <A>(a: A | A[]) => Free.liftFree<List.IsList, A>(List)(List.of(a));
const runList = <A>(ffa: List.List<A>) => Free.foldFree(List, List.join)(ffa);

test('it should run with a single element', assert => {
  assert.plan(1);

  const result = compose(
    FreeWithList.fmap(LiftFreeWithList),
    FreeWithList.fmap(LiftFreeWithList),
    FreeWithList.map((x: number) => x + 1)
  )(LiftFreeWithList(2));

  assert.deepEqual(runList(result), [3]);
});

test('it should run with multiple elements', assert => {
  assert.plan(1);

  const result = FreeWithList.map((x: number) => x + 1)(LiftFreeWithList([2, 3, 4]));

  assert.deepEqual(runList(result), [3, 4, 5]);
});