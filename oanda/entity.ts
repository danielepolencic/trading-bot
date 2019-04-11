import * as Currency from '../currency';
import * as ℚ from '../monad/rational';

export interface IProfile {
  url: string
  token: string
  accountId: string
}

export interface IPrice {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  price: ℚ.ℚ
}

export interface IOrder {
  id: string
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  price: ℚ.ℚ
  pl: ℚ.ℚ
  units: ℚ.ℚ
}

export interface IOrderRequest {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
  amount: ℚ.ℚ
}

export interface ICloseRequest {
  order: IOrder
  units: ℚ.ℚ
}

export interface IInstrument {
  currencySell: Currency.ANY
  currencyBuy: Currency.ANY
}