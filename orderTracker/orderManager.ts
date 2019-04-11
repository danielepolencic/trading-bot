import * as CurrencyFair from '../currencyFair';
import * as Q from '../effect/queue';
import * as PendingOrder from './pendingOrder';
import * as Account from '../reactorCurrencyFairOrders/account';
import * as ℚ from '../monad/rational';
import * as Maybe from '../monad/maybe';
import {compose} from '../utils';
import * as E from '../effect/engine';
import {IMessage, Empty, Noop} from '../effect/message';

export interface IModel {
  pendingOrders: {[orderId: string]: PendingOrder.IModel}
}

export type Messages =
  | Message.PendingOrderMessage
  | PendingOrder.Messages
  | Q.Message.ConsumeEvent<Account.Message.OrderTick>
  | Empty;

export namespace Message {
  export class Type {
    public static readonly PendingOrderMessage = 'PendingOrderMessage'
  }

  export class PendingOrderMessage implements IMessage {
    public readonly type = Type.PendingOrderMessage
    constructor(public readonly payload: {id: string, message: PendingOrder.Messages}) {}
  }
}

export function Init(): IModel {
  return {pendingOrders: {}};
}

export function Update(state: IModel, message: Messages): [IModel, E.Engine<Messages>] {
  switch(message.type) {
    case Q.Message.Type.Consume:

      switch(message.payload.message.type) {
        case Account.Message.Type.OrderTick:
          const orderId = message.payload.message.payload.order.id;
          const pendingOrder = Maybe.of(state.pendingOrders[orderId]);

          return compose(
            Maybe.orSome<[IModel, E.Engine<Messages>], [IModel, E.Engine<Messages>]>([
              {...state, pendingOrders: {...state.pendingOrders, [orderId]: PendingOrder.Init({
                order: message.payload.message.payload.order,
                profile: message.payload.message.payload.profile,
                minSpread: ℚ.parse(1.000),
                increment: ℚ.parse(0.0001)
              })}},
              Noop()
            ]),
            Maybe.map<CurrencyFair.IOrder, [IModel, E.Engine<Messages>]>(order => {
              const {[orderId]: omit, ...rest} = state.pendingOrders;
              return [{...state, pendingOrders: rest}, Noop()];
            }),
            Maybe.orElse<CurrencyFair.IOrder, CurrencyFair.IOrder>(CurrencyFair.isTerminated(message.payload.message.payload.order)),
            Maybe.fmap<PendingOrder.IModel, CurrencyFair.IOrder>(pendingOrder => CurrencyFair.isTerminated(message.payload.message.payload.order))
          )(pendingOrder);

        default:
          return [state, Noop()];
      }

    case Message.Type.PendingOrderMessage:
      return compose(
        Maybe.orSome<[IModel, E.Engine<Messages>], [IModel, E.Engine<Messages>]>([state, Noop()]),
        Maybe.map<PendingOrder.IModel, [IModel, E.Engine<Messages>]>(model => {
          const [pendingOrderState, pendingOrderEffect] = PendingOrder.Update(model, message.payload.message);
          const id = message.payload.id;
          return [
            {...state, pendingOrders: {...state.pendingOrders, [id]: pendingOrderState}},
            E.map<PendingOrder.Messages, Message.PendingOrderMessage>(message => new Message.PendingOrderMessage({id, message}))(pendingOrderEffect)
          ];
        })
      )(Maybe.of(state.pendingOrders[message.payload.id]));

    default:
      return [state, Noop()];
  }
}

export function Subscriptions(state: IModel): E.Engine<Messages> {
  return E.batch<Messages>(([] as E.Engine<Messages>[])
    .concat(Q.Subscribe2<Account.Message.OrderTick>({ topic: Account.Message.Type.OrderTick }))
    .concat(Object.keys(state.pendingOrders).map(id => {
      return E.map((message: PendingOrder.Messages) => new Message.PendingOrderMessage({message, id}))(PendingOrder.Subscriptions(state.pendingOrders[id]));
    }))
  );
}