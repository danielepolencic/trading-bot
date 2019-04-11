import {HKT} from './HKT';

export class IsMaybe {
  private maybe: 'MAYBE';
}

export type MaybeV<T> = T | void | null;
export class Maybe<T> extends HKT<IsMaybe, T> {}

export const Nothing = inj<any>(null);

export function inj<A>(a: MaybeV<A>): Maybe<A> {
  return (a as any) as Maybe<A>;
}

export function prj<A>(fa: Maybe<A>): MaybeV<A> {
  return (fa as any) as MaybeV<A>;
}

export function of<A>(value: MaybeV<A>): Maybe<A> {
  return inj<A>(value);
}

export function map<A, B>(fn: (value: A) => B): (ma: Maybe<A>) => Maybe<B> {
  return (ma: Maybe<A>): Maybe<B> => {
    const a = prj(ma);
    return isUndefined(a) ? Nothing : of(fn(a));
  };
}

export function fmap<A, B>(fn: (value: A) => Maybe<B>): (ma: Maybe<A>) => Maybe<B> {
  return (ma: Maybe<A>): Maybe<B> => {
    const a = prj(ma);
    return isUndefined(a) ? Nothing : fn(a);
  };
}

export function ap<A, B>(mb: Maybe<(value: A) => B>): (ma: Maybe<A>) => Maybe<B> {
  return (ma: Maybe<A>): Maybe<B> => {
    const b = prj<(value: A) => B>(mb);
    const a = prj<A>(ma);
    return (isUndefined(a) || !isFunction(b)) ? Nothing : of((b as (a: A) => B)((a as A)));
  };
}

export function orElse<A, B>(mb: Maybe<B>): (ma: Maybe<A>) => Maybe<A | B> {
  return (ma: Maybe<A>): Maybe<A | B> => {
    const a = prj(ma);
    return isUndefined(a) ? mb : ma;
  };
}

export function orSome<A, B>(b: B): (ma: Maybe<A>) => A | B {
  return (ma: Maybe<A>): A | B => {
    const a = prj(ma);
    return isUndefined(a) ? b : a;
  };
}

function isUndefined<T>(x: T | void | null): x is void | null {
    return x === undefined || x === null;
}

function isDefined<T>(x: T | void | null): x is T {
    return x !== undefined && x !== null;
}

export class Do<T> {
  private constructor(public readonly value: Maybe<T>) {}

  static of<T>(value: Maybe<T> | T | void | null): Do<T> {
    return new Do(of(value as any));
  }

  map<U>(fn: (a: T) => U): Do<U> {
    return new Do(map(fn)(this.value));
  }

  fmap<U>(fn: (a: T) => Maybe<U>): Do<U> {
    return new Do(fmap(fn)(this.value));
  }

  orElse<U>(mb: Maybe<U>): Do<T | U> {
    return new Do(orElse<T, U>(mb)(this.value));
  }

  orSome<U>(b: U): T | U {
    return orSome<T, U>(b)(this.value);
  }
}

export function lift2<S, T, U>(fn: (m1: S, m2: T) => U, mV1: Maybe<S>, mV2: Maybe<T>): Maybe<U> {
  const curried = (m1: S) => (m2: T) => fn(m1, m2);
  return ap(map(curried)(mV1))(mV2);
}

export function lift3<R, S, T, U>(fn: (m1: R, m2: S, m3: T) => U, mV1: Maybe<R>, mV2: Maybe<S>, mV3: Maybe<T>): Maybe<U> {
  const curried = (m1: R) => (m2: S) => (m3: T) => fn(m1, m2, m3);
  return ap(ap(map(curried)(mV1))(mV2))(mV3);
}

export function lift4<Q, R, S, T, U>(fn: (m1: Q, m2: R, m3: S, m4: T) => U, mV1: Maybe<Q>, mV2: Maybe<R>, mV3: Maybe<S>, mV4: Maybe<T>): Maybe<U> {
  const curried = (m1: Q) => (m2: R) => (m3: S) => (m4: T) => fn(m1, m2, m3, m4);
  return ap(ap(ap(map(curried)(mV1))(mV2))(mV3))(mV4);
}

function isFunction(value: any): boolean {
  return ({}).toString.call(value) === '[object Function]';
}