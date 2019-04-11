import * as test from 'tape';
import * as Utils from './index';

test('it should performs right-to-left function composition', assert => {
  assert.plan(2);

  const add1 = (a: number) => a + 1;
  const toInt = (a: string, radix: number) => parseInt(a, radix);
  const f = Utils.compose(add1, Utils.identity, toInt);

  assert.equal(f.length, 2);
  assert.equal(f('10', 10), 11);
});

test('it should passes context to functions', assert => {
  assert.plan(1);

  interface IContext {
    x: number
    y: number
    z: number
  }

  function x(this: IContext, val: number) {
    return this.x * val;
  }
  function y(this: IContext, val: number) {
    return this.y * val;
  }
  function z(this: IContext, val: number) {
    return this.z * val;
  }

  const context = {
    a: Utils.compose(x, y, z),
    x: 4,
    y: 2,
    z: 1
  };

  assert.equal(context.a(5), 40);
});

test('it should compose two functions', assert => {
  assert.plan(1);

  const add2 = (a: number) => a + 2;
  const add4 = (a: number) => a + 4;

  assert.equal(Utils.compose(add2, add4)(1), add2(add4(1)));
});

test('it should be associative', assert => {
  assert.plan(1);

  const add2 = (a: number) => a + 2;
  const add4 = (a: number) => a + 4;
  const add6 = (a: number) => a + 6;

  assert.equal(Utils.compose(add2, Utils.compose(add4, add6))(1), Utils.compose(Utils.compose(add2, add4), add6)(1));
});

test('it should curries a single value', assert => {
  assert.plan(1);
  const f = Utils.curry((a: number, b: number, c: number, d: number) => (a + b * c) / d); // f(12, 3, 6, 2) == 15
  const g = f(12);
  assert.equal(g(3, 6, 2), 15);
});

test('it should curries multiple values', assert => {
  assert.plan(2);
  const f = Utils.curry((a: number, b: number, c: number, d: number) => (a + b * c) / d); // f(12, 3, 6, 2) == 15
  const g = f(12, 3);
  assert.equal(g(6, 2), 15);
  const h = f(12, 3, 6);
  assert.equal(h(2), 15);
});

test('it should allows further currying of a curried function', assert => {
  assert.plan(3);
  const f = Utils.curry((a: number, b: number, c: number, d: number) => (a + b * c) / d); // f(12, 3, 6, 2) == 15
  const g = f(12);
  assert.equal(g(3, 6, 2), 15);
  const h = g(3);
  assert.equal(h(6, 2), 15);
  assert.equal(g(3, 6)(2), 15);
});

test('it should properly reports the length of the curried function', assert => {
  assert.plan(4);
  const f = Utils.curry((a: number, b: number, c: number, d: number) => (a + b * c) / d); // f(12, 3, 6, 2) == 15
  assert.equal(f.length, 4);
  const g = f(12);
  assert.equal(g.length, 3);
  const h = g(3);
  assert.equal(h.length, 2);
  assert.equal(g(3, 6).length, 1);
});

test('it should preserves context', assert => {
  assert.plan(2);
  const ctx = {x: 10};
  const f = function(this: {x: number}, a: number, b: number) { return a + b * this.x; };
  const g = Utils.curry(f);

  assert.equal(g.call(ctx, 2, 4), 42);
  assert.equal(g.call(ctx, 2).call(ctx, 4), 42);
});

test('it should curry multiple values', assert => {
  assert.plan(4);

  const f = Utils.curry((a: number, b: number, c: number, d: number) => (a + b * c) / d); // f(12, 3, 6, 2) == 15

  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;

  assert.equal(f(a)(b)(c)(d), f(a, b, c, d));
  assert.equal(f(a)(b, c, d), f(a, b, c, d));
  assert.equal(f(a, b)(c, d), f(a, b, c, d));
  assert.equal(f(a, b, c)(d), f(a, b, c, d));
});

test('it should filter unique elements', assert => {
  assert.plan(3);

  assert.deepEqual(Utils.unique(x => x)([1, 1, 1, 1]), [1]);
  assert.deepEqual(Utils.unique(x => x)(['a', 'b', 'c']), ['a', 'b', 'c']);
  assert.deepEqual(Utils.unique((x: {id: number}) => x.id)([{id: 1}, {id: 1}, {id: 2}]), [{id: 1}, {id: 2}]);
});

test('it should parse the difference between two arrays', assert => {
  assert.plan(5);

  assert.deepEqual(Utils.diff(x => x, [1, 2, 3, 4, 5])([3, 4, 5, 6, 7]), [[1, 2], [3, 4, 5], [6, 7]]);
  assert.deepEqual(Utils.diff(x => x, [1, 2, 3])([1, 2, 3]), [[], [1, 2, 3], []]);
  assert.deepEqual(Utils.diff(x => x, [0, 1, 2, 3])([1, 2, 3]), [[0], [1, 2, 3], []]);
  assert.deepEqual(Utils.diff(x => x, [1, 2, 3])([1, 2, 3, 4]), [[], [1, 2, 3], [4]]);
  assert.deepEqual(Utils.diff(x => x, [1, 2, 3])([4, 5, 6]), [[1, 2, 3], [], [4, 5, 6]]);
});