import * as Effect from './defaultEffects';
import * as Redis from '../redis/connection';
import * as Either from '../monad/either';
import * as Database from './database';
import {Empty} from './message';

export function Set(effect: Database.DatabaseSetEffect): Promise<Either.Either<Error, void>> {
  return Redis.connection.rpush(effect.key, JSON.stringify(effect.value))
    .then(() => Either.Right(undefined))
    .catch((err: any) => Either.Left(new Error('Couldnt set the value')));
}

export function execSet<T>(effect: Database.Message.Set<T>): Promise<Empty> {
  return Redis.connection.rpush(effect.payload.key, JSON.stringify(effect.payload.value))
    .catch((err: any) => console.log(`Could not set the value ${effect.payload.key}: `, err))
    .then(() => new Empty())
}

