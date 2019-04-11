import * as CurrencyFair from '../currencyFair';
import * as Maybe from '../monad/maybe';
import * as Request from 'request';
import {IncomingMessage} from 'http';
import * as Either from '../monad/either';
import * as Effect from './defaultEffects';
import * as H from './http';

export function Http(effect: H.HttpEffect): Promise<Either.Either<Error, any>> {
  return new Promise<Either.Either<Error, any>>(resolve => {
    Request(effect.args, (err: Maybe.Maybe<Error>, incomingMessage: IncomingMessage | void | null, response: Maybe.Maybe<any>) => {
      effect.callback<Either.Either<Error, any>>(err, {statusCode: (incomingMessage || {statusCode: 500}).statusCode, headers: (incomingMessage || {headers: {}}).headers}, response)
        .then(result => resolve(result))
        .catch(err => resolve(Either.Left(err)));
    });
  });
}

export function HttpCurrencyFair(effect: H.HttpCurrencyFairEffect): Promise<Either.Either<Error, any>> {
  return new Promise<Either.Either<Error, any>>(resolve => {
    CurrencyFair.getApiToken(effect.profile).then(Either.cata<Error, string, any, any>(
      error => resolve(Either.Left(error)),
      apiToken => {
        const args = Object.assign({}, effect.args, {
          headers: {Authorization: `Bearer ${apiToken}`}
        });
        Request(args, (err: Maybe.Maybe<Error>, incomingMessage: IncomingMessage | void | null, response: Maybe.Maybe<any>) => {
          effect.callback<Either.Either<Error, any>>(err, {statusCode: (incomingMessage || {statusCode: 500}).statusCode, headers: (incomingMessage || {headers: {}}).headers}, response)
            .then(result => resolve(result))
            .catch(err => resolve(Either.Left(err)));
        });
      }
    ));
  });
}

export function execHttp<T>(message: H.Message.RequestEffect): Promise<H.Message.ResponseEvent<T>> {
  return new Promise(resolve => {
    Request(
      message.payload.args,
      (error: Maybe.Maybe<Error>, incomingMessage: IncomingMessage | void | null, response: Maybe.Maybe<any>) => {
        resolve(new H.Message.ResponseEvent({error, incomingMessage: {statusCode: (incomingMessage || {statusCode: 500}).statusCode, headers: (incomingMessage || {headers: {}}).headers}, response}));
      }
    );
  })
}