import * as Currency from '../currency';
import * as ℚ from '../monad/rational';
import * as Maybe from '../monad/maybe';
import {compose} from '../utils';

export interface IProfile {
  webUrl: string
  apiUrl: string
  username: string
  password: string
  twoFactorSecret: string
  customerId: string
}

export interface IOrder {
  id: string
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  events: IOrderEvent[]
}

export enum OrderEventType {
  CREATED,
  MATCHED,
  CANCELLED,
  UPDATED,
  PART_MATCHED,
  UNKNOWN
}

export interface IOrderEvent {
  rate: ℚ.ℚ
  amountBuy: ℚ.ℚ
  amountSell: ℚ.ℚ
  type: OrderEventType
  createdAt: string
}

export enum MarketplaceStatus {
  SUSPENDED,
  OPEN
}

export interface IMarketplace {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  rate: ℚ.ℚ
  status: MarketplaceStatus
}

export interface IOrderRequest {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  amount: ℚ.ℚ
  rate: ℚ.ℚ
}

export interface IInstrument {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
}

export interface IBalance {
  currency: Currency.ANY
  available: ℚ.ℚ
}

export function filterUniqueOrders(orders: IOrder[]): IOrder[] {
  return orders.reduce((acc, order) => {
    const previous = acc.find(it => it.id === order.id);
    if (!!previous) {
      const index = acc.findIndex(it => it.id === order.id)
      const lastEvent = order.events[order.events.length - 1];
      const previousLastEvent = previous.events[order.events.length - 1];
      new Date(lastEvent.createdAt).valueOf() > new Date(previousLastEvent.createdAt).valueOf() ?
      acc[index] = order : undefined;
    } else {
      acc.push(order);
    }
    return acc;
  }, [] as IOrder[]);
}

export function sortOrders(orders: IOrder[]): IOrder[] {
  return orders.slice(0).sort((a, b) => {
    const lastEventA = a.events[a.events.length - 1];
    const lastEventB = b.events[b.events.length - 1];
    return new Date(lastEventB.createdAt).valueOf() - new Date(lastEventA.createdAt).valueOf()
  });
}

export function isPending(order: IOrder): Maybe.Maybe<IOrder> {
  const maybeOrder = Maybe.fmap((event: IOrderEvent) => {
    return event.type === OrderEventType.CREATED ||
      event.type === OrderEventType.PART_MATCHED ||
      event.type === OrderEventType.UPDATED ||
      event.type === OrderEventType.UNKNOWN ?
      Maybe.of(order) : Maybe.Nothing;
  });
  return compose(maybeOrder, Maybe.of)(order.events[order.events.length - 1]);
}

export function isTerminated(order: IOrder): Maybe.Maybe<IOrder> {
  const maybeOrder = Maybe.fmap((event: IOrderEvent) => {
    return event.type === OrderEventType.MATCHED ||
      event.type === OrderEventType.CANCELLED ?
      Maybe.of(order) : Maybe.Nothing;
  });
  return compose(maybeOrder, Maybe.of)(order.events[order.events.length - 1]);
}
