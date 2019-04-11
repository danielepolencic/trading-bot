import {HKT2} from './HKT';
import {curryN, Fn1} from '../utils';

class IsEither {
  private either: 'EITHER';
}

export class Either<L, R> extends HKT2<IsEither, L, R> {}

type Left<L> = {valueL: L};
type Right<R> = {valueR: R};

export function inj<L, R>(a: Left<L> | Right<R>): Either<L, R> {
  return (a as any) as Either<L, R>
}

export function prj<L, R>(a: Either<L, R>): Left<L> | Right<R> {
  return (a as any) as Left<L> | Right<R>;
}

export function Left<L, R>(a: L): Either<L, R> {
  return inj<L, R>({valueL: a});
}

export function Right<L, R>(a: R): Either<L, R> {
  return inj<L, R>({valueR: a});
}

export function map<L, A, B>(fn: (value: A) => B): (fa: Either<L, A>) => Either<L, B> {
  return (fa: Either<L, A>): Either<L, B> => {
    const a = prj<L, A>(fa);
    return a.hasOwnProperty('valueL') ? inj<L, B>(a as Left<L>) : Right<L, B>(fn((a as Right<A>).valueR));
  };
}

export function fmap<L, A, B>(fn: (value: A) => Either<L, B>): (fa: Either<L, A>) => Either<L, B> {
  return (fa: Either<L, A>): Either<L, B> => {
    const a = prj<L, A>(fa);
    return a.hasOwnProperty('valueL') ? inj<L, B>(a as Left<L>) : fn((a as Right<A>).valueR);
  };
}

export function ap<L, A, B>(eb: Either<L, (value: A) => B>): (ea: Either<L, A>) => Either<L, B> {
  return (ea: Either<L, A>): Either<L, B> => {
    const a = prj(ea);
    const b = prj(eb);
    return a.hasOwnProperty('valueL') ? inj<L, B>(a as Left<L>) :
      b.hasOwnProperty('valueR') ? Right<L, B>((b as Right<(value: A) => B>).valueR((a as Right<A>).valueR)) : inj<L, B>((b as Left<L>));
  };
}

export function cata<L, R, A, B>(left: (value: L) => A, right: (value: R) => B): (ea: Either<L, R>) => A | B {
  return (ea: Either<L, R>): A | B => {
    const a = prj(ea);
    return a.hasOwnProperty('valueL') ? left((a as Left<L>).valueL) : right((a as Right<R>).valueR);
  };
}

export function lift2<L, R1, R2, R3>(fn: (e1: R1, e2: R2) => R3, eV1: Either<L, R1>, eV2: Either<L, R2>): Either<L, R3> {
  const curried = (e1: R1) => (e2: R2) => fn(e1, e2);
  return ap<L, R2, R3>(map<L, R1, (e2: R2) => R3>(curried)(eV1))(eV2);
}

export function lift3<L, R1, R2, R3, R4>(fn: (e1: R1, e2: R2, e3: R3) => R4, eV1: Either<L, R1>, eV2: Either<L, R2>, eV3: Either<L, R3>): Either<L, R4> {
  const curried = (e1: R1) => (e2: R2) => (e3: R3) => fn(e1, e2, e3);
  return ap<L, R3, R4>(ap<L, R2, (value: R3) => R4>(map<L, R1, (e2: R2) => (e3: R3) => R4>(curried)(eV1))(eV2))(eV3);
}

export function lift4<L, R1, R2, R3, R4, R5>(fn: (e1: R1, e2: R2, e3: R3, e4: R4) => R5, eV1: Either<L, R1>, eV2: Either<L, R2>, eV3: Either<L, R3>, eV4: Either<L, R4>): Either<L, R5> {
  const curried = (e1: R1) => (e2: R2) => (e3: R3) => (e4: R4) => fn(e1, e2, e3, e4);
  return ap<L, R4, R5>(ap<L, R3, (e4: R4) => R5>(ap<L, R2, (value: R3) => (e4: R4) => R5>(map<L, R1, (e2: R2) => (e3: R3) => (e4: R4) => R5>(curried)(eV1))(eV2))(eV3))(eV4);
}

export class Do<L, R> {
  private constructor(public readonly value: Either<L, R>) {}

  static of<L, R>(value: Either<L, R>): Do<L, R> {
    return new Do(value);
  }

  static Left<L, R>(value: L): Do<L, R> {
    return new Do(Left<L, R>(value));
  }

  static Right<L, R>(value: R): Do<L, R> {
    return new Do(Right<L, R>(value));
  }

  map<U>(fn: (a: R) => U): Do<L, U> {
    return new Do(map<L, R, U>(fn)(this.value));
  }

  fmap<U>(fn: (a: R) => Either<L, U>): Do<L, U> {
    return new Do(fmap<L, R, U>(fn)(this.value));
  }

  cata<T, U>(left: (value: L) => T, right: (value: R) => U): T | U {
    return cata(left, right)(this.value);
  }
}