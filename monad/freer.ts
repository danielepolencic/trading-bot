import {HKT} from './HKT';

class IsFree {
  private free: 'FREE';
}

interface Functor<F> {
  map<A, B>(fn: (value: A) => B): (fa: HKT<F, A>) => HKT<F, B>
}

export class Free<F, A> extends HKT<F, A> {}

type Return<A> = {return: A};
type Suspend<F, A> = {suspend: HKT<F, Free<F, A>>};

export function inj<F, A>(f: Return<A> | Suspend<F, A>): Free<F, A> {
  return (f as any) as Free<F, A>;
}

export function prj<F, A>(fa: Free<F, A>): Return<A> | Suspend<F, A> {
  return (fa as any) as Return<A> | Suspend<F, A>;
}

export function of<F, A>(a: A): Free<F, A> {
  return inj<F, A>({return: a});
}

export function suspend<F, A>(ffa: HKT<F, Free<F, A>>): Free<F, A> {
  return inj<F, A>({suspend: ffa});
}

export function liftFree<F, A>(functor: Functor<F>): (fa: HKT<F, A>) => Free<F, A> {
  return (fa: HKT<F, A>): Free<F, A> => {
    return suspend<F, A>(functor.map<A, Free<F, A>>(of)(fa));
  };
}

export function foldFree<F, A>(functor: Functor<F>, join: (fa: HKT<F, A>) => A): (ffa: Free<F, A>) => A {
  return (ffa: Free<F, A>): A => {
    const fa = prj(ffa)
    if (fa.hasOwnProperty('return')) {
      return (fa as Return<A>).return;
    }
    return join(functor.map(foldFree(functor, join))((fa as Suspend<F, A>).suspend));
  };
}

export function freeMonad<F>(functor: Functor<F>) {

  function map<A, B>(f: (a: A) => B): (fa: Free<F, A>) => Free<F, B> {
    return (fa: Free<F, A>): Free<F, B> => {
      const a = prj(fa);
      if (fa.hasOwnProperty('return')) {
        return of<F, B>(f((a as Return<A>).return));
      }
      return suspend(functor.map(map(f))((a as Suspend<F, A>).suspend));
    };
  }

  function ap<A, B>(fab: Free<F, (a: A) => B>): (fa: Free<F, A>) => Free<F, B> {
    return (fa: Free<F, A>): Free<F, B> => {
      return fmap<(a: A) => B, B>(f => map(f)(fa))(fab) // <= derived
    };
  }

  function join<A>(ffa: Free<F, Free<F, A>>): Free<F, A> {
    const fa = prj(ffa)
    if (fa.hasOwnProperty('return')) {
      return (fa as Return<Free<F, A>>).return
    }
    return suspend<F, A>(functor.map<HKT<F, Free<F, A>>, Free<F, A>>(join)((fa as Suspend<F, Free<F, A>>).suspend));
  }

  function fmap<A, B>(f: (a: A) => Free<F, B>): (fa: Free<F, A>) => Free<F, B> {
    return (fa: Free<F, A>): Free<F, B> => {
      return join(map(f)(fa)) // <= derived
    };
  }

  return {
    map,
    ap,
    of,
    fmap
  };
}