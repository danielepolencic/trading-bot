import * as S from './system';
import * as Actor from './actor';
import * as Redis from 'ioredis';
import * as Either from '../monad/either';
import * as Effect from './defaultEffects';

export function init(effect: Actor.InitEffect<any>): Promise<Either.Either<Error, any>> {
  return Promise.resolve(Either.Right<Error, any>({...effect.props, id: generateUuid()}));
}

export function app(effect: Actor.AppEffect<any>): Promise<Either.Either<Error, any>> {
  return Promise.resolve(Either.Right<Error, any>({...effect.props, id: 'app'}));
}

export function execActor<Model>(effect: Actor.Message.ActorEffect<Model>): Promise<Actor.Message.StateEvent<Model>> {
  return Promise.resolve(new Actor.Message.StateEvent({state: {...effect.payload.model as any, id: generateUuid()}}));
}

export function execApp<Model>(effect: Actor.Message.AppEffect<Model>): Promise<Actor.Message.StateEvent<Model>> {
  return Promise.resolve(new Actor.Message.StateEvent({state: {...effect.payload.model as any, id: 'app'}}));
}

function generateUuid() {
  return Math.random().toString(36).substring(7);
}