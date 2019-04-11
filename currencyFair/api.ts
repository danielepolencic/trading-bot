import * as Request from 'request';
import * as Browser from '../config/browser';
import * as ℚ from '../monad/rational';
import * as Entity from './entity';
import * as Effects from '../effect/defaultEffects';
import * as Http from '../effect/http';
import * as Scheduler from '../effect/scheduler';
import * as S from '../effect/system';
import * as Maybe from '../monad/maybe';
import * as Currency from '../currency';
import * as Either from '../monad/either';
import * as Joi from 'joi';

import * as E from '../effect/engine';
import * as Token from './token';
import {IMessage} from '../effect/message';
import {compose} from '../utils';
import * as Q from '../effect/queue';
import {stripIndent} from 'common-tags';
import {Passthrough} from '../effect/passthrough';

export namespace Message {
  export class Type {
    public static readonly Error = 'CurrencyFair.Api.Error'
    public static readonly OrderChanged = 'CurrencyFair.Api.OrderChanged'
    public static readonly Market = 'CurrencyFair.Api.Market'
    public static readonly Order = 'CurrencyFair.Api.Order'
    public static readonly Orders = 'CurrencyFair.Api.Orders'
    public static readonly Summary = 'CurrencyFair.Api.Summary'
    public static readonly Empty = 'CurrencyFair.Api.Empty'
  }

  export class ApiError implements IMessage {
    public readonly type = Type.Error
    constructor(public readonly payload: {description: string}) {}
  }

  export class OrderChanged implements IMessage {
    public readonly type = Type.OrderChanged
    constructor(public readonly payload: {id: string}) {}
  }

  export class Market implements IMessage {
    public readonly type = Type.Market
    constructor(public readonly payload: {market: Entity.IMarketplace}) {}
  }

  export class Order implements IMessage {
    public readonly type = Type.Order
    constructor(public readonly payload: {order: Entity.IOrder}) {}
  }

  export class Orders implements IMessage {
    public readonly type = Type.Orders
    constructor(public readonly payload: {orders: Entity.IOrder[]}) {}
  }

  export class Summary implements IMessage {
    public readonly type = Type.Summary
    constructor(public readonly payload: {summary: Entity.IBalance[]}) {}
  }

  export class Empty implements IMessage {
    public readonly type = Type.Empty
    constructor() {}
  }
}

export function placeOrder2(profile: Entity.IProfile, {currencySell, currencyBuy, amount, rate}: Entity.IOrderRequest): E.Engine<Message.Empty | Message.ApiError> {
  return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.Empty | Message.ApiError>(message => {
    switch(message.type) {
      case Token.Message.Type.TokenResponse:
        const request = Http.Request<ICFOrder>({
          uri: `${profile.apiUrl}/marketplaceOrders`,
          method: 'POST',
          json: {
            currencyFrom: `${currencySell}`,
            currencyTo: `${currencyBuy}`,
            type: 'SELL',
            amount: ℚ.toFloat(amount),
            rate: ℚ.toFloat(rate)
          },
          headers: {
            Authorization: `Bearer ${message.payload.token}`,
            'User-Agent': Browser.userAgent
          }
        });
        const reply = compose(
          Either.cata<Error, Entity.IOrder, E.Engine<Message.ApiError>, E.Engine<Message.Empty>>(
            error => Passthrough({message: new Message.ApiError({description: error.message})}),
            order => compose(
              E.map(() => new Message.Empty()),
              E.fmap(() => Q.Publish2({message: new Message.OrderChanged({id: order.id})}))
            )(Scheduler.Delay2({ms: 1000}))
          ),
          parseResponse
        );
        return E.fmap<Http.Message.ResponseEvent<ICFOrder>, Message.ApiError | Message.Empty>(reply)(request);
      case Token.Message.Type.TokenInvalid:
      default:
        return Passthrough({message: new Message.ApiError({description: message.payload.message})});
    }
  })(Token.getToken(profile));

  function parseResponse<T>(message: Http.Message.ResponseEvent<T>): Either.Either<Error, Entity.IOrder> {
    const errorOrOrder = Maybe.Do.of(message.payload.response)
      .map(it => compose(Either.map<Error, ICFOrder, Entity.IOrder>(parseOrder), validateResponse)(it))
      .orSome(Either.Left<Error, Entity.IOrder>(createError('Empty response')));

    return errorOrOrder;

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        id: Joi.number().required()
      }).unknown().required();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not place the order ${currencySell}/${currencyBuy} ${ℚ.toFloat(amount)} units @ ${ℚ.toFloat(rate)} **

        POST ${profile.apiUrl}/marketplaceOrders
        {
          currencyFrom: ${currencySell},
          currencyTo: ${currencyBuy},
          type: SELL,
          amount: ${ℚ.toFloat(amount)},
          rate: ${ℚ.toFloat(rate)}
        }

        Error:
        ${reason}

        Status Code:
        ${message.payload.incomingMessage.statusCode}

        Response:
        ${JSON.stringify(message.payload.response, null, 2)}
      `);
    }

    function parseOrder(order: ICFOrder): Entity.IOrder {
      return {
        id: `${order.id}`,
        currencySell,
        currencyBuy,
        events: []
      };
    }
  }
}

export function placeOrder(profile: Entity.IProfile, {currencySell, currencyBuy, amount, rate}: Entity.IOrderRequest) {
  return S.Do.of<Error, Entity.IOrder>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/marketplaceOrders`,
    method: 'POST',
    json: {
      currencyFrom: `${currencySell}`,
      currencyTo: `${currencyBuy}`,
      type: 'SELL',
      amount: ℚ.toFloat(amount),
      rate: ℚ.toFloat(rate)
    },
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>): Promise<Either.Either<Error, Entity.IOrder>> => {
    return new Promise<Either.Either<Error, Entity.IOrder>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => parseResponse<ICFOrder>(it))
        .orSome(Either.Left<Error, ICFOrder>(createError('Empty response')));

      return resolve(Either.map<Error, ICFOrder, Entity.IOrder>(parseOrder)(errorOrOrder));

      function parseOrder(order: ICFOrder): Entity.IOrder {
        return {
          id: `${order.id}`,
          currencySell,
          currencyBuy,
          events: []
        };
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          id: Joi.number().required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not place the order ${currencySell}/${currencyBuy} ${ℚ.toFloat(amount)} units @ ${ℚ.toFloat(rate)} **

POST ${profile.apiUrl}/marketplaceOrders
{
  currencyFrom: ${currencySell},
  currencyTo: ${currencyBuy},
  type: SELL,
  amount: ${ℚ.toFloat(amount)},
  rate: ${ℚ.toFloat(rate)}
}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  })).fmap(order => {
    // TODO: Sometimes the order is not replicated instantly
    return S.map<Error, void, any>(() => {
      return Object.assign({}, order, {events: order.events.filter(it => it.type === Entity.OrderEventType.CREATED)});
    })(Scheduler.Delay(1000));
  }).value;
}

export function cancelOrder2(profile: Entity.IProfile, order: Entity.IOrder): E.Engine<Message.Empty | Message.ApiError> {
  return compose(
    Maybe.orSome<E.Engine<Message.Empty | Message.ApiError>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `${order.id} order cannot be cancelled.`})})),
    Maybe.map(cancel),
    Maybe.fmap<Entity.IOrder, ℚ.ℚ>(computePendingAmount),
    Entity.isPending
  )(order);

  function computePendingAmount(order: Entity.IOrder): Maybe.Maybe<ℚ.ℚ> {
    const lastEvent = Maybe.of(order.events[order.events.length - 1]);

    return Maybe.fmap<Entity.IOrderEvent, ℚ.ℚ>(event => {
      return event.type !== Entity.OrderEventType.PART_MATCHED ?
        Maybe.of(event.amountSell) : remaningAmount(order);
    })(lastEvent);

    function remaningAmount(order: Entity.IOrder): Maybe.Maybe<ℚ.ℚ> {
      const originalAmount = Maybe.of<Entity.IOrderEvent>(order.events.find(it => it.type === Entity.OrderEventType.CREATED));
      const exchanged = order.events
        .filter(it => it.type === Entity.OrderEventType.PART_MATCHED)
        .reduce((acc, it) => ℚ.addTo(acc)(it.amountSell), ℚ.parse(0));
      return Maybe.lift2(
        (originalAmount, exchanged) => ℚ.subtractTo(exchanged)(originalAmount),
        Maybe.map<Entity.IOrderEvent, ℚ.ℚ>(event => event.amountSell)(originalAmount),
        Maybe.of(exchanged)
      );
    }
  }

  function cancel(amount: ℚ.ℚ): E.Engine<Message.Empty | Message.ApiError> {
    return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.Empty | Message.ApiError>(message => {
      switch(message.type) {
        case Token.Message.Type.TokenResponse:
          const request = Http.Request<void>({
            uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`,
            method: 'DELETE',
            json: true,
            qs: {
              amount: ℚ.toFloat(amount)
            },
            headers: {
              Authorization: `Bearer ${message.payload.token}`,
              'User-Agent': Browser.userAgent
            }
          });
          const reply = compose(
            Either.cata<Error, void, E.Engine<Message.ApiError>, E.Engine<Message.Empty>>(
              error => Passthrough({message: new Message.ApiError({description: error.message})}),
              () => compose(
                E.map(() => new Message.Empty()),
                E.fmap(() => Q.Publish2({message: new Message.OrderChanged({id: order.id})}))
              )(Scheduler.Delay2({ms: 1000}))
            ),
            parseResponse(amount)
          );
          return E.fmap<Http.Message.ResponseEvent<void>, Message.ApiError | Message.Empty>(reply)(request);
        case Token.Message.Type.TokenInvalid:
        default:
          return Passthrough({message: new Message.ApiError({description: message.payload.message})});
      }
    })(Token.getToken(profile));
  }

  function parseResponse(amount: ℚ.ℚ) {
    return <T>(message: Http.Message.ResponseEvent<T>): Either.Either<Error, void> => {
      return Maybe.Do.of<number>(message.payload.incomingMessage.statusCode)
      .map(statusCode => statusCode === 204 ?
        Either.Right<Error, void>(undefined) :
        Either.Left<Error, void>(createError('Invalid status code'))
      )
      .orSome(Either.Left<Error, void>(createError('Empty status code')));

      function createError(reason: string): Error {
        return new Error(stripIndent`
          ** Could not cancel the order ${order.currencySell}/${order.currencyBuy} ${ℚ.toFloat(amount)} units **

          DELETE ${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}?amount=${ℚ.toFloat(amount)}

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
}

export function cancelOrder(profile: Entity.IProfile, order: Entity.IOrder): S.System<Error, Entity.IOrder> {
  return compose(
    Maybe.orSome<S.System<Error, Entity.IOrder>, S.System<Error, Entity.IOrder>>(Effects.Constant<Error, Entity.IOrder>(Either.Left<Error, Entity.IOrder>(new Error('A completed or cancelled order cannot be cancelled.')))),
    Maybe.map(cancel),
    Maybe.fmap<Entity.IOrder, ℚ.ℚ>(computePendingAmount),
    Entity.isPending
  )(order);

  function computePendingAmount(order: Entity.IOrder): Maybe.Maybe<ℚ.ℚ> {
    const lastEvent = Maybe.of(order.events[order.events.length - 1]);

    return Maybe.fmap<Entity.IOrderEvent, ℚ.ℚ>(event => {
      return event.type !== Entity.OrderEventType.PART_MATCHED ?
        Maybe.of(event.amountSell) : remaning(order);
    })(lastEvent);

    function remaning(order: Entity.IOrder): Maybe.Maybe<ℚ.ℚ> {
      const originalAmount = Maybe.of<Entity.IOrderEvent>(order.events.find(it => it.type === Entity.OrderEventType.CREATED));
      const exchanged = order.events
        .filter(it => it.type === Entity.OrderEventType.PART_MATCHED)
        .reduce((acc, it) => ℚ.addTo(acc)(it.amountSell), ℚ.parse(0));
      return Maybe.lift2(
        (originalAmount, exchanged) => ℚ.subtractTo(exchanged)(originalAmount),
        Maybe.map<Entity.IOrderEvent, ℚ.ℚ>(event => event.amountSell)(originalAmount),
        Maybe.of(exchanged)
      );
    }
  }

  function cancel(amount: ℚ.ℚ): S.System<Error, Entity.IOrder> {
    return S.Do.of<Error, Entity.IOrder>(new Http.HttpCurrencyFairEffect(profile, {
      uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`,
      method: 'DELETE',
      json: true,
      qs: {
        amount: ℚ.toFloat(amount)
      },
      headers: {
        // Authorization: `Bearer ${authToken}`,
        'User-Agent': Browser.userAgent
      }
    }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>): Promise<Either.Either<Error, void>> => {
      return new Promise<Either.Either<Error, void>>((resolve, reject) => {
        return resolve(
          Maybe.Do.of<number>(incomingMessage.statusCode)
          .map(statusCode => statusCode === 204 ?
            Either.Right<Error, void>(undefined) :
            Either.Left<Error, void>(createError('Invalid status code'))
          )
          .orSome(Either.Left<Error, void>(createError('Empty response')))
        );

        function createError(reason: string): Error {
          return new Error(`
** Could not cancel the order ${order.currencySell}/${order.currencyBuy} ${ℚ.toFloat(amount)} units **

DELETE ${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}?amount=${ℚ.toFloat(amount)}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
          `);
        }
      });
    })).fmap(() => getOrder(profile, order)).value;
  }
}

export function getMarket2(profile: Entity.IProfile, {currencySell, currencyBuy}: Entity.IInstrument): E.Engine<Message.ApiError | Message.Market> {
  return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.ApiError | Message.Market>(message => {
    switch(message.type) {
      case Token.Message.Type.TokenResponse:
        const request = Http.Request<ICFMarketplace>({
          uri: `${profile.apiUrl}/marketplaces/${currencySell}/${currencyBuy}`,
          json: true,
          headers: {
            Authorization: `Bearer ${message.payload.token}`,
            'User-Agent': Browser.userAgent
          }
        });
        const reply = compose(
          Either.cata<Error, Entity.IMarketplace, Message.ApiError, Message.Market>(
            error => new Message.ApiError({description: error.message}),
            market => new Message.Market({market})
          ),
          parseResponse
        );
        return E.map<Http.Message.ResponseEvent<ICFMarketplace>, Message.ApiError | Message.Market>(reply)(request);
      case Token.Message.Type.TokenInvalid:
      default:
        return Passthrough({message: new Message.ApiError({description: message.payload.message})});
    }
  })(Token.getToken(profile));

  function parseResponse<T>(message: Http.Message.ResponseEvent<T>): Either.Either<Error, Entity.IMarketplace> {
    const errorOrMarketplace = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<ICFMarketplace>(it))
      .orSome(Either.Left<Error, ICFMarketplace>(createError('Empty response')));

    return Either.map<Error, ICFMarketplace, Entity.IMarketplace>(parseMarketplace)(errorOrMarketplace);

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        status: Joi.string().regex(/OPEN|SUSPENDED/i).required(),
        items: Joi.array().items(Joi.object({
          type: Joi.string().regex(/WAITING|AVAILABLE/i).required(),
          rateInfo: Joi.object({
            rate: Joi.number().required()
          }).unknown().required()
        }).unknown()).required()
      }).unknown().required();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the marketplace ${currencySell}/${currencyBuy} **

        GET ${profile.apiUrl}/marketplaces/${currencySell}/${currencyBuy}

        Error:
        ${reason}

        Status Code:
        ${message.payload.incomingMessage.statusCode}

        Response:
        ${JSON.stringify(message.payload.response, null, 2)}
      `);
    }

    function parseMarketplace(marketplace: ICFMarketplace): Entity.IMarketplace {
      const item = (marketplace.items || []).find(it => it.type === 'WAITING');
      return {
        currencySell,
        currencyBuy,
        rate: ℚ.parse(item ? item.rateInfo.rate : 0),
        status: parseStatus(marketplace.status)
      };
    }

    function parseStatus(status: 'OPEN' | 'SUSPENDED'): Entity.MarketplaceStatus {
      switch(status) {
        case 'OPEN':
          return Entity.MarketplaceStatus.OPEN;
        default:
          return Entity.MarketplaceStatus.SUSPENDED;
      }
    }
  }
}

export function getMarketplace(profile: Entity.IProfile, {currencySell, currencyBuy}: Entity.IInstrument) {
  return S.of<Error, Entity.IMarketplace>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/marketplaces/${currencySell}/${currencyBuy}`,
    json: true,
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IMarketplace>>((resolve, reject) => {
      const errorOrMarketplace = Maybe.Do.of(response)
        .map(it => parseResponse<ICFMarketplace>(it))
        .orSome(Either.Left<Error, ICFMarketplace>(createError('Empty response')));

      return resolve(Either.map<Error, ICFMarketplace, Entity.IMarketplace>(parseMarketplace)(errorOrMarketplace));

      function parseMarketplace(marketplace: ICFMarketplace): Entity.IMarketplace {
        const item = (marketplace.items || []).find(it => it.type === 'WAITING');
        return {
          currencySell,
          currencyBuy,
          rate: ℚ.parse(item ? item.rateInfo.rate : 0),
          status: parseStatus(marketplace.status)
        };
      }

      function parseStatus(status: 'OPEN' | 'SUSPENDED'): Entity.MarketplaceStatus {
        switch(status) {
          case 'OPEN':
            return Entity.MarketplaceStatus.OPEN;
          default:
            return Entity.MarketplaceStatus.SUSPENDED;
        }
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          status: Joi.string().regex(/OPEN|SUSPENDED/i).required(),
          items: Joi.array().items(Joi.object({
            type: Joi.string().regex(/WAITING|AVAILABLE/i).required(),
            rateInfo: Joi.object({
              rate: Joi.number().required()
            }).unknown().required()
          }).unknown()).required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the marketplace ${currencySell}/${currencyBuy} **

GET ${profile.apiUrl}/marketplaces/${currencySell}/${currencyBuy}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  }));
}

export function getOrder(profile: Entity.IProfile, order: Entity.IOrder) {
  return S.of<Error, Entity.IOrder>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`,
    json: true,
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => parseResponse<ICFHistory>(it))
        .orSome(Either.Left<Error, ICFHistory>(createError('Empty response')));
      return resolve(Either.map<Error, ICFHistory, Entity.IOrder>(parseOrder)(errorOrOrder));

      function parseOrder(newOrder: ICFHistory): Entity.IOrder {
        const events = newOrder.events
          .map((event): Entity.IOrderEvent => ({
            rate: ℚ.parse(event.rateInfo.rate),
            amountSell: ℚ.parse(event.amountInfo.sell.amount),
            amountBuy: ℚ.parse(event.amountInfo.buy.amount),
            type: eventTypeMapper(event.eventType),
            createdAt: (new Date(event.created)).toISOString()
          }))
          .slice(0)
          .sort((a, b) => (new Date(a.createdAt)).valueOf() - (new Date(b.createdAt)).valueOf());
        return {
          id: `${newOrder.id}`,
          currencySell: (<any>newOrder._embedded.currencyFrom.currencyCode) as Currency.ANY,
          currencyBuy: (<any>newOrder._embedded.currencyTo.currencyCode) as Currency.ANY,
          events
        };
      }

      function eventTypeMapper(eventType: string): Entity.OrderEventType {
        switch(eventType) {
          case 'PART_MATCHED':
            return Entity.OrderEventType.PART_MATCHED;
          case 'CREATED':
            return Entity.OrderEventType.CREATED;
          case 'UPDATED':
            return Entity.OrderEventType.UPDATED;
          case 'CANCELLED':
            return Entity.OrderEventType.CANCELLED;
          case 'MATCHED':
            return Entity.OrderEventType.MATCHED;
          default:
            return Entity.OrderEventType.UNKNOWN
        }
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          id: Joi.number().required(),
          _embedded: Joi.object({
            currencyFrom: Joi.object({
              currencyCode: Joi.string().required()
            }).unknown(),
            currencyTo: Joi.object({
              currencyCode: Joi.string().required()
            }).unknown()
          }).unknown(),
          events: Joi.array().items(Joi.object({
            rateInfo: Joi.object({
              rate: Joi.number().required()
            }).unknown(),
            amountInfo: Joi.object({
              sell: Joi.object({
                amount: Joi.number().required()
              }).unknown(),
              buy: Joi.object({
                amount: Joi.number().required()
              }).unknown(),
            }).unknown(),
            eventType: Joi.string().regex(/PART_MATCHED|CREATED|UPDATED|CANCELLED|MATCHED/i),
            created: Joi.string().required()
          }).unknown()).min(1)
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the order ${order.id} ${order.currencySell}/${order.currencyBuy} **

GET ${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  }));
}

export function getOrder2(profile: Entity.IProfile, order: {id: string}): E.Engine<Message.ApiError | Message.Order> {
  return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.ApiError | Message.Order>(message => {
    switch(message.type) {
      case Token.Message.Type.TokenResponse:
        const request = Http.Request<ICFHistory>({
          uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}/history`,
          json: true,
          headers: {
            Authorization: `Bearer ${message.payload.token}`,
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
        return E.map<Http.Message.ResponseEvent<ICFHistory>, Message.ApiError | Message.Order>(reply)(request);
      case Token.Message.Type.TokenInvalid:
      default:
        return Passthrough({message: new Message.ApiError({description: message.payload.message})});
    }
  })(Token.getToken(profile));

  function parseResponse(message: Http.Message.ResponseEvent<ICFHistory>): Either.Either<Error, Entity.IOrder> {
    const errorOrOrder = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<ICFHistory>(it))
      .orSome(Either.Left<Error, ICFHistory>(createError('Empty response')));
    return Either.map<Error, ICFHistory, Entity.IOrder>(parseOrder)(errorOrOrder);

    function parseOrder(newOrder: ICFHistory): Entity.IOrder {
      const events = newOrder.events
        .map((event): Entity.IOrderEvent => ({
          rate: ℚ.parse(event.rateInfo.rate),
          amountSell: ℚ.parse(event.amountInfo.sell.amount),
          amountBuy: ℚ.parse(event.amountInfo.buy.amount),
          type: eventTypeMapper(event.eventType),
          createdAt: (new Date(event.created)).toISOString()
        }))
        .slice(0)
        .sort((a, b) => (new Date(a.createdAt)).valueOf() - (new Date(b.createdAt)).valueOf());
      return {
        id: `${newOrder.id}`,
        currencySell: (<any>newOrder._embedded.currencyFrom.currencyCode) as Currency.ANY,
        currencyBuy: (<any>newOrder._embedded.currencyTo.currencyCode) as Currency.ANY,
        events
      };
    }

    function eventTypeMapper(eventType: string): Entity.OrderEventType {
      switch(eventType) {
        case 'PART_MATCHED':
          return Entity.OrderEventType.PART_MATCHED;
        case 'CREATED':
          return Entity.OrderEventType.CREATED;
        case 'UPDATED':
          return Entity.OrderEventType.UPDATED;
        case 'CANCELLED':
          return Entity.OrderEventType.CANCELLED;
        case 'MATCHED':
          return Entity.OrderEventType.MATCHED;
        default:
          return Entity.OrderEventType.UNKNOWN
      }
    }

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        id: Joi.number().required(),
        _embedded: Joi.object({
          currencyFrom: Joi.object({
            currencyCode: Joi.string().required()
          }).unknown().required(),
          currencyTo: Joi.object({
            currencyCode: Joi.string().required()
          }).unknown().required()
        }).unknown().required(),
        events: Joi.array().items(Joi.object({
          rateInfo: Joi.object({
            rate: Joi.number().required()
          }).unknown().required(),
          amountInfo: Joi.object({
            sell: Joi.object({
              amount: Joi.number().required()
            }).unknown().required(),
            buy: Joi.object({
              amount: Joi.number().required()
            }).unknown().required(),
          }).unknown().required(),
          eventType: Joi.string().regex(/PART_MATCHED|CREATED|UPDATED|CANCELLED|MATCHED/i).required(),
          created: Joi.string().required()
        }).unknown()).min(1).required()
      }).unknown().required();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the order ${order.id} **

        GET ${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}

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

export function getOrders2(profile: Entity.IProfile): E.Engine<Message.Order | Message.ApiError> {
  const emptyOrders = E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.ApiError | Message.Orders>(message => {
    switch(message.type) {
      case Token.Message.Type.TokenResponse:
        const request = Http.Request<ICFOrders>({
          uri: `${profile.apiUrl}/users/${profile.customerId}/orders`,
          json: true,
          qs: {
            page_size: 5
          },
          headers: {
            Authorization: `Bearer ${message.payload.token}`,
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
        return E.map<Http.Message.ResponseEvent<ICFOrders>, Message.ApiError | Message.Orders>(reply)(request);
      case Token.Message.Type.TokenInvalid:
      default:
        return Passthrough({message: new Message.ApiError({description: message.payload.message})});
    }
  });

  const getFullOrders = E.fmap<Message.ApiError | Message.Orders, Message.ApiError | Message.Order>(message => {
    switch(message.type) {
      case Message.Type.Orders:
        const a = message.payload.orders.map(order => getOrder2(profile, order));
        return E.batch(a);
      case Message.Type.Error:
      default:
        return Passthrough({message});
    }
  });

  return compose(getFullOrders, emptyOrders)(Token.getToken(profile))

  function parseResponse(message: Http.Message.ResponseEvent<ICFOrders>): Either.Either<Error, Entity.IOrder[]> {
    const errorOrOrders = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<ICFOrders>(it))
      .orSome(Either.Left<Error, ICFOrders>(createError('Empty response')));

    return Either.Do.of(errorOrOrders)
      .map(it => it._embedded.orders)
      .map(parseOrders)
      .value;

    function parseOrders(orders: ICFOrder[]): Entity.IOrder[] {
      return orders.map((order): Entity.IOrder => ({
        id: `${order.id}`,
        currencySell: order._embedded.currencyFrom.currencyCode as any,
        currencyBuy: order._embedded.currencyTo.currencyCode as any,
        events: []
      }));
    }

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        _embedded: Joi.object({
          orders: Joi.array().items(Joi.object({
            id: Joi.number().required(),
            _embedded: Joi.object({
              currencyFrom: Joi.object({
                currencyCode: Joi.string().required(),
              }).unknown().required(),
              currencyTo: Joi.object({
                currencyCode: Joi.string().required(),
              }).unknown().required(),
            }).unknown().required()
          }).unknown().required())
        }).unknown().required()
      }).unknown().required();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve pending orders **

        GET ${profile.apiUrl}/users/${profile.customerId}/orders

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

export function getOrders(profile: Entity.IProfile): S.System<Error, Entity.IOrder[]> {
  return S.Do.of<Error, Entity.IOrder[]>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/users/${profile.customerId}/orders`,
    json: true,
    qs: {
      page_size: 5
    },
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IOrder[]>>((resolve, reject) => {
      const errorOrOrders = Maybe.Do.of(response)
        .map(it => parseResponse<ICFOrders>(it))
        .orSome(Either.Left<Error, ICFOrders>(createError('Empty response')));

      return resolve(
        Either.Do.of(errorOrOrders)
        .map(it => it._embedded.orders)
        .map(parseOrders)
        .value
      );

      function parseOrders(orders: ICFOrder[]): Entity.IOrder[] {
        return orders.map((order): Entity.IOrder => ({
          id: `${order.id}`,
          currencySell: order._embedded.currencyFrom.currencyCode as any,
          currencyBuy: order._embedded.currencyTo.currencyCode as any,
          events: []
        }));
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          _embedded: Joi.object({
            orders: Joi.array().items(Joi.object({
              id: Joi.number().required(),
              _embedded: Joi.object({
                currencyFrom: Joi.object({
                  currencyCode: Joi.string().required(),
                }).unknown(),
                currencyTo: Joi.object({
                  currencyCode: Joi.string().required(),
                }).unknown(),
              }).unknown()
            }).unknown())
          }).unknown()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve pending orders **

GET ${profile.apiUrl}/users/${profile.customerId}/orders

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  })).fmap<Entity.IOrder[]>(orders => {
    if (orders.length === 0) return Effects.Const(orders);
    return orders.slice(1).reduce<S.System<Error, Entity.IOrder[]>>((acc, order) => {
      return S.fmap<Error, Entity.IOrder[], Entity.IOrder[]>((previousOrders: Entity.IOrder[]) => S.map<Error, Entity.IOrder, Entity.IOrder[]>((order: Entity.IOrder) => previousOrders.concat(order))(getOrder(profile, order)))(acc);
    }, S.map<Error, Entity.IOrder, Entity.IOrder[]>(it => [it])(getOrder(profile, orders[0])));
  }).value;
}

export function updateOrder(profile: Entity.IProfile, {order, rate}: {order: Entity.IOrder, rate: ℚ.ℚ}): S.System<Error, Entity.IOrder> {
  const lastEvent: Entity.IOrderEvent | void = order.events[order.events.length - 1];

  if (lastEvent === undefined) {
    return Effects.Constant<Error, Entity.IOrder>(Either.Left<Error, Entity.IOrder>(new Error('The order has no events.')));
  }

  return S.Do.of<Error, Entity.IOrder>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`,
    method: 'PATCH',
    json: {
      rate: ℚ.toFloat(rate),
      amount: ℚ.toFloat(lastEvent.amountSell)
    },
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>): Promise<Either.Either<Error, void>> => {
    return new Promise<Either.Either<Error, void>>((resolve, reject) => {
      const errorOrOrder = Maybe.Do.of(response)
        .map(it => Either.Right<Error, void>(undefined))
        .orSome(Either.Left<Error, void>(createError('Empty response')));

      return resolve(errorOrOrder);

      function createError(reason: string): Error {
        return new Error(`
** Could not update the order ${order.id} ${order.currencySell}/${order.currencyBuy} **

PUT ${profile.apiUrl}/marketplaceOrders
{
}

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  })).fmap(() => getOrder(profile, order)).value;
}

export function updateOrder2(profile: Entity.IProfile, {order, rate}: {order: Entity.IOrder, rate: ℚ.ℚ}): E.Engine<Message.ApiError | Message.Empty> {
  return compose(
    Maybe.orSome<E.Engine<Message.Empty | Message.ApiError>, E.Engine<Message.ApiError>>(Passthrough({message: new Message.ApiError({description: `${order.id} order cannot be updated.`})})),
    Maybe.map(update),
    Maybe.map<Entity.IOrder, Entity.IOrderEvent>(order => order.events[order.events.length - 1]),
    Entity.isPending
  )(order);

  function update(event: Entity.IOrderEvent): E.Engine<Message.Empty | Message.ApiError> {
    return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.Empty | Message.ApiError>(message => {
      switch(message.type) {
        case Token.Message.Type.TokenResponse:
          const request = Http.Request<void>({
            uri: `${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}`,
            method: 'PATCH',
            json: {
              rate: ℚ.toFloat(rate),
              amount: ℚ.toFloat(event.amountSell)
            },
            headers: {
              Authorization: `Bearer ${message.payload.token}`,
              'User-Agent': Browser.userAgent
            }
          });
          const reply = compose(
            Either.cata<Error, void, E.Engine<Message.ApiError>, E.Engine<Message.Empty>>(
              error => Passthrough({message: new Message.ApiError({description: error.message})}),
              () => compose(
                E.map(() => new Message.Empty()),
                E.fmap(() => Q.Publish2({message: new Message.OrderChanged({id: order.id})}))
              )(Scheduler.Delay2({ms: 1000}))
            ),
            parseResponse(event)
          );
          return E.fmap<Http.Message.ResponseEvent<void>, Message.ApiError | Message.Empty>(reply)(request);;
        case Token.Message.Type.TokenInvalid:
        default:
          return Passthrough({message: new Message.ApiError({description: message.payload.message})});
      }
    })(Token.getToken(profile));
  }

  function parseResponse(event: Entity.IOrderEvent) {
    return <T>(message: Http.Message.ResponseEvent<T>): Either.Either<Error, void> => {
      return Maybe.Do.of<number>(message.payload.incomingMessage.statusCode)
        .map(statusCode => statusCode === 200 ?
          Either.Right<Error, void>(undefined) :
          Either.Left<Error, void>(createError('Invalid status code'))
        )
        .orSome(Either.Left<Error, void>(createError('Empty status code')));

      function createError(reason: string): Error {
        return new Error(stripIndent`
          ** Could not update the order ${order.id} ${order.currencySell}/${order.currencyBuy} **

          PATCH ${profile.apiUrl}/users/${profile.customerId}/orders/${order.id}
          {
            rate: ${ℚ.toFloat(rate)},
            amount: ${ℚ.toFloat(event.amountSell)}
          }

          Error:
          ${reason}

          Status Code:
          ${message.payload.incomingMessage.statusCode}

          Response:
          ${JSON.stringify(message.payload.response, null, 2)}
          `);
        }
    };
  }
}

export function getBalance(profile: Entity.IProfile) {
  return S.of<Error, Entity.IBalance[]>(new Http.HttpCurrencyFairEffect(profile, {
    uri: `${profile.apiUrl}/users/${profile.customerId}/summaries`,
    json: true,
    headers: {
      // Authorization: `Bearer ${authToken}`,
      'User-Agent': Browser.userAgent
    }
  }, (err: Maybe.Maybe<Error>, incomingMessage: Http.HttpIncomingMessage, response: Maybe.Maybe<any>) => {
    return new Promise<Either.Either<Error, Entity.IBalance[]>>((resolve, reject) => {
      const errorOrBalance = Maybe.Do.of(response)
        .map(it => parseResponse<ICFSummary>(it))
        .orSome(Either.Left<Error, ICFSummary>(createError('Empty response')));

      return resolve(Either.map<Error, ICFSummary, Entity.IBalance[]>(parseBalance)(errorOrBalance));

      function parseBalance(summary: ICFSummary): Entity.IBalance[] {
        return summary._embedded.user_summaries.map((summary): Entity.IBalance => {
          return {
            currency: summary._embedded.currency.currencyCode as Currency.ANY,
            available: ℚ.parse(summary.fundsAvailableInfo.amount)
          };
        });
      }

      function parseResponse<T>(response: any): Either.Either<Error, T> {
        const schema = Joi.object({
          _embedded: Joi.object({
            user_summaries: Joi.array().items(Joi.object({
              fundsAvailableInfo: Joi.object({
                amount: Joi.number().required(),
              }).unknown().required(),
              _embedded: Joi.object({
                currency: Joi.object({
                  currencyCode: Joi.string().required()
                }).unknown().required()
              }).unknown().required()
            }).unknown()).required()
          }).unknown().required()
        }).unknown();

        const result = Joi.validate(response, schema);
        return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
      }

      function createError(reason: string): Error {
        return new Error(`
** Could not retrieve the summary for ${profile.username} **

GET ${profile.apiUrl}/users/${profile.customerId}/summaries

Error:
${reason}

Status Code:
${incomingMessage.statusCode}

Response:
${JSON.stringify(response, null, 2)}
        `);
      }
    });
  }));
}

export function getSummary2(profile: Entity.IProfile): E.Engine<Message.ApiError | Message.Summary> {
  return E.fmap<Token.Message.ResponseEvent | Token.Message.InvalidEvent, Message.ApiError | Message.Summary>(message => {
    switch(message.type) {
      case Token.Message.Type.TokenResponse:
        const request = Http.Request<ICFSummary>({
          uri: `${profile.apiUrl}/users/${profile.customerId}/summaries`,
          json: true,
          headers: {
            Authorization: `Bearer ${message.payload.token}`,
            'User-Agent': Browser.userAgent
          }
        });
        const reply = compose(
          Either.cata<Error, Entity.IBalance[], Message.ApiError, Message.Summary>(
            error => new Message.ApiError({description: error.message}),
            summary => new Message.Summary({summary})
          ),
          parseResponse
        );
        return E.map<Http.Message.ResponseEvent<ICFSummary>, Message.ApiError | Message.Summary>(reply)(request);
      case Token.Message.Type.TokenInvalid:
      default:
        return Passthrough({message: new Message.ApiError({description: message.payload.message})});
    }
  })(Token.getToken(profile));

  function parseResponse(message: Http.Message.ResponseEvent<ICFSummary>): Either.Either<Error, Entity.IBalance[]> {
    const errorOrBalance = Maybe.Do.of(message.payload.response)
      .map(it => validateResponse<ICFSummary>(it))
      .orSome(Either.Left<Error, ICFSummary>(createError('Empty response')));

    return Either.map<Error, ICFSummary, Entity.IBalance[]>(parseBalance)(errorOrBalance);

    function parseBalance(summary: ICFSummary): Entity.IBalance[] {
      return summary._embedded.user_summaries.map((summary): Entity.IBalance => {
        return {
          currency: summary._embedded.currency.currencyCode as Currency.ANY,
          available: ℚ.parse(summary.fundsAvailableInfo.amount)
        };
      });
    }

    function validateResponse<T>(response: any): Either.Either<Error, T> {
      const schema = Joi.object({
        _embedded: Joi.object({
          user_summaries: Joi.array().items(Joi.object({
            fundsAvailableInfo: Joi.object({
              amount: Joi.number().required(),
            }).unknown().required(),
            _embedded: Joi.object({
              currency: Joi.object({
                currencyCode: Joi.string().required()
              }).unknown().required()
            }).unknown().required()
          }).unknown()).required()
        }).unknown().required()
      }).unknown();

      const result = Joi.validate(response, schema);
      return !!result.error ? Either.Left<Error, T>(createError(result.error.message)) : Either.Right<Error, T>(response);
    }

    function createError(reason: string): Error {
      return new Error(stripIndent`
        ** Could not retrieve the summary for ${profile.username} **

        GET ${profile.apiUrl}/users/${profile.customerId}/summaries

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

export interface ICFOrders {
  _links: {
    self: {
      href: string
    },
    first: {
      href: string
    },
    last: {
      href: string
    }
  },
  _embedded: {
    orders: ICFOrder[]
  },
  page_count: number,
  page_size: number,
  total_items: number,
  page: number
}

export interface ICFOrder {
  id: number,
  created: string,
  rateInfo: {
    standard: {
      rate: number,
      scale: number
    },
    inverse: {
      rate: number,
      scale: number
    }
  },
  amountInfo: {
    sell: {
      amount: number,
      scale: number
    },
    buy: {
      amount: number,
      scale: number
    }
  },
  statusInfo: {
    status: number,
    message: string
  },
  details: [{
    created: string | null,
    rateInfo: {
      standard: {
        rate: number,
        scale: number
      },
      inverse: {
        rate: number,
        scale: number
      }
    },
    amountInfo: {
      sell: {
        amount: number,
        scale: number
      },
      buy: {
        amount: number | null,
        scale: number
      }
    },
    statusInfo: {
      status: number,
      message: string
    }
  }],
  aqt: any,
  _embedded: {
    currencyFrom: {
      currencyCode: string,
      description: string,
      minimumSellAmount: number,
      _links: {
        self: {
          href: string
        }
      }
    },
    currencyTo: {
      currencyCode: string,
      description: string,
      minimumSellAmount: number,
      _links: {
        self: {
          href: string
        }
      }
    }
  },
  _links: {
    self: {
      href: string
    }
  }
}

interface ICFMarketplaces {
  _embedded: {
    marketplaces: ICFMarketplace[],
  }
  _links: {
    _self: {
      href: string
    }
  },
  total_items: number
}

export interface ICFMarketplace {
  currencyFrom: string,
  currencyTo: string,
  incrementInfo: {
    increment: number,
    scale: number
  },
  limitsInfo: {
    minimumAmount: number,
    maximumAmount: number
  },
  status: 'SUSPENDED' | 'OPEN',
  items: {
    amountInfo: {
      amount: number,
      scale: number
    },
    rateInfo: {
      rate: number,
      scale: number
    },
    type: string
  }[] | null,
  _links?: {
    self: {
      href: string
    }
  }
}

interface ICFQuote {
  currencyFrom: string,
  currencyTo: string,
  type: string,
  amountInfo: {
    amount: number,
    scale: number
  },
  savingsInfo: {
    amount: number,
    scale: number
  },
  currencyFair: {
    transferFee: number,
    rateInfo: {
      rate: number,
      scale: number
    },
    inverseRateInfo: {
      rate: number,
      scale: number
    },
    amountInfo: {
      amount: number,
      scale: number
    }
  },
  bank: {
    transferFee: number,
    rateInfo: {
      rate: number,
      scale: number
    },
    inverseRateInfo: {
      rate: number,
      scale: number
    },
    amountInfo: {
      amount: number,
      scale: number
    }
  }
}

interface ICFError {
  type: string
  title: string
  status: number
  detail: string
  failure_messages: {
    [s: string]: string
  } | void
}

export interface ICFHistory {
  id: number,
  tradeType: string
  tradeMode: string
  rateInfo: {
    rate: number
    scale: number
  }
  statusInfo: {
    status: number
    message: string
  }
  events: {
    id: number
    tradeId: number
    eventType: 'PART_MATCHED' | 'CREATED' | 'UPDATED' | 'CANCELLED' | 'MATCHED'
    amountInfo: {
      buy: {
        amount: number
        scale: number
      },
      sell: {
        amount: number
        scale: number
      }
    },
    rateInfo: {
      rate: number
      scale: number
    },
    created: string
    tradeTime: string
  }[]
  created: string
  updated: string
  _embedded: {
    currencyFrom: {
      currencyCode: string,
      description: string,
      minimumSellAmount: number,
      _links: {
        self: {
          href: string
        }
      }
    }
    currencyTo: {
      currencyCode: string,
      description: string,
      minimumSellAmount: number,
      _links: {
        self: {
          href: string
        }
      }
    }
  }
  _links: {
    self: {
      href: string
    }
  }
}

export interface ICFSummary {
  _links: {
    self: {
      href: string
    }
  },
  _embedded: {
    user_summaries: {
        lastActivity: string,
        pendingDepositInfo: {
          amount: number,
          scale: number
        },
        pendingTransfersInfo: {
          amount: number,
          scale: number
        },
        balanceInfo: {
          amount: number,
          scale: number
        },
        openOrdersInfo: {
          amount: number,
          scale: number
        },
        fundsAvailableInfo: {
          amount: number,
          scale: number
        },
        _embedded: {
          currency: {
            currencyCode: string,
            description: string,
            minimumSellAmount: number,
            _links: {
              self: {
                href: string
              }
            }
          }
        },
        _links: {
          self: {
            href: string
          }
        }
      }[]
  },
  total_items: number
}