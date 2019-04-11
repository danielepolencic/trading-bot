import * as Effect from './defaultEffects';
import * as S from './system';
import * as M from './message';
import * as E from './engine';

export class AppEffect<Props> extends Effect.GenericEffect {
  constructor(public readonly props: Props) {super()}
}

export function App<Props>(props: Props) {
  return S.of<Error, State<Props>>(new AppEffect(props));
}

export class InitEffect<Props> extends Effect.GenericEffect {
  constructor(public readonly props: Props) {super()}
}

export function Init<Props>(props: Props) {
  return S.of<Error, State<Props>>(new InitEffect(props));
}

export interface IMessage {
  type: string
}

export type State<Props> = {id: string} & Props;

export function createApp<Model>({model}: {model: Model}) {
  return E.of<Message.StateEvent<Model>>(new Message.AppEffect({model}));
}

export function createActor<Model>({model}: {model: Model}) {
  return E.of<Message.StateEvent<Model>>(new Message.ActorEffect({model}));
}

export namespace Message {
  export class Type {
    public static readonly App = 'App'
    public static readonly Actor = 'Actor'
    public static readonly State = 'State'
  }

  export class AppEffect<Model> implements M.IMessage {
    public readonly type = Type.App
    constructor(public readonly payload: {model: Model}) {}
  }

  export class ActorEffect<Model> implements M.IMessage {
    public readonly type = Type.Actor
    constructor(public readonly payload: {model: Model}) {}
  }

  export class StateEvent<Model> implements M.IMessage {
    public readonly type = Type.Actor
    constructor(public readonly payload: {state: State<Model>}) {}
  }
}

export type Effects = Message.ActorEffect<any> | Message.AppEffect<any>;