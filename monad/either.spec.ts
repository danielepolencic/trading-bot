import * as test from 'tape';
import * as Either from './either';

test('1st monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Either.Right<void, number>(x);
  Either.Do.Right<void, number>(1).fmap(fn).map(a => Either.map<void, number, void>(b => assert.equal(a, b))(fn(1)));
});

test('2nd monad law', assert => {
  assert.plan(1);
  Either.Do.Right<void, number>(2).fmap(Either.Right).map(x => assert.equal(x, 2));
});

test('3rd monad law', assert => {
  assert.plan(1);
  const fn = (x: number) => Either.Right<void, number>(x);
  const gn = (x: number) => Either.Right<void, number>(x + 1);
  Either.Do.Right<void, number>(3).fmap(fn).fmap(gn).map(a => {
    Either.Do.Right<void, number>(3).fmap(x => Either.fmap(gn)(fn(x))).map(b => assert.equal(a, b));
  });
});

test('it apply to another object of the same type', assert => {
  assert.plan(1);
  function add(a: number) {return (b: number) => a + b;}
  const three = Either.lift2((a, b) => a + b, Either.Right(1), Either.Right(2))
  Either.map(three => assert.equal(three, 3))(three);
});

test('it should cata', assert => {
  assert.plan(1);
  const two = Either.cata<void, number, void, number>(() => assert.fail(), x => x + 1)(Either.Right<void, number>(1));
  assert.equal(two, 2);
});

test('it should map 1 argument', assert => {
  assert.plan(1);
  const plus1 = Either.map<void, number, number>((x: number) => x + 1);
  Either.cata<void, number, void, void>(
    error => assert.fail(),
    two => assert.equal(two, 2)
  )(plus1(Either.Right<void, number>(1)));
});

test('it should fmap 1 argument', assert => {
  assert.plan(1);
  const plus1 = Either.fmap((x: number) => Either.Right(x + 1));
  Either.cata(
    error => assert.fail(),
    two => assert.equal(two, 2))
    (plus1(Either.Right(1)));
});

test('it should ap 1 argument', assert => {
  assert.plan(1);
  const plus1 = Either.ap((Either.Right((x: number) => x + 1)));
  Either.cata(
    error => assert.fail(),
    two => assert.equal(two, 2))
    (plus1(Either.Right(1)));
});

test('it should cata 2 arguments', assert => {
  assert.plan(1);
  const cata2 = Either.cata(
    error => assert.fail(),
    two => assert.equal(two, 2)
  );
  cata2(Either.Right(2));
});