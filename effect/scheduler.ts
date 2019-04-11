import * as Actor from './actor';
import * as Effect from './defaultEffects';
import * as S from './system';
import {IMessage, ISubscription} from './message';
import * as E from './engine';

export class EveryEffect extends Effect.GenericEffect {
  constructor(public readonly ms: number) {super()}
}

export function Every(ms: number) {
  return S.of<Error, void>(new EveryEffect(ms));
}

export class DelayEffect extends Effect.GenericEffect {
  constructor(public readonly ms: number) {super()}
}

export function Delay(ms: number) {
  return S.of<Error, void>(new DelayEffect(ms));
}

export function Delay2({ms}: {ms: number}) {
  return E.of<Message.DelayEvent>(new Message.DelayEffect({ms}));
}

export function Every2({ms}: {ms: number}) {
  return E.of<Message.DelayEvent>(new Subscription.Every({ms}));
}

export namespace Message {
  export class Type {
    public static readonly DelayEffect = 'DelayEffect'
    public static readonly DelayEvent = 'DelayEvent'
  }

  export class DelayEffect implements IMessage {
    public readonly type = Type.DelayEffect
    constructor(public readonly payload: {ms: number}) {}
  }

  export class DelayEvent implements IMessage {
    public readonly type = Type.DelayEvent
    constructor() {}
  }
}

export namespace Subscription {
  export class Type {
    public static readonly Every = 'Every'
  }

  export class Every implements ISubscription {
    public readonly type = Type.Every
    public payload: {id: string, ms: number}
    constructor({ms}: {ms: number}) {
      this.payload = {id: `${ms}`, ms};
    }
  }
}

export type Effects = Message.DelayEffect;
export type Subscriptions = Subscription.Every;