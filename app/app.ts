import * as S from '../effect/system';
import * as ActorSystem from '../effect/actor';
import * as Effect from '../effect/defaultEffects';

import * as MarketsCurrencyFair from '../reactorCurrencyFairMarkets/markets';
import * as QuotesOanda from '../reactorOandaQuotes/quotes';
import * as Storage from '../storage/storage';
import * as Accounts from '../reactorCurrencyFairOrders/accounts';
import * as OrderManager from '../orderTracker/orderManager';
import * as OrderScheduler from '../orderScheduler/scheduler';

import * as IB from '../effect/ib';
import * as Glue from '../effect/superglue';
import * as E from '../effect/engine';

export interface IProps {
  marketsCurrencyFairState: ActorSystem.State<MarketsCurrencyFair.IModel>
  quotesOandaState: ActorSystem.State<QuotesOanda.IModel>
  storageState: ActorSystem.State<Storage.IModel>
  accountsState: ActorSystem.State<Accounts.IModel>
  orderManagerState: ActorSystem.State<OrderManager.IModel>
  orderSchedulerState: ActorSystem.State<OrderScheduler.IModel>
}

export function Init() {
  const state = S.lift6((marketsCurrencyFairState, quotesOandaState, storageState, accountsState, orderManagerState, orderSchedulerState) => ({
    marketsCurrencyFairState,
    quotesOandaState,
    storageState,
    accountsState,
    orderManagerState,
    orderSchedulerState
  }),
    ActorSystem.Init(MarketsCurrencyFair.Init()),
    ActorSystem.Init(QuotesOanda.Init()),
    ActorSystem.Init(Storage.Init()),
    ActorSystem.Init(Accounts.Init()),
    ActorSystem.Init(OrderManager.Init()),
    ActorSystem.Init(OrderScheduler.Init())
  );
  return S.fmap(state => ActorSystem.App(state))(state);
}

export function Update(state: ActorSystem.State<IProps>, message: Message): [ActorSystem.State<IProps>, S.System<any, Message>] {
  switch(message.type) {

    case MessageType.MarketplacesCurrencyFairMessage:
      const [marketsCurrencyFairState, quotesCurrencyFairEffect] = MarketsCurrencyFair.Update(state.marketsCurrencyFairState, message.payload.message);
      return [
        {...state, marketsCurrencyFairState: {...state.marketsCurrencyFairState, ...marketsCurrencyFairState}},
        S.map((message: MarketsCurrencyFair.Messages) => new MarketplacesCurrencyFairMessage({message}))(Glue.Superglue(quotesCurrencyFairEffect))
      ];

    case MessageType.QuotesOandaMessage:
      const [quotesOandaState, quotesOandaEffect] = QuotesOanda.Update(state.quotesOandaState, message.payload.message);
      return [
        {...state, quotesOandaState: {...state.quotesOandaState, ...quotesOandaState}},
        S.map((message: QuotesOanda.Messages) => new QuotesOandaMessage({message}))(Glue.Superglue(quotesOandaEffect))
      ];

    case MessageType.StorageMessage:
      const [storageState, storageEffect] = Storage.Update(state.storageState, message.payload.message);
      return [
        {...state, storageState: {...state.storageState, ...storageState}},
        S.map((message: Storage.Messages) => new StorageMessage({message}))(Glue.Superglue(storageEffect))
      ];

    case MessageType.AccountsMessage:
      const [accountsState, accountsEffect] = Accounts.Update(state.accountsState, message.payload.message);
      return [
        {...state, accountsState: {...state.accountsState, ...accountsState}},
        S.map((message: Accounts.Messages) => new AccountsMessage({message}))(Glue.Superglue(accountsEffect))
      ];

    case MessageType.OrderManagerMessage:
      const [orderManagerState, orderManagerEffect] = OrderManager.Update(state.orderManagerState, message.payload.message);
      return [
        {...state, orderManagerState: {...state.orderManagerState, ...orderManagerState}},
        S.map((message: OrderManager.Messages) => new OrderManagerMessage({message}))(Glue.Superglue(orderManagerEffect))
      ];

    case MessageType.OrderSchedulerMessage:
      const [orderSchedulerState, orderSchedulerEffect] = OrderScheduler.Update(state.orderSchedulerState, message.payload.message);
      return [
        {...state, orderSchedulerState: {...state.orderSchedulerState, ...orderSchedulerState}},
        S.map((message: OrderScheduler.Messages) => new OrderSchedulerMessage({message}))(Glue.Superglue(orderSchedulerEffect))
      ];
    case IB.Message.Type.UpdateAccountTime:
      console.log('IB timestamp: ', message.payload.timestamp);
      return [
        state,
        Effect.None()
      ];

    default:
      return [state, Effect.None()];
  }
}

export function Subscriptions(state: ActorSystem.State<IProps>): S.System<any, Message> {
  return Effect.Batch<Message>([
    S.map((message: MarketsCurrencyFair.Messages) => new MarketplacesCurrencyFairMessage({message}))(Glue.Superglue(MarketsCurrencyFair.Subscriptions(state.marketsCurrencyFairState))),
    S.map((message: QuotesOanda.Messages) => new QuotesOandaMessage({message}))(Glue.Superglue(QuotesOanda.Subscriptions(state.quotesOandaState))),
    S.map((message: Storage.Messages) => new StorageMessage({message}))(Glue.Superglue(Storage.Subscriptions(state.storageState))),
    S.map((message: Accounts.Messages) => new AccountsMessage({message}))(Glue.Superglue(Accounts.Subscriptions(state.accountsState))),
    S.map((message: OrderManager.Messages) => new OrderManagerMessage({message}))(Glue.Superglue(OrderManager.Subscriptions(state.orderManagerState))),
    S.map((message: OrderScheduler.Messages) => new OrderSchedulerMessage({message}))(Glue.Superglue(OrderScheduler.Subscriptions(state.orderSchedulerState))),
    Glue.Superglue(IB.UpdateAccountTime())
  ]);
}

export class MessageType {
  static readonly StorageMessage = 'App.StorageMessage'
  static readonly MarketplacesCurrencyFairMessage = 'App.MarketplacesCurrencyFairMessage'
  static readonly QuotesOandaMessage = 'App.QuotesOandaMessage'
  static readonly AccountsMessage = 'App.AccountsMessage'
  static readonly OrderManagerMessage = 'App.OrderManagerMessage'
  static readonly OrderSchedulerMessage = 'App.OrderSchedulerMessage'
}

class StorageMessage implements ActorSystem.IMessage {
  readonly type = MessageType.StorageMessage
  constructor(public payload: {message: Storage.Messages}) {}
}

class MarketplacesCurrencyFairMessage implements ActorSystem.IMessage {
  readonly type = MessageType.MarketplacesCurrencyFairMessage
  constructor(public payload: {message: MarketsCurrencyFair.Messages}) {}
}

class QuotesOandaMessage implements ActorSystem.IMessage {
  readonly type = MessageType.QuotesOandaMessage
  constructor(public payload: {message: QuotesOanda.Messages}) {}
}

class AccountsMessage implements ActorSystem.IMessage {
  readonly type = MessageType.AccountsMessage
  constructor(public payload: {message: Accounts.Messages}) {}
}

class OrderManagerMessage implements ActorSystem.IMessage {
  readonly type = MessageType.OrderManagerMessage
  constructor(public payload: {message: OrderManager.Messages}) {}
}

class OrderSchedulerMessage implements ActorSystem.IMessage {
  readonly type = MessageType.OrderSchedulerMessage
  constructor(public payload: {message: OrderScheduler.Messages}) {}
}

export type Message = StorageMessage
  | MarketplacesCurrencyFairMessage
  | QuotesOandaMessage
  | Storage.Messages
  | MarketsCurrencyFair.Messages
  | AccountsMessage
  | OrderManagerMessage
  | OrderSchedulerMessage
  | Effect.IMessageNone
  | IB.Message.UpdateAccountTimeEvent;

export const Message = {
  StorageMessage,
  MarketplacesCurrencyFairMessage,
  QuotesOandaMessage,
  AccountsMessage,
  OrderManagerMessage,
  OrderSchedulerMessage
};