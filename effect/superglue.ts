import * as Effect from './defaultEffects';
import * as E from './engine';
import * as S from './system';

export class SuperglueEffect<T> extends Effect.GenericEffect {
  constructor(public readonly effect: E.Engine<T>) {super()}
}

export function Superglue<T>(effect: E.Engine<T>) {
  return S.of<Error, T>(new SuperglueEffect(effect));
}
