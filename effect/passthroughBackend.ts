import * as Passthrough from './passthrough';
import {IMessage} from './message';

export function execPassthrough<M extends IMessage>(message: Passthrough.Message.Event<M>) {
  return Promise.resolve(message.payload.message);
}