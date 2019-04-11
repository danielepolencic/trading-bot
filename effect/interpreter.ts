import * as Effects from './defaultEffects';
import * as Either from '../monad/either';
import * as S from './system';

import * as SchedulerBackend from './schedulerBackend';
import * as HttpBackend from './httpBackend';
import * as DatabaseBackend from './databaseBackend';
import * as ActorBackend from './actorBackend';
import * as QBackend from './queueBackend';
import * as IBBackend from './ibBackend';

import * as Scheduler from './scheduler';
import * as Http from './http';
import * as Database from './database';
import * as Actor from './actor';
import * as Q from './queue';
import * as CurrencyFair from '../currencyFair';
import * as IB from './ib';

import * as Portal from '../currencyFair/token';
import * as Superglue from './superglue';
import * as E from './engine';
import {Empty, Type} from './message';

import * as Passthrough from './passthrough';
import * as PassthroughBackend from './passthroughBackend';

import * as InteractiveBrokers from 'ib';

type Effect =
  | Effects.BatchEffect<any>
  | Effects.ConstantEffect
  | Effects.NoneEffect
  | Actor.AppEffect<any>
  | Actor.InitEffect<any>
  | Http.HttpEffect
  | Http.HttpCurrencyFairEffect
  | Scheduler.DelayEffect
  | Scheduler.EveryEffect
  | Database.DatabaseSetEffect
  | Q.PublishEffect<any>
  | Q.SubscribeEffect<any>
  | Superglue.SuperglueEffect<any>;

const qBackend = QBackend.Manager({}, {});
const schedulerBackend = SchedulerBackend.Manager({}, {}, setInterval);
const ibBackend = IBBackend.Manager({}, {}, new InteractiveBrokers({port: 4001}).connect());

export function interpreter(context: any) {
  return (effect: Effect, next: <E, A>(value: Either.Either<E, A>) => void) => {

    if (effect instanceof Effects.NoneEffect) {
      return Effects.execNone(effect).then(next);
    }

    if (effect instanceof Effects.ConstantEffect) {
      return Effects.execConstant(effect).then(next);
    }

    if (effect instanceof Effects.BatchEffect) {
      const effects: any = Effects.execBatch(effect).map(effect => {
        return S.run(
          interpreter(context),
          S.bimap(
            error => next(Either.Left(error)),
            message => next(Either.Right(message)))
            (effect)
        )
      });
      return Promise.all(effects);
    }

    if (effect instanceof Actor.InitEffect) {
      return ActorBackend.init(effect).then(next);
    }

    if (effect instanceof Actor.AppEffect) {
      return ActorBackend.app(effect).then(next);
    }

    if (effect instanceof Http.HttpEffect) {
      return HttpBackend.Http(effect).then(next);
    }

    if (effect instanceof Http.HttpCurrencyFairEffect) {
      return HttpBackend.HttpCurrencyFair(effect).then(next);
    }

    if (effect instanceof Database.DatabaseSetEffect) {
      return DatabaseBackend.Set(effect).then(next);
    }

    if (effect instanceof Q.PublishEffect) {
      return qBackend.Publish(effect).then(next);
    }

    if (effect instanceof Scheduler.DelayEffect) {
      return SchedulerBackend.Delay(effect).then(next);
    }

    if (effect instanceof Scheduler.EveryEffect) {
      return schedulerBackend.Every(context.id, effect).then(next);
    }

    if (effect instanceof Q.SubscribeEffect) {
      return qBackend.Subscribe(context.id, effect).then(next);
    }

    if (effect instanceof Superglue.SuperglueEffect) {
      const promiseRun = E.run(engineInterpreter(context))((effect as Superglue.SuperglueEffect<any>).effect);
      E.walk(message => next(Either.Right(message)))(promiseRun);
      return;
    }

    throw new Error(`Unknown effect ${(effect as any).constructor.name}`);
  }
}

function engineInterpreter(context: any) {
  return (message: Empty | CurrencyFair.Effects | Http.Effects | Q.Effects | Q.Subscriptions | Scheduler.Effects | Scheduler.Subscriptions | Database.Effects | Actor.Effects | IB.Subscriptions | Passthrough.Effects): Promise<any> => {
    switch(message.type) {
      case Type.Empty:
        return Promise.resolve(message);
      case CurrencyFair.MessageToken.Type.TokenRequest:
        return CurrencyFair.execCurrencyFairToken(message);
      case Http.Message.Type.Request:
        return HttpBackend.execHttp(message);
      case Q.Message.Type.Publish:
        return qBackend.Publish2(message);
      case Q.Subscription.Type.Subscribe:
        return qBackend.Subscribe2(context.id, message);
      case Scheduler.Message.Type.DelayEffect:
        return SchedulerBackend.execDelay(message);
      case Scheduler.Subscription.Type.Every:
        return schedulerBackend.Every2(context.id, message);
      case Database.Message.Type.Set:
        return DatabaseBackend.execSet(message);
      case Actor.Message.Type.App:
        return ActorBackend.execApp(message);
      case Actor.Message.Type.Actor:
        return ActorBackend.execActor(message);
      case IB.Subscription.Type.UpdateAccountTime:
        return ibBackend.Subscribe(context.id, message);
      case Passthrough.Message.Type.Event:
        return PassthroughBackend.execPassthrough(message);
      default:
        throw new Error(`Unknown effect ${(message as any).constructor.name}`);
    }
  }
}
