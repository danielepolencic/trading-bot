import * as E from './engine';

export interface IMessage {
  readonly type: string
  readonly payload?: any
}

export interface ISubscription extends IMessage {
  readonly type: string
  readonly payload: {
    id: string
    [others: string]: any;
  }
}

export function Noop() {
  return E.of<Empty>(new Empty());
}

export type Messages = Empty;

export class Type {
  public static readonly Empty = 'Empty'
}

export class Empty implements IMessage {
  public readonly type = Type.Empty
  constructor() {}
}