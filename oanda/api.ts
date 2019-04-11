import * as Entity from './entity';
import * as Browser from '../config/browser';
import * as ℚ from '../monad/rational';
import Instruments from '../config/oandaInstruments';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';
import * as Currency from '../currency';
import * as Identity from '../monad/identity';
import * as Joi from 'joi';
import * as S from '../effect/system';
import * as Http from '../effect/http';

import * as E from '../effect/engine';
import {IMessage} from '../effect/message';
import {compose} from '../utils';
import {stripIndent} from 'common-tags';
import * as Q from '../effect/queue';
import {Passthrough} from '../effect/passthrough';

export namespace Message {
  export class Type {
    public static readonly Error = 'Oanda.Api.Error'
    public static readonly Price = 'Oanda.Api.Price'
    public static readonly OrderChanged = 'Oanda.Api.OrderChanged'
    public static readonly Order = 'Oanda.Api.Order'
    public static readonly Orders = 'Oanda.Api.Orders'
    public static readonly Empty = 'Oanda.Api.Empty'
  }

  export class ApiError implements IMessage {
    public readonly type = Type.Error
    constructor(public readonly payload: {description: string}) {}
  }

  export class Price implements IMessage {
    public readonly type = Type.Price
    constructor(public readonly payload: {price: Entity.IPrice}) {}
  }

  export class OrderChanged implements IMessage {
    public readonly type = Type.OrderChanged
    constructor(public readonly payload: {order: Entity.IOrder}) {}
  }

  export class Order implements IMessage {
    public readonly type = Type.Order
    constructor(public readonly payload: {order: Entity.IOrder}) {}
  }

  export class Orders implements IMessage {
    public readonly type = Type.Orders
    constructor(public readonly payload: {orders: Entity.IOrder[]}) {}
  }

  export class Empty implements IMessage {
    public readonly type = Type.Empty
    constructor() {}
  }
}

export interface IInstrument {
  currencyBuy: Currency.ANY
  currencySell: Currency.ANY
  parse: (aFraction: ℚ.ℚ) => ℚ.ℚ
  instrument: string
  units: (aFraction: ℚ.ℚ) => ℚ.ℚ
}

function getInstrument(currencyBuy: Currency.ANY, currencySell: Currency.ANY) {
  const instrument = Instruments.find(it => it.currencyBuy === currencyBuy && it.currencySell === currencySell);

  if (instrument === undefined) {
    throw new Error('Invalid instrument');
  }

  return instrument;
}

function getInstrument2({currencyBuy, currencySell}: {currencyBuy: Currency.ANY, currencySell: Currency.ANY}): Maybe.Maybe<IInstrument> {
  return Maybe.of<IInstrument>(Instruments.find(it => it.currencyBuy === currencyBuy && it.currencySell === currencySell));
}

export function getPrice2(profile: Entity.IProfile, {currencySell, currencyBuy}: Entity.IInstrument): E.Engine<Message.ApiError | Message.Price> {
  const instrument = getInstrument2({currencyBuy, currencySell});
  const request = ({instrument}: IInstrument) => Http.Request<IOandaPrice>({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/pricing`,
    qs: {
      instruments: instrument
    },
    json: true,
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  });
  const reply = compose(
    Either.cata<Error, Entity.IPrice, Message.ApiError, Message.Price>(
      error => new Message.ApiError({description: error.message}),
      price => new Message.Price({price})
    ),
    parseResponse
  );
  const orInvalidInstrument = Maybe.orSome<E.Engine<Message.Price>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `BUY: ${currencyBuy} SELL: ${currencySell} is not a valid instrument`})}));
  return compose(
    orInvalidInstrument,
    Maybe.map<E.Engine<Http.Message.ResponseEvent<IOandaPrice>>, E.Engine<Message.ApiError | Message.Price>>(E.map<Http.Message.ResponseEvent<IOandaPrice>, Message.ApiError | Message.Price>(reply)),
    Maybe.map<IInstrument, E.Engine<Http.Message.ResponseEvent<IOandaPrice>>>(request)
  )(instrument);

  function parseResponse(message: Http.Message.ResponseEvent<IOandaPrice>): Either.Either<Error, Entity.IPrice> {
    const priceOrError = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<{prices: IOandaPrice[]}>(it))
      .orSome(Either.Left<Error, {prices: IOandaPrice[]}>(createError('Empty response')));

    return Either.Do.of(priceOrError)
      .map(it => it.prices[0])
      .fmap(parsePrice)
      .value;

    function parsePrice(price: IOandaPrice): Either.Either<Error, Entity.IPrice> {
      return compose(
        Maybe.orSome<Either.Either<Error, Entity.IPrice>, Either.Either<Error, Entity.IPrice>>(Either.Left<Error, Entity.IPrice>(createError('Invalid instrument'))),
        Maybe.map<Entity.IPrice, Either.Either<Error, Entity.IPrice>>(price => Either.Right<Error, Entity.IPrice>(price)),
        Maybe.map(parse)
      )(instrument);

      function parse(instrument: IInstrument): Entity.IPrice {
        return {
          currencySell,
          currencyBuy,
          price: Identity.Do.of(price.closeoutBid)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract()
        };
      }
    }

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        prices: Joi.array().items(
          Joi.object({
            closeoutBid: Joi.string().required()
          }).unknown().required()
        ).min(1).required()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the price for ${currencySell}/${currencyBuy} **

        GET ${profile.url}/v3/accounts/${profile.accountId}/pricing?instruments=${currencySell}_${currencyBuy}

        Error:
        ${reason}

        Status Code:
        ${message.payload.incomingMessage.statusCode}

        Response:
        ${JSON.stringify(message.payload.response, null, 2)}
      `);
    }
  }
}

export function getPrice(profile: Entity.IProfile, {currencySell, currencyBuy}: Entity.IInstrument) {
  const instrument = getInstrument(currencyBuy, currencySell);
  return S.Do.of<Error, Entity.IPrice>(new Http.HttpEffect({
      uri: `${profile.url}/v3/accounts/${profile.accountId}/pricing`,
      qs: {
        instruments: instrument.instrument
      },
      json: true,
      headers: {
        Authorization: `Bearer ${profile.token}`,
        'User-Agent': Browser.userAgent
      }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IPrice>>((resolve, reject) => {
      const priceOrError = Maybe.Do.of(response)
        .map(it => parseResponse<{prices: IOandaPrice[]}>(it))
        .orSome(Either.Left<Error, {prices: IOandaPrice[]}>(createError('Empty response')));

      return resolve(
        Either.Do.of(priceOrError)
        .map(it => it.prices[0])
        .map(parsePrice)
        .value
      );

      function parsePrice(price: IOandaPrice): Entity.IPrice {
        return {
          currencySell,
          currencyBuy,
          price: Identity.Do.of(price.closeoutBid)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract()
        };
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          prices: Joi.array().items(
            Joi.object({
              closeoutBid: Joi.string().required()
            }).unknown()
          ).min(1).required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the price for ${currencySell}/${currencyBuy} **

GET ${profile.url}/v3/accounts/${profile.accountId}/pricing?instruments=${currencySell}_${currencyBuy}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  })).value;
}

export function openPosition(profile: Entity.IProfile, {currencySell, currencyBuy, amount}: Entity.IOrderRequest) {
  const instrument = getInstrument(currencyBuy, currencySell);
  const units = `${ℚ.toFloat(instrument.units(amount))}`;
  return S.Do.of<Error, Entity.IOrder>(new Http.HttpEffect({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/orders`,
    method: 'POST',
    json: {
      order: {
        instrument: instrument.instrument,
        units,
        type: 'MARKET'
      }
    },
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => parseResponse<IOandaOrder>(it))
        .orSome(Either.Left<Error, IOandaOrder>(createError('Empty response')));

      return resolve(Either.map<Error, IOandaOrder, Entity.IOrder>(parseOrder)(errorOrOrder));

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          lastTransactionID: Joi.string().required(),
          orderFillTransaction: Joi.object({
            price: Joi.string().required(),
            pl: Joi.string().required(),
            units: Joi.string().required(),
          }).unknown().required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not submit the order BUY ${currencyBuy} SELL ${currencySell} ${units} units **

POST: ${profile.url}/v3/accounts/${profile.accountId}/orders
{
  "order": {
    "instrument": "${instrument.instrument}",
    "units": "${units}"
    "type": "MARKET"
  }
}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }

      function parseOrder(order: IOandaOrder): Entity.IOrder {
        return {
          id: order.lastTransactionID,
          currencySell,
          currencyBuy,
          price: Identity.Do.of(order.orderFillTransaction.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: Identity.Do.of(order.orderFillTransaction.pl)
            .map(parseFloat)
            .map(ℚ.parse)
            .extract(),
          units: Identity.Do.of(order.orderFillTransaction.units)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    });
  })).value;
}

export function openPosition2(profile: Entity.IProfile, {currencySell, currencyBuy, amount}: Entity.IOrderRequest): E.Engine<Message.ApiError | Message.Empty> {
  const instrument = getInstrument2({currencyBuy, currencySell});
  const request = (instrument: IInstrument) => Http.Request<IOandaOrder>({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/orders`,
    method: 'POST',
    json: {
      order: {
        instrument: instrument.instrument,
        units: `${compose(ℚ.toFloat, instrument.units)(amount)}`,
        type: 'MARKET'
      }
    },
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  });
  const reply = compose(
    Either.cata<Error, Entity.IOrder, E.Engine<Message.ApiError>, E.Engine<Message.Empty>>(
      error => Passthrough({message: new Message.ApiError({description: error.message})}),
      order => E.map(() => new Message.Empty())(Q.Publish2({message: new Message.OrderChanged({order})}))
    ),
    parseResponse
  );
  const orInvalidInstrument = Maybe.orSome<E.Engine<Message.Empty>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `BUY: ${currencyBuy} SELL: ${currencySell} is not a valid instrument`})}));
  return compose(
    orInvalidInstrument,
    Maybe.map<E.Engine<Http.Message.ResponseEvent<IOandaOrder>>, E.Engine<Message.ApiError | Message.Empty>>(E.fmap<Http.Message.ResponseEvent<IOandaOrder>, Message.ApiError | Message.Empty>(reply)),
    Maybe.map<IInstrument, E.Engine<Http.Message.ResponseEvent<IOandaOrder>>>(request)
  )(instrument);

  function parseResponse(message: Http.Message.ResponseEvent<IOandaOrder>): Either.Either<Error, Entity.IOrder> {
    const errorOrOrder = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<IOandaOrder>(it))
      .orSome(Either.Left<Error, IOandaOrder>(createError('Empty response')));

    return Either.fmap<Error, IOandaOrder, Entity.IOrder>(parseOrder)(errorOrOrder);

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        lastTransactionID: Joi.string().required(),
        orderFillTransaction: Joi.object({
          price: Joi.string().required(),
          pl: Joi.string().required(),
          units: Joi.string().required(),
        }).unknown().required()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return compose(
        Maybe.orSome<Error, Error>(new Error('Invalid Instrument')),
        Maybe.map<IInstrument, Error>(template)
      )(instrument);

      function template(instrument: IInstrument) {
        return new Error(stripIndent`
          ** Could not submit the order BUY ${currencyBuy} SELL ${currencySell} ${compose(ℚ.toFloat, instrument.units)(amount)} units **

          POST: ${profile.url}/v3/accounts/${profile.accountId}/orders
          {
            "order": {
              "instrument": "${instrument.instrument}",
              "units": "${compose(ℚ.toFloat, instrument.units)(amount)}"
              "type": "MARKET"
            }
          }

          Error:
          ${reason}

          Status Code:
          ${message.payload.incomingMessage.statusCode}

          Response:
          ${JSON.stringify(message.payload.response, null, 2)}
        `);
      }
    }

    function parseOrder(order: IOandaOrder): Either.Either<Error, Entity.IOrder> {
      return compose(
        Maybe.orSome<Either.Either<Error, Entity.IOrder>, Either.Either<Error, Entity.IOrder>>(Either.Left<Error, Entity.IOrder>(createError('Invalid instrument'))),
        Maybe.map<Entity.IOrder, Either.Either<Error, Entity.IOrder>>(order => Either.Right<Error, Entity.IOrder>(order)),
        Maybe.map(parse)
      )(instrument);

      function parse(instrument: IInstrument): Entity.IOrder {
        return {
          id: order.lastTransactionID,
          currencySell,
          currencyBuy,
          price: Identity.Do.of(order.orderFillTransaction.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: Identity.Do.of(order.orderFillTransaction.pl)
            .map(parseFloat)
            .map(ℚ.parse)
            .extract(),
          units: Identity.Do.of(order.orderFillTransaction.units)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    }
  }
}

export function closePosition(profile: Entity.IProfile, {order, units}: Entity.ICloseRequest) {
  const instrument = getInstrument(order.currencyBuy, order.currencySell);
  const convertedUnits = Identity.Do.of(units)
    .map(instrument.units)
    .map(ℚ.abs)
    .map(ℚ.toFloat)
    .extract();
  return S.Do.of<Error, Entity.IOrder>(new Http.HttpEffect({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}/close`,
    method: 'PUT',
    json: {
      units: `${convertedUnits}`
    },
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => parseResponse<IOandaOrder>(it))
        .orSome(Either.Left<Error, IOandaOrder>(createError('Empty response')));

      return resolve(Either.map<Error, IOandaOrder, Entity.IOrder>(parseOrder)(errorOrOrder));

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          orderFillTransaction: Joi.object({
            id: Joi.string().required(),
            price: Joi.string().required(),
            pl: Joi.string().required(),
            units: Joi.string().required(),
          }).unknown().required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not close the position for trade ${order.currencySell}/${order.currencyBuy} **

PUT ${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}/close
{
  units: ${convertedUnits}
}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }

      function parseOrder(orderResponse: IOandaOrder): Entity.IOrder {
        return {
          id: order.id,
          currencySell: order.currencySell,
          currencyBuy: order.currencyBuy,
          price: Identity.Do.of(orderResponse.orderFillTransaction.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: Identity.Do.of(orderResponse.orderFillTransaction.pl)
            .map(parseFloat)
            .map(ℚ.parse)
            .extract(),
          units: Identity.Do.of(orderResponse.orderFillTransaction.units)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    });
  })).value;
}

export function closePosition2(profile: Entity.IProfile, {order, units}: Entity.ICloseRequest): E.Engine<Message.ApiError | Message.Empty> {
  const instrument = getInstrument2({currencyBuy: order.currencyBuy, currencySell: order.currencySell});
  const maybeUnits = Maybe.map<IInstrument, (x0: ℚ.ℚ) => number>((instrument) => compose(ℚ.toFloat, ℚ.abs, instrument.units))(instrument);

  const request = (convertedUnits: number) => Http.Request<IOandaOrder>({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}/close`,
    method: 'PUT',
    json: {
      units: `${convertedUnits}`
    },
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  });
  const reply = compose(
    Either.cata<Error, Entity.IOrder, E.Engine<Message.ApiError>, E.Engine<Message.Empty>>(
      error => Passthrough({message: new Message.ApiError({description: error.message})}),
      order => E.map(() => new Message.Empty())(Q.Publish2({message: new Message.OrderChanged({order})}))
    ),
    parseResponse
  );
  const orInvalidInstrument = Maybe.orSome<E.Engine<Message.Empty>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `BUY: ${order.currencyBuy} SELL: ${order.currencySell} is not a valid instrument`})}));
  return compose(
    orInvalidInstrument,
    Maybe.map<E.Engine<Http.Message.ResponseEvent<IOandaOrder>>, E.Engine<Message.ApiError | Message.Empty>>(E.fmap<Http.Message.ResponseEvent<IOandaOrder>, Message.ApiError | Message.Empty>(reply)),
    Maybe.map<number, E.Engine<Http.Message.ResponseEvent<IOandaOrder>>>(request),
    Maybe.ap(maybeUnits),
    Maybe.of
  )(units);

  function parseResponse(message: Http.Message.ResponseEvent<IOandaOrder>): Either.Either<Error, Entity.IOrder> {
    const errorOrOrder = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<IOandaOrder>(it))
      .orSome(Either.Left<Error, IOandaOrder>(createError('Empty response')));

    return Either.fmap<Error, IOandaOrder, Entity.IOrder>(parseOrder)(errorOrOrder);

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        orderFillTransaction: Joi.object({
          id: Joi.string().required(),
          price: Joi.string().required(),
          pl: Joi.string().required(),
          units: Joi.string().required(),
        }).unknown().required()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return compose(
        Maybe.orSome<Error, Error>(new Error('Invalid Instrument')),
        Maybe.map<number, Error>(template),
        Maybe.ap(maybeUnits)
      )(Maybe.of(units));

      function template(convertedUnits: number) {
        return new Error(stripIndent`
          ** Could not close the position for trade ${order.currencySell}/${order.currencyBuy} **

          PUT ${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}/close
          {
            units: ${convertedUnits}
          }

          Error:
          ${reason}

          Status Code:
          ${message.payload.incomingMessage.statusCode}

          Response:
          ${JSON.stringify(message.payload.response, null, 2)}
        `);
      }
    }

    function parseOrder(orderResponse: IOandaOrder): Either.Either<Error, Entity.IOrder> {
      return compose(
        Maybe.orSome<Either.Either<Error, Entity.IOrder>, Either.Either<Error, Entity.IOrder>>(Either.Left<Error, Entity.IOrder>(createError('Invalid instrument'))),
        Maybe.map<Entity.IOrder, Either.Either<Error, Entity.IOrder>>(order => Either.Right<Error, Entity.IOrder>(order)),
        Maybe.map(parse)
      )(instrument);

      function parse(instrument: IInstrument): Entity.IOrder {
        return {
          id: order.id,
          currencySell: order.currencySell,
          currencyBuy: order.currencyBuy,
          price: Identity.Do.of(orderResponse.orderFillTransaction.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: Identity.Do.of(orderResponse.orderFillTransaction.pl)
            .map(parseFloat)
            .map(ℚ.parse)
            .extract(),
          units: Identity.Do.of(orderResponse.orderFillTransaction.units)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    }
  }
}

export function getPosition(profile: Entity.IProfile, order: Entity.IOrder) {
  const instrument = getInstrument(order.currencyBuy, order.currencySell);
  return S.Do.of<Error, Entity.IOrder>(new Http.HttpEffect({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}`,
    json: true,
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => parseResponse<{lastTransactionID: string, trade: IOandaTrade}>(it))
        .orSome(Either.Left<Error, {lastTransactionID: string, trade: IOandaTrade}>(createError('Empty response')));

      return resolve(Either.map<Error, {lastTransactionID: string; trade: IOandaTrade;}, Entity.IOrder>(parseOrder)(errorOrOrder));

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          trade: Joi.object({
            id: Joi.string().required(),
            price: Joi.string().required(),
            realizedPL: Joi.string().required(),
            unrealizedPL: Joi.string().required(),
            currentUnits: Joi.string().required()
          }).unknown()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the open trade ${order.id} ${order.currencySell}/${order.currencyBuy} **

GET ${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }

      function parseOrder({trade}: {lastTransactionID: string, trade: IOandaTrade}): Entity.IOrder {
        const realizedPL = trade.realizedPL ? parseFloat(trade.realizedPL) : 0;
        const unrealizedPL = trade.unrealizedPL ? parseFloat(trade.unrealizedPL) : 0;
        return {
          currencySell: order.currencySell,
          currencyBuy: order.currencyBuy,
          id: trade.id,
          price: Identity.Do.of(trade.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: ℚ.parse(realizedPL + unrealizedPL),
          units: Identity.Do.of(trade.currentUnits)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    });
  })).value;
}

export function getPosition2(profile: Entity.IProfile, order: Entity.IOrder): E.Engine<Message.ApiError | Message.Order> {
  const instrument = getInstrument2({currencyBuy: order.currencyBuy, currencySell: order.currencySell});
  const request = (instrument: IInstrument) => Http.Request<{lastTransactionID: string; trade: IOandaTrade}>({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}`,
    json: true,
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  });
  const reply = compose(
    Either.cata<Error, Entity.IOrder, Message.ApiError, Message.Order>(
      error => new Message.ApiError({description: error.message}),
      order => new Message.Order({order})
    ),
    parseResponse
  );
  const orInvalidInstrument = Maybe.orSome<E.Engine<Message.Order>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `BUY: ${order.currencyBuy} SELL: ${order.currencySell} is not a valid instrument`})}));
  return compose(
    orInvalidInstrument,
    Maybe.map<E.Engine<Http.Message.ResponseEvent<{lastTransactionID: string; trade: IOandaTrade}>>, E.Engine<Message.ApiError | Message.Order>>(E.map<Http.Message.ResponseEvent<{lastTransactionID: string; trade: IOandaTrade}>, Message.ApiError | Message.Order>(reply)),
    Maybe.map<IInstrument, E.Engine<Http.Message.ResponseEvent<{lastTransactionID: string; trade: IOandaTrade}>>>(request)
  )(instrument);

  function parseResponse(message: Http.Message.ResponseEvent<{lastTransactionID: string; trade: IOandaTrade}>): Either.Either<Error, Entity.IOrder> {
    const errorOrOrder = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<{lastTransactionID: string, trade: IOandaTrade}>(it))
      .orSome(Either.Left<Error, {lastTransactionID: string, trade: IOandaTrade}>(createError('Empty response')));

    return Either.fmap<Error, {lastTransactionID: string; trade: IOandaTrade;}, Entity.IOrder>(parseOrder)(errorOrOrder);

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        trade: Joi.object({
          id: Joi.string().required(),
          price: Joi.string().required(),
          realizedPL: Joi.string().required(),
          unrealizedPL: Joi.string().required(),
          currentUnits: Joi.string().required()
        }).unknown()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the open trade ${order.id} ${order.currencySell}/${order.currencyBuy} **

        GET ${profile.url}/v3/accounts/${profile.accountId}/trades/${order.id}

        Error:
        ${reason}

        Status Code:
        ${message.payload.incomingMessage.statusCode}

        Response:
        ${JSON.stringify(message.payload.response, null, 2)}
      `);
    }

    function parseOrder({trade}: {lastTransactionID: string, trade: IOandaTrade}): Either.Either<Error, Entity.IOrder> {
      const realizedPL = trade.realizedPL ? parseFloat(trade.realizedPL) : 0;
      const unrealizedPL = trade.unrealizedPL ? parseFloat(trade.unrealizedPL) : 0;
      return compose(
        Maybe.orSome<Either.Either<Error, Entity.IOrder>, Either.Either<Error, Entity.IOrder>>(Either.Left<Error, Entity.IOrder>(createError('Invalid instrument'))),
        Maybe.map<Entity.IOrder, Either.Either<Error, Entity.IOrder>>(order => Either.Right<Error, Entity.IOrder>(order)),
        Maybe.map(parse)
      )(instrument);

      function parse(instrument: IInstrument): Entity.IOrder {
        return {
          currencySell: order.currencySell,
          currencyBuy: order.currencyBuy,
          id: trade.id,
          price: Identity.Do.of(trade.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: ℚ.parse(realizedPL + unrealizedPL),
          units: Identity.Do.of(trade.currentUnits)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      }
    }
  }
}

export function getPositions(profile: Entity.IProfile) {
  return S.Do.of<Error, Entity.IOrder[]>(new Http.HttpEffect({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades`,
    json: true,
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder[]>>((resolve, reject) => {
      const errorOrOrders = Maybe.Do.of(response)
        .map(it => parseResponse<{lastTransactionID: string, trades: IOandaTrade[]}>(it))
        .orSome(Either.Left<Error, {lastTransactionID: string, trades: IOandaTrade[]}>(createError('Empty response')));

      return resolve(Either.map<Error, {lastTransactionID: string; trades: IOandaTrade[]}, Entity.IOrder[]>(parseOrders)(errorOrOrders));

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          trades: Joi.array().items(
            Joi.object({
              id: Joi.string().required(),
              price: Joi.string().required(),
              instrument: Joi.string().regex(/_/).required(),
              realizedPL: Joi.string().required(),
              unrealizedPL: Joi.string().required(),
              currentUnits: Joi.string().required()
            }).unknown()
          )
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the open trades **

GET ${profile.url}/v3/accounts/${profile.accountId}/trades

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }

      function parseOrders({trades}: {lastTransactionID: string, trades: IOandaTrade[]}): Entity.IOrder[] {
        return trades.map((trade): Entity.IOrder => {
          const realizedPL = trade.realizedPL ? parseFloat(trade.realizedPL) : 0;
          const unrealizedPL = trade.unrealizedPL ? parseFloat(trade.unrealizedPL) : 0;
          const isShort = parseInt(trade.initialUnits, 10) < 0;
          const currencyPair = isShort ? {
            currencyBuy: trade.instrument.split('_')[1] as any,
            currencySell: trade.instrument.split('_')[0] as any
          } : {
            currencyBuy: trade.instrument.split('_')[0] as any,
            currencySell: trade.instrument.split('_')[1] as any
          };
          const instrument = getInstrument(currencyPair.currencyBuy, currencyPair.currencySell)
          return {
            currencySell: currencyPair.currencySell,
            currencyBuy: currencyPair.currencyBuy,
            id: trade.id,
            price: Identity.Do.of(trade.price)
              .map(parseFloat)
              .map(ℚ.parse)
              .map(instrument.parse)
              .extract(),
            pl: ℚ.parse(realizedPL + unrealizedPL),
            units: Identity.Do.of(trade.currentUnits)
              .map(units => parseInt(units, 10))
              .map(ℚ.parse)
              .map(ℚ.abs)
              .extract()
          };
        });
      }
    });
  })).value;
}

export function getPositions2(profile: Entity.IProfile): E.Engine<Message.ApiError | Message.Orders> {
  const request = Http.Request<{lastTransactionID: string; trades: IOandaTrade[]}>({
    uri: `${profile.url}/v3/accounts/${profile.accountId}/trades`,
    json: true,
    headers: {
      Authorization: `Bearer ${profile.token}`,
      'User-Agent': Browser.userAgent
    }
  });
  const reply = compose(
    Either.cata<Error, Entity.IOrder[], Message.ApiError, Message.Orders>(
      error => new Message.ApiError({description: error.message}),
      orders => new Message.Orders({orders})
    ),
    parseResponse
  );
  return E.map(reply)(request);

  function parseResponse(message: Http.Message.ResponseEvent<{lastTransactionID: string;trades: IOandaTrade[]}>): Either.Either<Error, Entity.IOrder[]> {
    const errorOrOrders = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<{lastTransactionID: string, trades: IOandaTrade[]}>(it))
      .orSome(Either.Left<Error, {lastTransactionID: string, trades: IOandaTrade[]}>(createError('Empty response')));

    return Either.map<Error, {lastTransactionID: string; trades: IOandaTrade[]}, Entity.IOrder[]>(parseOrders)(errorOrOrders);

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        trades: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            price: Joi.string().required(),
            instrument: Joi.string().regex(/_/).required(),
            realizedPL: Joi.string().required(),
            unrealizedPL: Joi.string().required(),
            currentUnits: Joi.string().required()
          }).unknown().required()
        ).required()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the open trades **

        GET ${profile.url}/v3/accounts/${profile.accountId}/trades

        Error:
        ${reason}

        Status Code:
        ${message.payload.incomingMessage.statusCode}

        Response:
        ${JSON.stringify(message.payload.response, null, 2)}
      `);
    }

    function parseOrders({trades}: {lastTransactionID: string, trades: IOandaTrade[]}): Entity.IOrder[] {
      return trades.map((trade): Entity.IOrder => {
        const realizedPL = trade.realizedPL ? parseFloat(trade.realizedPL) : 0;
        const unrealizedPL = trade.unrealizedPL ? parseFloat(trade.unrealizedPL) : 0;
        const isShort = parseInt(trade.initialUnits, 10) < 0;
        const currencyPair = isShort ? {
          currencyBuy: trade.instrument.split('_')[1] as any,
          currencySell: trade.instrument.split('_')[0] as any
        } : {
          currencyBuy: trade.instrument.split('_')[0] as any,
          currencySell: trade.instrument.split('_')[1] as any
        };
        const instrument = getInstrument(currencyPair.currencyBuy, currencyPair.currencySell)
        return {
          currencySell: currencyPair.currencySell,
          currencyBuy: currencyPair.currencyBuy,
          id: trade.id,
          price: Identity.Do.of(trade.price)
            .map(parseFloat)
            .map(ℚ.parse)
            .map(instrument.parse)
            .extract(),
          pl: ℚ.parse(realizedPL + unrealizedPL),
          units: Identity.Do.of(trade.currentUnits)
            .map(units => parseInt(units, 10))
            .map(ℚ.parse)
            .map(ℚ.abs)
            .extract()
        };
      });
    }
  }
}

interface IOandaPrice {
  instrument: string;
  time: string;
  status: string,
  bids: {price: string, liquidity: number}[];
  asks: {price: string, liquidity: number}[];
  closeoutAsk: string,
  closeoutBid: string,
  quoteHomeConversionFactors: {
    positiveUnits: string,
    negativeUnits: string
  },
  unitsAvailable: {
    reduceOnly: {short: string, long: string},
    reduceFirst: {short: string, long: string },
    openOnly: {short: string, long: string },
    default: {short: string, long: string }
  }
}

interface IOandaOrder {
  orderCreateTransaction: {
    userID: number,
    units: string,
    type: string,
    accountID: string,
    batchID: string,
    id: string,
    instrument: string,
    positionFill: string,
    reason: string,
    time: string,
    timeInForce: string,
    tradeClose?: {
      tradeID: string,
      units: string
    }
  },
  orderFillTransaction: {
    userID: number,
    units: string,
    type: string,
    tradeOpened: {
      units: string,
      tradeID: string
    },
    time: string,
    reason: string,
    price: string,
    accountBalance: string,
    accountID: string,
    batchID: string,
    financing: string,
    id: string,
    instrument: string,
    orderID: string,
    pl: string,
    tradesClosed?: {
      financing: string,
      realizedPL: string,
      tradeID: string,
      units: string
    }[]
  }
  orderCancelTransaction?: {
    accountID: string,
    batchID: string,
    id: string,
    orderID: string,
    reason: string,
    time: string,
    type: string,
    userID: number
  }
  relatedTransactionIDs?: string[],
  lastTransactionID: string
}

interface IOandaTrade {
  currentUnits: string
  financing: string
  id: string
  initialUnits: string
  instrument: string
  openTime: string
  price: string
  realizedPL: string
  state: string
  unrealizedPL: string
}

interface IOandaError {
  errorCode: number,
  errorMessage: string
}