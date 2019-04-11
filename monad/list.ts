import {HKT} from './HKT';

export class IsList {
  private eff: 'List';
}

type ListV<A> = A[];

export class List<A> extends HKT<IsList, A> {}

export function inj<A>(a: ListV<A>): List<A> {
  return (a as any) as List<A>;
}

export function prj<A>(ma: List<A>): ListV<A> {
  return (ma as any) as ListV<A>;
}

export function of<A>(a: A | A[]): List<A> {
  return inj<A>(Array.isArray(a) ? a : [a]);
}

export function map<A, B>(fn: (value: A) => B): (fa: List<A>) => List<B> {
  return (fa: List<A>): List<B> => {
    const a = prj(fa);
    return inj<B>(a.map(fn));
  };
}

export function join<A>(fa: List<A>): A[] {
  const a = prj(fa);
  return a.reduce((acc, it) => {
    return acc.concat(it);
  }, [] as A[]);
}