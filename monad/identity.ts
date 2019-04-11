import {HKT} from './HKT';
import {curryN} from '../utils';

export class IsIdentity {
  private identity: 'IDENTITY';
}

export class Identity<T> extends HKT<IsIdentity, T> {}

export function inj<A>(a: A): Identity<A> {
  return (a as any) as Identity<A>;
}

export function prj<A>(fa: Identity<A>): A {
  return (fa as any) as A;
}

export function of<A>(value: A): Identity<A> {
  return inj(value);
}

export function map<A, B>(fn: (value: A) => B): (ma: Identity<A>) => Identity<B> {
  return (ma: Identity<A>): Identity<B> => {
    const a = prj(ma);
    return of(fn(a));
  };
}

export function fmap<A, B>(fn: (value: A) => Identity<B>): (ma: Identity<A>) => Identity<B> {
  return (ma: Identity<A>): Identity<B> => {
    const a = prj(ma);
    return fn(a);
  };
}

export function ap<A, B>(mb: Identity<(value: A) => B>): (ma: Identity<A>) => Identity<B> {
  return (ma: Identity<A>): Identity<B> => {
    const b = prj(mb);
    return of(b(prj(ma)));
  };
}

export function extract<A>(ma: Identity<A>): A {
  return prj(ma);
}

export class Do<T> {
  private constructor(public readonly value: Identity<T>) {}

  static of<T>(value: Identity<T> | T): Do<T> {
    return new Do(of(value as any));
  }

  map<U>(fn: (a: T) => U): Do<U> {
    return new Do(map(fn)(this.value));
  }

  fmap<U>(fn: (a: T) => Identity<U>): Do<U> {
    return new Do(fmap(fn)(this.value));
  }

  extract(): T {
    return extract(this.value);
  }
}