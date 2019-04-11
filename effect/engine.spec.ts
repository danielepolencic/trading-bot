import * as test from 'tape';
import * as E from './engine';
import * as Either from '../monad/either';
import {compose} from '../utils';

class GenericEffect {
  constructor(public readonly name: string) {}
}

test('S should run with a custom interpreter', assert => {
  assert.plan(3);
  const one = E.of<number>(new GenericEffect('1one'));
  const two = E.of<number>(new GenericEffect('2two'));

  const ast = E.fmap(x => {
    assert.equal(x, 11);
    return E.map((x: number) => {
      assert.equal(x, 2);
      return x + 1;
    })(two);
  })(E.map((x: number) => x + 10)(one));

  E.walk<number>(three => assert.deepEqual(three, 3))(E.run(interpreter)(ast));
});

test('it should map multiple effects', assert => {
  assert.plan(4);
  const one = E.of<number>([new GenericEffect('1one'), new GenericEffect('2two')]);
  const two = E.of<number>(new GenericEffect('2two'));

  const ast = compose(
    E.map((x: number) => x * 10),
    E.fmap(() => one),
    E.fmap((x: number) => E.map<number, number>(x => x + 1)(two)),
    E.map<number, number>(x => x + 10)
  );

  const tree = E.run(function interpreter(effect: GenericEffect) {
    switch(effect.name) {
      case '1one':
        return Promise.resolve(1);
      case '2two':
        return Promise.resolve(2);
      default:
        return Promise.resolve(0);
    }
  })(ast(one));

  let i = 0;
  E.walk((value: number) => {
    i += 1;
    switch(i) {
      case 1:
        return assert.equal(value, 10);
      case 2:
        return assert.equal(value, 20);
      case 3:
        return assert.equal(value, 10);
      case 4:
        return assert.equal(value, 20);
      default:
        return assert.fail();
    }
  })(tree);
});

test('it should batch effects', assert => {
  assert.plan(6);
  const one = E.of<number>([new GenericEffect('1one'), new GenericEffect('2two')]);
  const two = E.of<number>(new GenericEffect('2two'));
  const three = E.batch([one, two]);

  const ast = E.fmap(() => E.map((x: number) => x + 1)(three))(one);

  let i = 0;
  E.walk((value: number) => {
    i += 1;
    switch(i) {
      case 1:
        return assert.equal(value, 2);
      case 2:
        return assert.equal(value, 3);
      case 3:
        return assert.equal(value, 3);
      case 4:
        return assert.equal(value, 2);
      case 5:
        return assert.equal(value, 3);
      case 6:
        return assert.equal(value, 3);
      default:
        return assert.fail();
    }
  })(E.run(interpreter)(ast));
});

test('Do you even lift, bro?', assert => {
  assert.plan(1);

  const one = E.of<number>(new GenericEffect('1one'));
  const two = E.of<number>(new GenericEffect('2two'));
  const sum = E.liftN((a, b) => a + b, one, two);

  E.walk((value: number) => assert.equal(value, 3))(E.run(interpreter)(sum))
});

test('it should stop when promises are rejected', assert => {
  assert.plan(1);
  const one = E.of<number>([new GenericEffect('1one'), new GenericEffect('2two')]);
  const two = E.of<number>(new GenericEffect('2two'));
  const three = E.batch([one, two]);

  const ast = E.fmap(() => E.map((x: number) => x + 1)(three))(one);
  const tree = E.run<number>(function(effect: GenericEffect) {
    switch(effect.name) {
    case '1one':
      return Promise.resolve(1);
    case '2two':
      return Promise.reject(undefined);
    default:
      return Promise.resolve(3);
    }
  })(ast);

  E.walk((value: number) => assert.equal(value, 2))(tree);
});

function interpreter(effect: GenericEffect) {
  switch(effect.name) {
    case '1one':
      return Promise.resolve(1);
    case '2two':
      return Promise.resolve(2);
    default:
      return Promise.resolve(3);
  }
}