import {HKT} from './HKT';
import * as Free from './freer';

export class IsReader {
  private reader: 'READER';
}

type ReaderV<IO> = () => IO;

export class Reader<IO> extends HKT<IsReader, IO> {}

export function inj<IO>(io: ReaderV<IO>): Reader<IO> {
  return (io as any) as Reader<IO>;
}

export function prj<IO>(mio: Reader<IO>): ReaderV<IO> {
  return (mio as any) as ReaderV<IO>;
}

export function of<IO>(io: IO): Reader<IO> {
  return inj(() => io);
}

export function map<A, B>(fn: (value: A) => B): (fa: Reader<A>) => Reader<B> {
  return (fa: Reader<A>): Reader<B> => {
    const a = prj(fa);
    return inj<B>(() => fn(a()));
  };
}

export function join<A>(ffa: Reader<A>): A {
  const a = prj(ffa);
  return a();
}