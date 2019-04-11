import * as Horseman from 'node-horseman';
import * as Base32 from 'thirty-two';
import * as OneTimePassword from 'notp';
import * as Browser from '../config/browser';
import * as CurrencyFairEntity from './entity';
import * as Imgur from '../imgur';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';
import * as fs from 'fs';

interface ICache {
  [name: string]: Horseman
}

const cache: ICache = {};

function uploadWhenScreenshot(fileName: string, description: string): () => Promise<string> {
  return () => fs.existsSync(`${fileName}`) ?
    Imgur.uploadNow({fileName, description}).then(image => image.link) : Promise.resolve('nope');
}

export function login(profile: CurrencyFairEntity.IProfile): Promise<void> {
  const horseman = getInstance(profile);
  const url: Promise<string> = horseman
    .open(`${profile.webUrl}/exchange`)
    .type('[name="email"]', profile.username)
    .type('[name="password"]', profile.password)
    .click('[name="login-form"] button')
    .waitForNextPage()
    .url();

  return url.then(url => {
    if (url !== `${profile.webUrl}/auth/challenge/twofactor`) return Promise.resolve();
    return complete2Factor(horseman, generateVerifyCode(profile.twoFactorSecret));
  })
  .then(() => horseman.waitForSelector('.page-header h1'))
  .catch((err: Error) => {
    console.log('Error', err);
    const id = `${+Date.now()}.png`;
    return horseman.screenshot(id)
      .then(uploadWhenScreenshot(id, err.message))
      .then(link => Promise.reject(new Error(`
Can't log in. Screenshot: ${link}
      `.trim())));
  });
}

export function logout(profile: CurrencyFairEntity.IProfile): Promise<void> {
  const horseman = getInstance(profile);
  return horseman.open(`${profile.webUrl}/logout/logout`)
  .catch((err: Error) => {
    const id = `${+Date.now()}.png`;
    return horseman.screenshot(id)
      .then(uploadWhenScreenshot(id, err.message))
      .then(link => Promise.reject(new Error(`
Can't log out. Screenshot: ${link}
      `.trim())));
  });
}

function retrieveApiToken(profile: CurrencyFairEntity.IProfile): Promise<Maybe.Maybe<string>> {
  const horseman = getInstance(profile);
  return horseman.cookies()
    .then((cookies: ICookie[]) => {
      const cookie = Maybe.of<ICookie>(cookies.find(it => it.name === 'apiToken'));
      return Maybe.map((cookie: ICookie) => cookie.value)(cookie);
    })
    .catch((err: Error) => {
      const id = `${+Date.now()}.png`;
      return horseman.screenshot(id)
        .then(uploadWhenScreenshot(id, err.message))
        .then(link => {
          return destroy(profile).then(() => Promise.reject(new Error(`
Can't retrieve the api token. Screenshot: ${link}
          `.trim())));
        });
    });
}

let currentQueue: Promise<any> = Promise.resolve(undefined);
export function getApiToken(profile: CurrencyFairEntity.IProfile): Promise<Either.Either<Error, string>> {
  currentQueue = currentQueue
    .then(() => loginStatus(profile))
    .then(loginStatus => {
      return Maybe.Do.of(loginStatus)
        .map(customerId => () => Promise.resolve(customerId))
        .orSome(() => login(profile))();
    })
    .then(() => retrieveApiToken(profile))
    .catch(err => {
      console.log('ERROR with horseman: ', err);
      return Maybe.Nothing
    });

  return currentQueue.then((maybeToken: Maybe.Maybe<string>) => {
    return Maybe.Do.of(maybeToken)
      .map(token => () => Promise.resolve(Either.Right<Error, string>(token)))
      .orSome(() => Promise.resolve(Either.Left<Error, string>(new Error(`No luck with tokens :(`))))();
  });
}

export function destroy(profile: CurrencyFairEntity.IProfile): Promise<void> {
  const horseman = getInstance(profile);
  return horseman.cookies([]).close().then(() => {
    delete cache[profile.username];
  });
}

export function loginStatus(profile: CurrencyFairEntity.IProfile): Promise<Maybe.Maybe<string>> {
  const horseman = getInstance(profile);
  return horseman.open(`${profile.webUrl}/login/status`)
    .text('pre')
    .then(JSON.parse)
    .then((status: ICurrencyFairLoginStatus) => {
      return status.sessionAlive ? Maybe.of(status.customerId) : Maybe.Nothing;
    })
    .catch((err: Error) => {
      const id = `${+Date.now()}.png`;
      return horseman.screenshot(id)
        .then(uploadWhenScreenshot(id, err.message))
        .then(link => Promise.reject(new Error(`
Can't retrieve the login status. Screenshot: ${link}
        `.trim())));
    });
}

export function destroyAll(): Promise<void> {
  return Promise.all(Object.keys(cache).map(key => {
    cache[key].cookies([]).close().then(() => {
      delete cache[key];
    });
  })).then(() => undefined);
}

function complete2Factor(horseman: Horseman, verifyCode: string): Promise<void> {
  return horseman
    .type('[name="token"]', verifyCode)
    .click('[name="rememberme"]')
    .click('#panel2-verify')
    .waitForNextPage();
}

function generateVerifyCode(token: string): string {
  return OneTimePassword.totp.gen(Base32.decode(token));
}

function getInstance(profile: CurrencyFairEntity.IProfile) {
  const username = profile.username.replace(/[^a-z]/gi, '');
  if (!(username in cache)) {
    const horseman = new Horseman({
      loadImages: false,
      injectJquery: false,
      injectBluebird: false,
      cookiesFile: `./cookies/${username}`,
      timeout: 20 * 1000,
      ignoreSSLErrors: true
    });
    // horseman.userAgent(Browser.userAgent); TODO: fix
    enableAdBlocker(horseman);
    cache[username] = horseman;
  }
  return cache[username];
}

function enableAdBlocker(horseman: Horseman): void {
  horseman.at('resourceRequested', function(requestData, networkRequest) {
    const rules = [
      /addroll\.com/,
      /eum-appdynamics\.com/,
      /adrum-ext\.01e03b21011e011faefb2907e8aac895\.js/,
      /adnxs\.com/,
      /bidswitch\.net/,
      /bat\.bing\.com/,
      /bat\.r\.msn\.com/,
      /doubleclick\.net/,
      /connect\.facebook\.net/,
      /facebook\.com/,
      /googleadservices\.com/,
      /google-analytics\.com/,
      /googletagmanager\.com/,
      /casalemedia\.com/,
      /idsync\.rlcdn\.com/,
      /cdn\.mxpnl\.com/,
      /mixpanel\.com/,
      /openx\.net/,
      /currencyfair\.postaffiliatepro\.com/,
      /quantserve\.com/,
      /ads\.yahoo\.com/,
      /pixel\.rubiconproject\.com/,
      /analytics\.twitter\.com/,
      /dev\.visualwebsiteoptimizer\.com/,
    ];

    if (rules.some(function (rule) {return rule.test(requestData.url)})) {
      networkRequest.abort();
    }
  });
}

interface ICookie {
  domain: string
  httponly: boolean
  name: string
  path: string
  secure: boolean
  value: string
}

interface ICurrencyFairLoginStatus {
  sessionAlive: boolean,
  customerId: string
}