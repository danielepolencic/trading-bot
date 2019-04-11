import * as Actor from './actor';
import * as Effect from './defaultEffects';
import * as S from './system';
import {IMessage, ISubscription, Empty} from './message';
import * as E from './engine';

export class SubscribeEffect<M> extends Effect.GenericEffect {
  constructor(public readonly topic: Topic<M>) {super()}
}

export function Subscribe<M>(topic: Topic<M>) {
  return S.of<Error, M>(new SubscribeEffect(topic));
}

export class PublishEffect<M> extends Effect.GenericEffect {
  constructor(public readonly topic: Topic<M>, public readonly message: M) {super()}
}

export function Publish<M>(topic: Topic<M>, message: M) {
  return S.of<Error, Effect.IMessageNone>(new PublishEffect(topic, message));
}

export class Topic<M> {
  private topic: 'TOPIC';
}
type TopicV = string;

export function of<M>(value: TopicV): Topic<M> {
  return (value as any) as Topic<M>;
}

export function prj<M>(value: Topic<M>): TopicV {
  return (value as any) as TopicV;
}

export function Publish2<M extends IMessage>({message}: {message: M}) {
  return E.of<Message.AckEvent>(new Message.PublishEffect({message}));
}

export function Subscribe2<M extends IMessage>({topic}: {topic: string}) {
  return E.of<Message.ConsumeEvent<M>>(new Subscription.Subscribe({topic}));
}

export namespace Message {
  export class Type {
    public static readonly Publish = 'Publish'
    public static readonly Consume = 'Consume'
    public static readonly Ack = 'Ack'
  }

  export class PublishEffect<M extends IMessage> implements IMessage {
    public readonly type = Type.Publish
    constructor(public readonly payload: {message: M}) {}
  }

  export class ConsumeEvent<M extends IMessage> implements IMessage {
    public readonly type = Type.Consume
    constructor(public readonly payload: {message: M}) {}
  }

  export class AckEvent implements IMessage {
    public readonly type = Type.Ack
    constructor() {}
  }
}

export namespace Subscription {
  export class Type {
    public static readonly Subscribe = 'Subscribe'
  }

  export class Subscribe<M extends IMessage> implements ISubscription {
    public readonly type = Type.Subscribe
    public payload: {id: string, topic: string}
    constructor({topic}: {topic: string}) {
      this.payload = {id: topic, topic};
    }
  }
}

export type Effects = Message.PublishEffect<any>;
export type Subscriptions = Subscription.Subscribe<any>;