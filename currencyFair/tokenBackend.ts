import * as Token from './token';
import * as Portal from './portal';
import * as Either from '../monad/either';

export function execCurrencyFairToken(effect: Token.Message.RequestEffect): Promise<Token.Message.InvalidEvent | Token.Message.ResponseEvent> {
  return Portal.getApiToken(effect.payload.profile).then(errorOrToken => {
    return Either.cata(
      (error: Error) => new Token.Message.InvalidEvent({message: error.message}),
      (value: string) => new Token.Message.ResponseEvent({token: value}))
      (errorOrToken);
  });
}