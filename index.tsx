import * as Express from 'express';
import * as Frontend from './assets/app';
import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import * as Redis from './redis/connection';
import * as ℚ from './monad/rational';
import * as Currency from './currency';
import * as Joi from 'joi';
import * as CurrencyFair from './currencyFair';
import * as Oanda from './oanda';

import * as Loop from './effect/loop';
import * as App from './app/app';
import {interpreter} from './effect/interpreter';

const dispatch = Loop.run([], interpreter, App);

import * as MarketsCurrencyFair from './reactorCurrencyFairMarkets/markets';
import * as QuotesOanda from './reactorOandaQuotes/quotes';
import * as Accounts from './reactorCurrencyFairOrders/accounts';
import * as Scheduler from './orderScheduler/scheduler';

const schemaProfileCurrencyFair = Joi.object({
  webUrl: Joi.string().required(),
  apiUrl: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  twoFactorSecret: Joi.string().required(),
  customerId: Joi.string().required()
}).unknown().required();

const schemaProfileOanda = Joi.object({
  url: Joi.string().required(),
  token: Joi.string().required(),
  accountId: Joi.string().required()
}).unknown().required();

const schemaProfilesCurrencyFair = Joi.array()
  .items(schemaProfileCurrencyFair.required());

const accountsCurrencyFair = Joi.validate<CurrencyFair.IProfile[]>(JSON.parse(`${process.env.ACCOUNTS_CURRENCY_FAIR}`), schemaProfilesCurrencyFair);
const profileOanda = Joi.validate<Oanda.IProfile>(JSON.parse(`${process.env.OANDA_PROFILE}`), schemaProfileOanda);
const quotesProfileCurrencyFair = Joi.validate<CurrencyFair.IProfile>(JSON.parse(`${process.env.QUOTES_CURRENCY_FAIR_PROFILE}`), schemaProfileCurrencyFair)

if (!!accountsCurrencyFair.error || !!profileOanda.error || !!quotesProfileCurrencyFair.error) {
  console.log('Invalid profiles: ', accountsCurrencyFair.error, profileOanda.error, quotesProfileCurrencyFair.error);
  process.exit(1);
}

dispatch(new App.Message.QuotesOandaMessage({message: new QuotesOanda.Message.AddQuoteRequest({currencyBuy: Currency.GBP, currencySell: Currency.EUR, profile: profileOanda.value})}));
dispatch(new App.Message.QuotesOandaMessage({message: new QuotesOanda.Message.AddQuoteRequest({currencyBuy: Currency.USD, currencySell: Currency.EUR, profile: profileOanda.value})}));
dispatch(new App.Message.QuotesOandaMessage({message: new QuotesOanda.Message.AddQuoteRequest({currencyBuy: Currency.USD, currencySell: Currency.GBP, profile: profileOanda.value})}));

dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.EUR, currencySell: Currency.GBP, profile: quotesProfileCurrencyFair.value})}));
dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.GBP, currencySell: Currency.EUR, profile: quotesProfileCurrencyFair.value})}));
dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.USD, currencySell: Currency.GBP, profile: quotesProfileCurrencyFair.value})}));
dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.GBP, currencySell: Currency.USD, profile: quotesProfileCurrencyFair.value})}));
dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.EUR, currencySell: Currency.USD, profile: quotesProfileCurrencyFair.value})}));
dispatch(new App.Message.MarketplacesCurrencyFairMessage({message: new MarketsCurrencyFair.Message.AddMarketRequest({currencyBuy: Currency.USD, currencySell: Currency.EUR, profile: quotesProfileCurrencyFair.value})}));

dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.GBP, currencySell: Currency.EUR})}));
dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.EUR, currencySell: Currency.GBP})}));
dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.USD, currencySell: Currency.GBP})}));
dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.GBP, currencySell: Currency.USD})}));
dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.EUR, currencySell: Currency.USD})}));
dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddRequest({currencyBuy: Currency.USD, currencySell: Currency.EUR})}));

accountsCurrencyFair.value.forEach(profile => {
  dispatch(new App.Message.AccountsMessage({message: new Accounts.Message.AddAccount({profile})}));
  dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.AddProfile({profile})}));
});

if (process.env.NODE_ENV === 'live') {
  setTimeout(() => {
    dispatch(new App.Message.OrderSchedulerMessage({message: new Scheduler.Message.Init()}));
  }, 2 * 60 * 1000);
}

const app = Express();

app.use('/public', Express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Forex</title>
        <link rel="stylesheet" href="/public/style.css" />
      </head>

      <body>
        <div id="root">Please wait...</div>
      </body>

      <script src="/public/bundle.js"></script>
    </html>
  `);
});

const listeners = {} as {[name: string]: any};

app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const id = `${+Date.now()}`;

  res.on('close', () => {
    delete listeners[id];
  });

  listeners[id] = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  fetch();
});

function fetch() {
  if (Object.keys(listeners).length === 0) return;

  Redis.connection.pipeline()
    .lrange('CurrencyFairQuotes:GBP:EUR', -20, -1)
    .lrange('CurrencyFairQuotes:EUR:GBP', -20, -1)
    .lrange('CurrencyFairQuotes:USD:GBP', -20, -1)
    .lrange('CurrencyFairQuotes:GBP:USD', -20, -1)
    .lrange('CurrencyFairQuotes:USD:EUR', -20, -1)
    .lrange('CurrencyFairQuotes:EUR:USD', -20, -1)
    .lrange('OandaQuotes:USD:EUR', -30, -1)
    .lrange('OandaQuotes:USD:GBP', -30, -1)
    .lrange('OandaQuotes:GBP:EUR', -30, -1)
    .get('state')
    .exec((err, results) => {
      if (!!err) return;

      const state = {
        'CurrencyFairQuotes:GBP:EUR': !!results[0][0] ? [] : results[0][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'CurrencyFairQuotes:EUR:GBP': !!results[1][0] ? [] : results[1][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'CurrencyFairQuotes:USD:GBP': !!results[2][0] ? [] : results[2][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'CurrencyFairQuotes:GBP:USD': !!results[3][0] ? [] : results[3][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'CurrencyFairQuotes:USD:EUR': !!results[4][0] ? [] : results[4][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'CurrencyFairQuotes:EUR:USD': !!results[5][0] ? [] : results[5][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'OandaQuotes:USD:EUR': !!results[6][0] ? [] : results[6][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'OandaQuotes:USD:GBP': !!results[7][0] ? [] : results[7][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'OandaQuotes:GBP:EUR': !!results[8][0] ? [] : results[8][1].map((it: any) => JSON.parse(it)).map((it: any) => ({rate: ℚ.toFloat(it.rate), label:true, time: Number.parseInt(it.time, 10)})),
        'state': !!results[9][0] ? [] : JSON.parse(results[9][1])
      };
      // const state = {
      //   'CurrencyFairQuotes:GBP:EUR': Array.from({length: 20}, (v, k) => ({rate: Math.random() * 100, label: true, time: +Date.now() - k})),
      //   'CurrencyFairQuotes:EUR:GBP': Array.from({length: 20}, (v, k) => ({rate: Math.random() * 100, label: true, time: +Date.now() - (k * 10)})),
      // };

      Object.keys(listeners).forEach(name => {
        listeners[name](state);
      });
    });
}

setInterval(fetch, 10 * 1000);

app.listen(4000, () => console.log('http://localhost:4000'));

process.on('unhandledRejection', (reason: any) => {
  console.error('unhandledRejection: ', reason);
});