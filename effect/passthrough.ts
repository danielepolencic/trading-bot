import {IMessage} from './message';
import * as E from './engine';

export function Passthrough<M extends IMessage>({message}: {message: M}) {
  return E.of<M>(new Message.Event({message}));
}

export namespace Message {
  export class Type {
    public static readonly Event = 'Passthrough.Event'
  }

  export class Event<M extends IMessage> implements IMessage {
    public readonly type = Type.Event
    constructor(public readonly payload: {message: M}) {}
  }
}

export type Effects = Message.Event<any>;