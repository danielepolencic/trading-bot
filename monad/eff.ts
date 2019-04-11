import {HKT2} from './HKT';
import * as Free from './freer';

export class IsEff {
  private eff: 'EFF';
}

type EffV<E, A> = {eff: E, f: (a: any) => A};

export class Eff<E, A> extends HKT2<IsEff, E, A> {}

export function inj<E, A>(io: EffV<E, A>): Eff<E, A> {
  return (io as any) as Eff<E, A>;
}

export function prj<E, A>(mio: Eff<E, A>): EffV<E, A> {
  return (mio as any) as EffV<E, A>;
}

export function of<E, A>(eff: E): Eff<E, A> {
  return inj<E, A>({eff, f: x => x});
}

export function map<E, A, B>(fn: (value: A) => B): (fa: Eff<E, A>) => Eff<E, B> {
  return (fa: Eff<E, A>): Eff<E, B> => {
    const a = prj(fa);
    return inj<E, B>({eff: a.eff, f: (aa: A) => fn(a.f(aa))});
  };
}

export function join<E, A>(interpreter: (effect: E) => Promise<A>) {
  return (fa: Eff<E, A>): Promise<A> => {
    const a = prj(fa);
    return interpreter(a.eff).then(a.f);
  };
}

export function joinNoPromise<E, A>(interpreter: (effect: E, next: (value: any) => any) => A) {
  return (fa: Eff<E, A>): A => {
    const a = prj(fa);
    return interpreter(a.eff, a.f);
  };
}