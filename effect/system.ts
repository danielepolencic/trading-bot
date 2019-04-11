import * as Free from '../monad/freer';
import * as Eff from '../monad/eff';
import {HKT, HKT2} from '../monad/HKT';
import * as Either from '../monad/either';
import {GenericEffect} from './defaultEffects';

const S = Free.freeMonad<HKT<Eff.IsEff, GenericEffect>>(Eff);

export class IsSystem {
  private system: 'System';
}

export class System<E, A> extends HKT2<IsSystem, E, A> {}

export function inj<E, A>(a: Free.Free<HKT<Eff.IsEff, GenericEffect>, Either.Either<E, A>>): System<E, A> {
  return (a as any) as System<E, A>;
}

export function prj<E, A>(a: System<E, A>): Free.Free<HKT<Eff.IsEff, GenericEffect>, Either.Either<E, A>> {
  return (a as any) as Free.Free<HKT<Eff.IsEff, GenericEffect>, Either.Either<E, A>>;
}

export function of<E, A>(effect: GenericEffect): System<E, A> {
  return inj<E, A>(Free.liftFree<HKT<Eff.IsEff, GenericEffect>, Either.Either<E, A>>(Eff)(Eff.of<GenericEffect, Either.Either<E, A>>(effect)));
}

export function map<E, A, B>(f: (a: A) => B): (ffa: System<E, A>) => System<E, B> {
  return (ffa: System<E, A>): System<E, B> => {
    const fa = prj(ffa);
    return inj<E, B>(S.map(Either.map<E, A, B>(f))(fa));
  };
}

export function fmap<E, A, B>(f: (a: A) => System<E, B>): (ffa: System<E, A>) => System<E, B> {
  return (ffa: System<E, A>): System<E, B> => {
    const fa = prj(ffa);
    return inj<E, B>(S.fmap<Either.Either<E, A>, Either.Either<E, B>>(a => {
      return Either.cata(
        error => fa as any, // if there's an error, it's in the previous step. We haven't unpacked the new effect yet.
        (s: A) => prj(f(s)))(a);
    })(fa));
  };
}

export function ap<E, A, B>(fab: System<E, (a: A) => B>): (fa: System<E, A>) => System<E, B> {
  return (fa: System<E, A>): System<E, B> => {
    const a = prj(fa);
    const ab = prj(fab);
    // this is a S.lift2 :)
    const curried = (ab: Either.Either<E, (a: A) => B>) => (a: Either.Either<E, A>) => Either.ap(ab)(a);
    return inj<E, B>(S.ap(S.map(curried)(ab))(a));
  };
}

export function bimap<E, A, F, B>(left: (value: E) => F, right: (value: A) => B): (ffa: System<E, A>) => System<E | F, A | B> {
  return (ffa: System<E, A>): System<E | F, A | B> => {
    const fa = prj(ffa);
    return inj<E | F, A | B>(S.map((a: Either.Either<E, A>) => Either.cata(
      (l: E) => Either.Left<F, A>(left(l)),
      (r: A) => Either.Right<E, B>(right(r)))(a))(fa));
  };
}

export function bifmap<E, A, F, B, G, C>(left: (value: E) => System<F, B>, right: (value: A) => System<G, C>): (ffa: System<E, A>) => System<F | G, B | C> {
  return (ffa: System<E, A>): System<F | G, B | C> => {
    const fa = prj(ffa);
    return inj<F | G, B | C>(S.fmap<Either.Either<E, A>, Either.Either<F | G, B | C>>(a => Either.cata(
      (l: E) => prj(left(l)),
      (r: A) => prj(right(r)))
    (a))(fa));
  };
}

export function lift2<E, A, B, C>(fn: (a: A, b: B) => C, aV: System<E, A>, bV: System<E, B>): System<E, C> {
  const curried = (a: A) => (b: B) => fn(a, b);
  return ap(map<E, A, (b: B) => C>(curried)(aV))(bV);
}

export function lift3<E, A, B, C, D>(fn: (a: A, b: B, c: C) => D, aV: System<E, A>, bV: System<E, B>, cV: System<E, C>): System<E, D> {
  const curried = (a: A) => (b: B) => (c: C) => fn(a, b, c);
  return ap(ap(map<E, A, (b: B) => (c: C) => D>(curried)(aV))(bV))(cV);
}

export function lift4<E, A, B, C, D, F>(fn: (a: A, b: B, c: C, d: D) => F, aV: System<E, A>, bV: System<E, B>, cV: System<E, C>, dV: System<E, D>): System<E, F> {
  const curried = (a: A) => (b: B) => (c: C) => (d: D) => fn(a, b, c, d);
  return ap(ap(ap(map<E, A, (b: B) => (c: C) => (d: D) => F>(curried)(aV))(bV))(cV))(dV);
}

export function lift5<E, A, B, C, D, F, G>(fn: (a: A, b: B, c: C, d: D, f: F) => G, aV: System<E, A>, bV: System<E, B>, cV: System<E, C>, dV: System<E, D>, fV: System<E, F>): System<E, G> {
  const curried = (a: A) => (b: B) => (c: C) => (d: D) => (f: F) => fn(a, b, c, d, f);
  return ap(ap(ap(ap(map<E, A, (b: B) => (c: C) => (d: D) => (f: F) => G>(curried)(aV))(bV))(cV))(dV))(fV);
}

export function lift6<E, A, B, C, D, F, G, H>(fn: (a: A, b: B, c: C, d: D, f: F, g: G) => H, aV: System<E, A>, bV: System<E, B>, cV: System<E, C>, dV: System<E, D>, fV: System<E, F>, gV: System<E, G>): System<E, H> {
  const curried = (a: A) => (b: B) => (c: C) => (d: D) => (f: F) => (g: G) => fn(a, b, c, d, f, g);
  return ap(ap(ap(ap(ap(map<E, A, (b: B) => (c: C) => (d: D) => (f: F) => (g: G) => H>(curried)(aV))(bV))(cV))(dV))(fV))(gV);
}

export function run<E, A>(interpreter: (effect: GenericEffect, q: (value: Either.Either<E, A>) => void) => any, ffa: System<E, A>): Either.Either<E, A> {
  return Free.foldFree(Eff, Eff.joinNoPromise(interpreter))(prj(ffa));
}

export class Do<E, A> {
  constructor(public readonly value: System<E, A>) {}

  static of<E, A>(effect: GenericEffect): Do<E, A> {
    return new Do(of<E, A>(effect));
  }

  map<B>(fn: (a: A) => B): Do<E, B> {
    return new Do(map<E, A, B>(fn)(this.value));
  }

  fmap<B>(fn: (a: A) => System<E, B>): Do<E, B> {
    return new Do(fmap(fn)(this.value));
  }

  bimap<F, B>(left: (value: E) => F, right: (value: A) => B): Do<E | F, A | B> {
    return new Do(bimap(left, right)(this.value));
  }

  bifmap<F, G, B, C>(left: (value: E) => System<F, B>, right: (value: A) => System<G, C>): Do<F | G, B | C> {
    return new Do(bifmap(left, right)(this.value));
  }
}