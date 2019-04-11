import {IMessage, ISubscription} from './message';
import * as E from './engine';

export function UpdateAccountTime() {
  return E.of<Message.UpdateAccountTimeEvent>(new Subscription.UpdateAccountTime());
}

export namespace Message {
  export class Type {
    public static readonly UpdateAccountTime = 'updateAccountTime'
  }

  export class UpdateAccountTimeEvent implements IMessage {
    public readonly type = Type.UpdateAccountTime
    constructor(public readonly payload: {timestamp: string}) {}
  }
}

export namespace Subscription {
  export class Type {
    public static readonly UpdateAccountTime = 'updateAccountTime'
  }

  export class UpdateAccountTime implements ISubscription {
    public readonly type = Type.UpdateAccountTime
    constructor(public payload = {id: 'updateAccountTime'}) {}
  }
}

export type Subscriptions = Subscription.UpdateAccountTime;