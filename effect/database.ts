import * as Effect from './defaultEffects';
import * as S from './system';
import * as Either from '../monad/either';
import {IMessage, Empty} from './message';
import * as E from './engine';

export class DatabaseSetEffect extends Effect.GenericEffect {
  constructor(public readonly key: string, public readonly value: any) {super()}
}

export function Set<T>(key: string, value: T) {
  return S.of<Error, void>(new DatabaseSetEffect(key, value));
}

export function Set2<T>({key, value}: {key: string, value: T}) {
  return E.of<Empty>(new Message.Set({key, value}));
}

export namespace Message {
  export class Type {
    public static readonly Set = 'Set'
  }

  export class Set<T> implements IMessage {
    public readonly type = Type.Set
    constructor(public readonly payload: {key: string, value: T}) {}
  }
}

export type Effects = Message.Set<any>;