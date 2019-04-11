import * as Entity from './entity';
import {IMessage} from '../effect/message';
import * as E from '../effect/engine';

export function getToken(profile: Entity.IProfile) {
  return E.of<Message.ResponseEvent | Message.InvalidEvent>(new Message.RequestEffect({profile}));
}

export namespace Message {
  export class Type {
    public static readonly TokenResponse = 'Token.Response'
    public static readonly TokenRequest = 'Token.Request'
    public static readonly TokenInvalid = 'Token.Invalid'
  }

  export class RequestEffect implements IMessage {
    readonly type = Type.TokenRequest
    constructor(public payload: {profile: Entity.IProfile}) {}
  }

  export class InvalidEvent implements IMessage {
    readonly type = Type.TokenInvalid
    constructor(public payload: {message: string}) {}
  }

  export class ResponseEvent implements IMessage {
    readonly type = Type.TokenResponse
    constructor(public payload: {token: string}) {}
  }
}

export type Effects = Message.RequestEffect;