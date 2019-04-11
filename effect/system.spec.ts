import * as test from 'tape';
import * as S from './system';
import * as Either from '../monad/either';

class GenericEffect {
  constructor(public readonly name: string) {}
}

test('S should run with a custom interpreter', assert => {
  assert.plan(3);
  const one = S.of<Error, number>(new GenericEffect('1one'));
  const two = S.of<Error, number>(new GenericEffect('2two'));

  const ast = S.fmap(x => {
    assert.equal(x, 11);
    return S.map((x: number) => {
      assert.equal(x, 2);
      return x + 1;
    })(two);
  })(S.map((x: number) => x + 10)(one));

  Either.cata(
    error => assert.fail(),
    three => assert.equal(three, 3))
    (S.run(interpreter, ast));
});

test('it should cata', assert => {
  assert.plan(1);

  const one = S.bimap<void, number, void, void>(
    error => assert.fail(),
    one => assert.equal(one, 1))
    (S.of<void, number>(new GenericEffect('1one'))
  );

  S.run(interpreter, one);
});

test('it should skip ops when there is an error', assert => {
  assert.plan(1);
  const one = S.of<Error, number>(new GenericEffect('1one'));
  const two = S.of<Error, number>(new GenericEffect('2two'));

  const ast = S.fmap(x => S.map<Error, number, number>(x => x + 1)(two))(S.map<Error, number, number>(x => x + 10)(one));

  Either.cata(
    error => assert.equal(error, 1),
    three => assert.fail())
    (S.run(function interpreter(effect: GenericEffect, q: Function) {
      switch(effect.name) {
        case '1one':
          return q(Either.Left(1));
        case '2two':
          return q(Either.Right(2));
        default:
          return q(Either.Right(0));
      }
    }, ast)
  );
});

test('it should ap', assert => {
  assert.plan(1);
  const one = S.of<Error, number>(new GenericEffect('1one'));
  const two = S.of<Error, number>(new GenericEffect('2two'));

  const ast = S.ap(S.map((one: number) => (two: number) => one + two)(one))(two);

  Either.cata(
    error => assert.fail(),
    three => assert.equal(three, 3))
    (S.run(interpreter, ast));
});

test('it should bifmap', assert => {
  assert.plan(1);
  const one = S.of<Error, number>(new GenericEffect('1one'));
  const two = S.of<Error, number>(new GenericEffect('2two'));

  const ast = S.ap(S.map((one: number) => (two: number) => one + two)(one))(two);

  Either.cata(
    error => assert.fail(),
    two => assert.equal(two, 2))
    (S.run(function interpreter(effect: GenericEffect, q: Function) {
      switch(effect.name) {
        case '1one':
          return q(Either.Left(1));
        case '2two':
          return q(Either.Right(2));
        default:
          return q(Either.Right(0));
      }
    }, S.bifmap(err => two, () => one)(ast))
  );
});

function interpreter(effect: GenericEffect, q: Function) {
  switch(effect.name) {
    case '1one':
      return q(Either.Right(1));
    case '2two':
      return q(Either.Right(2));
    default:
      return q(Either.Right(0));
  }
}