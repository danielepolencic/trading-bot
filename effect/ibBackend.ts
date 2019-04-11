import * as IB from './ib';
import {Empty} from './message';
import * as InteractiveBrokers from 'ib';

export interface IDatabase {
  [name: string]: any[]
}

export interface ISubscriptions {
  [id: string]: {
    createdAt: number
    value: any
  }
}

export function Manager(cache: IDatabase, subscriptions: ISubscriptions, interactiveBrokers: InteractiveBrokers, maxSubscriptionsLength = 100) {
  interactiveBrokers.reqAccountUpdates(true, 'DF602139');

  function get<T>(topic: string, id: string): T | void {
    const token = `${id}-${topic}`;
    if (!(topic in cache)) {
      cache[topic] = [];
      interactiveBrokers.on(topic, (timestamp: string) => cache[topic].push(timestamp));
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

  function Subscribe<T>(requestId: string, subscription: IB.Subscription.UpdateAccountTime): Promise<IB.Message.UpdateAccountTimeEvent | Empty> {
    const message: string | void = get<string>(subscription.payload.id, requestId);
    return Promise.resolve(!!message ? new IB.Message.UpdateAccountTimeEvent({timestamp: message}) : new Empty());
  }

  return {Subscribe};
}