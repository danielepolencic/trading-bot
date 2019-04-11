import * as test from 'tape';
import * as Free from './freer';
import * as Reader from './reader';

const S = Free.freeMonad<Reader.IsReader>(Reader);
const lift = <A>(a: A) => Free.liftFree<Reader.IsReader, A>(Reader)(Reader.of(a));
const run = <A>(ffa: Free.Free<Reader.IsReader, A>) => Free.foldFree<Reader.IsReader, A>(Reader, Reader.join)(ffa);

test('S should count', assert => {
  assert.plan(1);
  const one = lift(1);
  const two = lift(2);
  const result = S.fmap(x => S.map((x: number) => x + 1)(two))(S.map((x: number) => x + 10)(one));
  assert.equal(run(result), 3);
});

test('S should suspend', assert => {
  const one = lift(1);
  const two = lift(2);
  const result = S.fmap(x => {
    assert.fail();
    return S.map((x: number) => x + 1)(two);
  })(S.map((x: number) => {
    assert.fail();
    return x + 10;
  })(one));
  assert.end();
});

test.skip('S should run with a custom interpreter', assert => {
  assert.plan(1);
  const one = (lift({v: 'one'}) as any) as Free.Free<Reader.IsReader, number>;
  const two = (lift({v: 'two'}) as any) as Free.Free<Reader.IsReader, number>;
  const run = <A>(ffa: Free.Free<Reader.IsReader, A>) => Free.foldFree<Reader.IsReader, A>(Reader, (ffa: Reader.Reader<A>): any => {
    const a = Reader.prj(ffa)();
    console.log(a);
    return 1;
  })(ffa);
  const result = S.fmap(x => S.map((x: number) => x + 1)(two))(S.map((x: number) => x + 10)(one));
  assert.equal(run(result), 3);
});