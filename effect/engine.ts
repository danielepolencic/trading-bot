import * as Free from '../monad/freer';
import * as Eff from '../monad/eff';
import * as List from '../monad/list';
import {compose, curryN, isPromise} from '../utils';
import {HKT} from '../monad/HKT';

export class IsEngine {
  private system: 'Engine';
}

export class Engine<A> extends HKT<IsEngine, A> {}

const Functor = {
  map: <A, B>(fn: (value: A) => B) => (ffa: Engine<A>): Engine<B> => inj(List.map(Eff.map(fn))(prj(ffa)))
};

const Applicative = {
  of: <A>(value: any): Engine<A> => compose<{}, List.List<{}>, {}, Engine<A>>(inj, List.map<A, Eff.Eff<any, A>>(Eff.of), List.of)(value)
};

const Comonad = {
  join: <A>(interpreter: <E>(effect: E) => Promise<A>) => (ffa: Engine<A>) => {
    return List.prj(List.map(Eff.join(interpreter))(prj(ffa)));
  }
};

const E = Free.freeMonad<IsEngine>(Functor);

export function inj<A>(a: List.List<Eff.Eff<any, A>>): Engine<A> {
  return (a as any) as Engine<A>;
}

export function prj<A>(a: Engine<A>): List.List<Eff.Eff<any, A>> {
  return (a as any) as List.List<Eff.Eff<any, A>>;
}

export function of<A>(effect: any): Engine<A> {
  return Free.liftFree<IsEngine, A>(Functor)(Applicative.of<A>(effect));
}

export function run<A>(interpreter: (effect: any) => Promise<A>) {
  return (ffa: Engine<A>): Promise<A>[] | Promise<A> | A => {
    return Free.foldFree<IsEngine, Promise<A>[] | Promise<A> | A>(Functor, Comonad.join<A>(interpreter))(ffa);
  };
}

export function map<A, B>(fn: (value: A) => B): (fa: Engine<A>) => Engine<B> {
  return (fa: Engine<A>): Engine<B> => {
    return E.map(fn)(fa);
  };
}

export function fmap<A, B>(fn: (value: A) => Engine<B>): (fa: Engine<A>) => Engine<B> {
  return (fa: Engine<A>): Engine<B> => {
    return E.fmap(fn)(fa);
  };
}

export function ap<A, B>(fb: Engine<(value: A) => B>): (fa: Engine<A>) => Engine<B> {
  return (fa: Engine<A>): Engine<B> => {
    return E.ap(fb)(fa);
  };
}

export function batch<A>(fas: Engine<A>[]): Engine<A> {
  // Hack:
  const effects = fas.reduce((acc, it: any) => acc.concat(it.suspend), [] as any[]);
  return Free.suspend(effects as any) as any;
}

export function lift2<A, B, C>(fn: (a: A, b: B) => C, aV: Engine<A>, bV: Engine<B>): Engine<C> {
  return liftN(fn, aV, bV);
}

export function lift3<A, B, C, D>(fn: (a: A, b: B, c: C) => D, aV: Engine<A>, bV: Engine<B>, cV: Engine<C>): Engine<D> {
  return liftN(fn, aV, bV, cV);
}

export function lift4<A, B, C, D, F>(fn: (a: A, b: B, c: C, d: D) => F, aV: Engine<A>, bV: Engine<B>, cV: Engine<C>, dV: Engine<D>): Engine<F> {
  return liftN(fn, aV, bV, cV, dV);
}

export function lift5<A, B, C, D, F, G>(fn: (a: A, b: B, c: C, d: D, f: F) => G, aV: Engine<A>, bV: Engine<B>, cV: Engine<C>, dV: Engine<D>, fV: Engine<F>): Engine<G> {
  return liftN(fn, aV, bV, cV, dV, fV);
}

export function lift6<A, B, C, D, F, G, H>(fn: (a: A, b: B, c: C, d: D, f: F, g: G) => H, aV: Engine<A>, bV: Engine<B>, cV: Engine<C>, dV: Engine<D>, fV: Engine<F>, gV: Engine<G>): Engine<H> {
  return liftN(fn, aV, bV, cV, dV, fV, gV);
}

export function liftN<A>(fn: (...args: any[]) => A, ...aV: Engine<any>[]): Engine<A> {
  switch(aV.length) {
    case 0:
      throw new Error('Please provide an array of effects');
    case 1:
      return aV[0];
    default:
      const curried = curryN(aV.length, fn);
      return aV.slice(1).reduce((acc, aV) => ap(acc)(aV), map<any, any>(curried)(aV[0]));
  }
}

export function walk<A>(fn: (value: A) => void) {
  return function recurse(tree: Promise<A>[] | Promise<A> | A): void {
    if (Array.isArray(tree)) {
      return tree.forEach(recurse);
    }
    if (isPromise(tree)) {
      tree.then(recurse).catch(() => {});
      return;
    }
    return fn(tree);
  };
}