import * as Account from './account';
import * as CurrencyFair from '../currencyFair';
import * as E from '../effect/engine';
import {IMessage, Empty, Noop} from '../effect/message';

export interface IModel {
  accounts: {[accountName: string]: Account.IModel}
}

export namespace Message {
  export class Type {
    static readonly Add = 'CurrencyFair.Accounts.Add'
    static readonly Update = 'CurrencyFair.Accounts.Update'
  }

  export class AddAccount implements IMessage {
    readonly type = Type.Add
    constructor(public readonly payload: {profile: CurrencyFair.IProfile}) {}
  }

  export class Update implements IMessage {
    readonly type = Type.Update
    constructor(public readonly payload: {id: string, message: Account.Messages}) {}
  }
}

export type Messages =
  | Message.AddAccount
  | Message.Update
  | Account.Messages
  | Empty;

export function Init(): IModel {
  return {accounts: {}};
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Message.Type.Add:
      return [
        {...state, accounts: {...state.accounts, [message.payload.profile.username]: Account.Init(message.payload.profile)}},
        Noop()
      ];

    case Message.Type.Update:
      const accountId = message.payload.id;
      const [accountState, effectState] = Account.Update(state.accounts[accountId], message.payload.message);
      return [
        {...state, accounts: {...state.accounts, [accountId]: accountState}},
        E.map<Account.Messages, Message.Update>(message => new Message.Update({id: accountId, message}))(effectState)
      ];

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.batch(Object.keys(state.accounts).map(accountId => {
    return E.map<Account.Messages, Message.Update>(message => new Message.Update({id: accountId, message}))(Account.Subscriptions(state.accounts[accountId]));
  }));
}