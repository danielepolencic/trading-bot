import * as Scheduler from './scheduler';
import * as Effect from './defaultEffects';
import * as Either from '../monad/either';
import {Empty} from './message';
import * as Maybe from '../monad/maybe';

interface ITime {
  lastRun: number
  interval: number
  queue: boolean[]
}

export interface IDatabase {
  [id: string]: ITime
};

export interface ISubscriptions {
  [id: string]: {
    createdAt: number
    value: boolean
  }
}

export function Manager(cache: IDatabase, subscriptions: ISubscriptions, setInterval: (fn: Function, ms: number) => void, maxSubscriptionsLength = 100) {
  function get(interval: number, requestId: string): boolean {
    if (!(interval in cache)) {
      cache[interval] = {lastRun: +Date.now(), interval, queue: []};
    }
    if (!(interval in subscriptions)) {
      subscriptions[requestId] = {
        value: !!cache[interval].queue.splice(-1)[0],
        createdAt: +Date.now()
      };
    }
    if (Object.keys(subscriptions).length >= maxSubscriptionsLength) {
      const oldestKey = Object.keys(subscriptions).sort((a, b) => {
        return subscriptions[a].createdAt - subscriptions[b].createdAt;
      })[0];
      delete subscriptions[oldestKey];
    }
    return subscriptions[requestId].value;
  }

  setInterval(() => {
    const now = +Date.now();
    Object.keys(cache).forEach(id => {
      const time = cache[id];
      if (now > time.lastRun + time.interval) {
        time.queue.push(true);
        time.lastRun = now;
      }
    });
  }, 1000);

  function Every(id: string, effect: Scheduler.EveryEffect): Promise<Either.Either<void, void>> {
    return Promise.resolve(!!get(effect.ms, id) ? Either.Right<void, void>(undefined) : Either.Left<void, void>(undefined));
  }

  function Every2(id: string, subscription: Scheduler.Subscription.Every): Promise<Scheduler.Message.DelayEvent> {
    return !!get(subscription.payload.ms, id) ? Promise.resolve(new Scheduler.Message.DelayEvent()) : Promise.reject(Maybe.Nothing);
  }

  return {Every, Every2};
}

export function Delay(effect: Scheduler.DelayEffect): Promise<Either.Either<Error, void>> {
  return new Promise<Either.Either<Error, void>>(resolve => {
    setTimeout(() => resolve(Either.Right<Error, void>(undefined)), effect.ms);
  });
}

export function execDelay(effect: Scheduler.Message.DelayEffect): Promise<Scheduler.Message.DelayEvent> {
  return new Promise(resolve => {
    setTimeout(() => resolve(new Scheduler.Message.DelayEvent()), effect.payload.ms);
  });
}
