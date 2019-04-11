interface Variadic<T> {
    (...args: any[]): T;
}

export type Fn1<A, B> = (a: A, ...rest: Array<void>) => B;
export type Fn2<A, B, C> = (a: A, b: B, ...rest: Array<void>) => C;
export type Fn3<A, B, C, D> = (a: A, b: B, c: C, ...rest: Array<void>) => D;
export type Fn4<A, B, C, D, E> = (a: A, b: B, c: C, d: D, ...rest: Array<void>) => E;
export type Fn5<A, B, C, D, E, F> = (a: A, b: B, c: C, d: D, e: E, ...rest: Array<void>) => F;
export type Fn6<A, B, C, D, E, F, G> = (a: A, b: B, c: C, d: D, e: E, f: F, ...rest: Array<void>) => G;
export type Fn7<A, B, C, D, E, F, G, H> = (a: A, b: B, c: C, d: D, e: E, f: F, g: G, ...rest: Array<void>) => H;
export type Fn8<A, B, C, D, E, F, G, H, I> = (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, ...rest: Array<void>) => I;
export type Fn9<A, B, C, D, E, F, G, H, I, L> = (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, ...rest: Array<void>) => L;

export type CurriedFn2<A, B, C> =
  & Fn1<A, Fn1<B, C>>
  & Fn2<A, B, C>;
export type CurriedFn3<A, B, C, D> =
  & Fn1<A, CurriedFn2<B, C, D>>
  & Fn2<A, B, Fn1<C, D>>
  & Fn3<A, B, C, D>;
export type CurriedFn4<A, B, C, D, E> =
  & Fn1<A, CurriedFn3<B, C, D, E>>
  & Fn2<A, B, CurriedFn2<C, D, E>>
  & Fn3<A, B, C, Fn1<D, E>>
  & Fn4<A, B, C, D, E>;
export type CurriedFn5<A, B, C, D, E, F> =
  & Fn1<A, CurriedFn4<B, C, D, E, F>>
  & Fn2<A, B, CurriedFn3<C, D, E, F>>
  & Fn3<A, B, C, CurriedFn2<D, E, F>>
  & Fn4<A, B, C, D, Fn1<E, F>>
  & Fn5<A, B, C, D, E, F>;

export function curry<A, B, C>(f: Fn2<A, B, C>): CurriedFn2<A, B, C>;
export function curry<A, B, C, D>(f: Fn3<A, B, C, D>): CurriedFn3<A, B, C, D>;
export function curry<A, B, C, D, E>(f: Fn4<A, B, C, D, E>): CurriedFn4<A, B, C, D, E>;
export function curry<A, B, C, D, E, F>(f: Fn5<A, B, C, D, E, F>): CurriedFn5<A, B, C, D, E, F>;
export function curry<T>(fn: Variadic<T>): Variadic<T> {
  return curryN(fn.length, fn);
}

export function curryN<A, B, C>(times: number, f: Fn2<A, B, C>): CurriedFn2<A, B, C>;
export function curryN<A, B, C, D>(times: number, f: Fn3<A, B, C, D>): CurriedFn3<A, B, C, D>;
export function curryN<A, B, C, D, E>(times: number, f: Fn4<A, B, C, D, E>): CurriedFn4<A, B, C, D, E>;
export function curryN<A, B, C, D, E, F>(times: number, f: Fn5<A, B, C, D, E, F>): CurriedFn5<A, B, C, D, E, F>;
export function curryN<T>(times: number, fn: Variadic<T>): Variadic<T> {
  return arity(fn.length, function wrap(this: any, ...args: any[]) {
    if (args.length < times) {
      return arity(times - args.length, function (this: any, ...moreArgs: any[]) {
        return wrap.apply(this, args.concat(moreArgs))
      });
    }
    return fn.apply(this, args);
  });
}

export function identity<A>(a: A): A {
  return a;
}

export function compose<V0, T1>(fn0: (x0: V0) => T1): (x0: V0) => T1;
export function compose<V0, V1, T1>(fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T1;
export function compose<V0, V1, V2, T1>(fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T1;
export function compose<V0, V1, V2, V3, T1>(fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T1;
export function compose<V0, T1, T2>(fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T2;
export function compose<V0, V1, T1, T2>(fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T2;
export function compose<V0, V1, V2, T1, T2>(fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T2;
export function compose<V0, V1, V2, V3, T1, T2>(fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T2;
export function compose<V0, T1, T2, T3>(fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T3;
export function compose<V0, V1, T1, T2, T3>(fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T3;
export function compose<V0, V1, V2, T1, T2, T3>(fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T3;
export function compose<V0, V1, V2, V3, T1, T2, T3>(fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T3;
export function compose<V0, T1, T2, T3, T4>(fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T4;
export function compose<V0, V1, T1, T2, T3, T4>(fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T4;
export function compose<V0, V1, V2, T1, T2, T3, T4>(fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T4;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4>(fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T4;
export function compose<V0, T1, T2, T3, T4, T5>(fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T5;
export function compose<V0, V1, T1, T2, T3, T4, T5>(fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T5;
export function compose<V0, V1, V2, T1, T2, T3, T4, T5>(fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T5;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4, T5>(fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T5;
export function compose<V0, T1, T2, T3, T4, T5, T6>(fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T6;
export function compose<V0, V1, T1, T2, T3, T4, T5, T6>(fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T6;
export function compose<V0, V1, V2, T1, T2, T3, T4, T5, T6>(fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T6;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4, T5, T6>(fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T6;
export function compose<V0, T1, T2, T3, T4, T5, T6, T7>(fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T7;
export function compose<V0, V1, T1, T2, T3, T4, T5, T6, T7>(fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T7;
export function compose<V0, V1, V2, T1, T2, T3, T4, T5, T6, T7>(fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T7;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4, T5, T6, T7>(fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T7;
export function compose<V0, T1, T2, T3, T4, T5, T6, T7, T8>(fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T8;
export function compose<V0, V1, T1, T2, T3, T4, T5, T6, T7, T8>(fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T8;
export function compose<V0, V1, V2, T1, T2, T3, T4, T5, T6, T7, T8>(fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T8;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4, T5, T6, T7, T8>(fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T8;
export function compose<V0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn8: (x: T8) => T9, fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0) => T1): (x0: V0) => T9;
export function compose<V0, V1, T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn8: (x: T8) => T9, fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1) => T1): (x0: V0, x1: V1) => T9;
export function compose<V0, V1, V2, T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn8: (x: T8) => T9, fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2) => T1): (x0: V0, x1: V1, x2: V2) => T9;
export function compose<V0, V1, V2, V3, T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn8: (x: T8) => T9, fn7: (x: T7) => T8, fn6: (x: T6) => T7, fn5: (x: T5) => T6, fn4: (x: T4) => T5, fn3: (x: T3) => T4, fn2: (x: T2) => T3, fn1: (x: T1) => T2, fn0: (x0: V0, x1: V1, x2: V2, x3: V3) => T1): (x0: V0, x1: V1, x2: V2, x3: V3) => T9;
export function compose(...fns: Function[]): Function {
  return pipe.apply(null, fns.reverse());
}

function pipe(...fns: Function[]): Function {
  return arity(fns[0].length, function (this: any, ...args: any[]) {
    switch (fns.length) {
      case 0:
        throw new Error('pipe requires at least one argument');
      case 1:
        return fns[0].apply(this, args);
      default:
        return fns.slice(1).reduce((acc, fn) => {
          return fn.call(this, acc);
        }, fns[0].apply(this, args));
    }
  });
}

function arity<T>(n: number, fn: Variadic<T>): Variadic<T> {
  switch (n) {
    case 0: return function(this: any, ) { return fn.apply(this, arguments); };
    case 1: return function(this: any,a0) { return fn.apply(this, arguments); };
    case 2: return function(this: any,a0, a1) { return fn.apply(this, arguments); };
    case 3: return function(this: any,a0, a1, a2) { return fn.apply(this, arguments); };
    case 4: return function(this: any,a0, a1, a2, a3) { return fn.apply(this, arguments); };
    case 5: return function(this: any,a0, a1, a2, a3, a4) { return fn.apply(this, arguments); };
    case 6: return function(this: any,a0, a1, a2, a3, a4, a5) { return fn.apply(this, arguments); };
    case 7: return function(this: any,a0, a1, a2, a3, a4, a5, a6) { return fn.apply(this, arguments); };
    case 8: return function(this: any,a0, a1, a2, a3, a4, a5, a6, a7) { return fn.apply(this, arguments); };
    case 9: return function(this: any,a0, a1, a2, a3, a4, a5, a6, a7, a8) { return fn.apply(this, arguments); };
    case 10: return function(this: any,a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) { return fn.apply(this, arguments); };
    default: throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
  }
}

export function unique<T>(fn: (value: T) => any) {
  return (array: T[]): T[] => {
    return array
      .map(it => ({item: it, value: fn(it)}))
      .reduce((acc, it) => {
        return (acc.find(x => x.value === it.value)) ?
          acc : acc.concat(it);
      }, [] as {item: T, value: any}[])
      .map(it => it.item);
  };
}

export function diff<T>(fn: (value: T) => any, arrayA: T[]) {
  return (arrayB: T[]): [T[], T[], T[]] => {
    return [
      arrayA.filter(a => !arrayB.find(b => fn(a) === fn(b))),
      arrayA.filter(a => !!arrayB.find(b => fn(a) === fn(b))),
      arrayB.filter(b => !arrayA.find(a => fn(a) === fn(b)))
    ];
  };
}

export function isPromise<A>(obj: any): obj is Promise<A> {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}