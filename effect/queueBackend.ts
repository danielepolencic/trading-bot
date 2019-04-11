import * as Q from './queue';
import * as Either from '../monad/either';
import * as Effect from './defaultEffects';
import {IMessage} from './message';
import * as Maybe from '../monad/maybe';

export interface IDatabase {
  [name: string]: any[]
}

export interface ISubscriptions {
  [id: string]: {
    createdAt: number
    value: any
  }
}

export function Manager(cache: IDatabase, subscriptions: ISubscriptions, maxSubscriptionsLength = 100) {
  function get<T>(topic: string, id: string): T | void {
    const token = `${id}-${topic}`;
    if (!(topic in cache)) {
      return;
    }
    if (!(token in subscriptions)) {
      subscriptions[token] = {
        createdAt: +Date.now(),
        value: cache[topic].splice(-1)[0]
      };
    }
    if (Object.keys(subscriptions).length >= maxSubscriptionsLength) {
      const oldestKey = Object.keys(subscriptions).sort((a, b) => {
        return subscriptions[a].createdAt - subscriptions[b].createdAt;
      })[0];
      delete subscriptions[oldestKey];
    }
    return subscriptions[token].value;
  }

  function Subscribe<T>(requestId: string, effect: Q.SubscribeEffect<T>): Promise<Either.Either<void, T>> {
    const message: T | void = get<T>(Q.prj(effect.topic), requestId);
    return Promise.resolve(!!message ? Either.Right<void, T>(message) : Either.Left<void, T>(undefined));
  }

  function Publish<M>(effect: Q.PublishEffect<M>): Promise<Either.Either<Error, Effect.IMessageNone>> {
    return new Promise<Either.Either<Error, Effect.IMessageNone>>(resolve => {
      if (!cache[`${effect.topic}`]) {
        cache[`${effect.topic}`] = [];
      }
      cache[`${effect.topic}`].push(effect.message);
      resolve(Either.Right<Error, Effect.IMessageNone>({type: Effect.NONE}));
    });
  }

  function Subscribe2<M extends IMessage>(requestId: string, subscription: Q.Subscription.Subscribe<M>): Promise<Q.Message.ConsumeEvent<M>> {
    const message: M | void = get<M>(subscription.payload.topic, requestId);
    return !!message ? Promise.resolve(new Q.Message.ConsumeEvent({message})) : Promise.reject(undefined);
  }

  function Publish2<M extends IMessage>(message: Q.Message.PublishEffect<M>): Promise<Q.Message.AckEvent> {
    return new Promise<Q.Message.AckEvent>(resolve => {
      if (!cache[`${message.payload.message.type}`]) {
        cache[`${message.payload.message.type}`] = [];
      }
      cache[`${message.payload.message.type}`].push(message.payload.message);
      resolve(new Q.Message.AckEvent());
    });
  }


  return {Subscribe, Publish, Subscribe2, Publish2};
}