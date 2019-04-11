import * as CurrencyFair from '../currencyFair';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';
import * as Effect from './defaultEffects';
import {IMessage} from './message';
import * as E from './engine';

export interface HttpArgs {
  uri: string,
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE',
  json?: boolean | {},
  headers?: any,
  qs?: any
}

export interface HttpIncomingMessage {
  headers: any
  method?: string
  url?: string
  statusCode?: number
  statusMessage?: string
}

export class HttpEffect extends Effect.GenericEffect {
  constructor(public readonly args: HttpArgs, public readonly callback: <T>(err: Maybe.Maybe<Error>, incomingMessage: HttpIncomingMessage, response: Maybe.Maybe<T>) => Promise<T>) {super()}
}

export class HttpCurrencyFairEffect extends Effect.GenericEffect {
  constructor(public readonly profile: CurrencyFair.IProfile, public readonly args: HttpArgs, public readonly callback: <T>(err: Maybe.Maybe<Error>, incomingMessage: HttpIncomingMessage, response: Maybe.Maybe<any>) => Promise<T>) {super()}
}

export function Request<T>(args: HttpArgs) {
  return E.of<Message.ResponseEvent<T>>(new Message.RequestEffect({args}));
}

export namespace Message {
  export class Type {
    public static readonly Response = 'Http.Response'
    public static readonly Request = 'Http.Request'
  }

  export class RequestEffect implements IMessage {
    readonly type = Type.Request
    constructor(public payload: {args: HttpArgs}) {}
  }

  export class ResponseEvent<T> implements IMessage {
    readonly type = Type.Response
    constructor(public payload: {error: Maybe.Maybe<Error>, incomingMessage: HttpIncomingMessage, response: Maybe.Maybe<T>}) {}
  }
}

export type Effects = Message.RequestEffect;