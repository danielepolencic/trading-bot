import * as S from './system';
import * as Either from '../monad/either';
import * as ActorSystem from './actor';

export class GenericEffect {}

export class NoneEffect extends GenericEffect {}

export function None() {
  return S.of<any, IMessageNone>(new NoneEffect());
}

export function execNone(effect: NoneEffect): Promise<Either.Either<any, IMessageNone>> {
  return Promise.resolve(Either.Right<any, IMessageNone>({type: NONE}));
}

export class ConstantEffect extends GenericEffect {
  constructor(public readonly constant: Either.Either<any, any>) {super()}
}

export function Constant<E, T>(value: Either.Either<E, T>) {
  return S.of<E, T>(new ConstantEffect(value));
}

export function Const<T>(value: T) {
  return S.of<Error, T>(new ConstantEffect(Either.Right(value)));
}

export function execConstant(effect: ConstantEffect): Promise<Either.Either<any, any>> {
  return Promise.resolve(effect.constant);
}

export type NONE = 'NONE';
export const NONE: NONE = 'NONE';

export interface IMessageNone extends ActorSystem.IMessage {
  type: NONE
}

export class BatchEffect<T> extends GenericEffect {
  constructor(public readonly list: T[]) {super()}
}

export function Batch<T>(list: S.System<any, T>[]) {
  return S.of<any, T>(new BatchEffect(list));
}

export function execBatch(effect: BatchEffect<any>): S.System<any, any>[] {
  return effect.list;
}