import * as test from 'tape';
import * as Portal from './portal';
import * as PortalStub from './portalStub';
import * as express from 'express';
import * as Http from 'http';
import * as CurrencyFairEntity from './entity';
import * as Maybe from '../monad/maybe';
import * as Either from '../monad/either';

const app = express();
let server: Http.Server;
app.use(PortalStub.currencyFairWebsite);

const profile: CurrencyFairEntity.IProfile = {
  webUrl: 'http://localhost:4567',
  apiUrl: '',
  username: 'daniele@uasabi.com',
  password: 'test123',
  twoFactorSecret: 'K4AB4BPLOYVQBP65',
  customerId: '190478'
};

test('setup', (t) => {
  server = app.listen(4567, t.end);
});

test('it should log in', (t) => {
  t.plan(1);
  setup();

  Portal.login(profile)
    .then(t.pass.bind(null, 'ok'))
    .catch(t.fail);
});

test('it should retrieve a session', t => {
  t.plan(1);
  setup();

  Portal.getApiToken(profile)
    .then(errorOrSession => Either.cata(
      (error: Error) => t.fail(error.message),
      session => t.equal(session, '123'))
      (errorOrSession));
});

test('it should retrieve a logged in status', (t) => {
  t.plan(1);
  setup();

  Portal.login(profile)
    .then(() => Portal.loginStatus(profile))
    .then(loginStatus => Maybe.map(customerId => t.equal(customerId, '34567'))(loginStatus))
    .catch(t.fail);
});

test('it should retrieve a logged out status', (t) => {
  t.plan(1);
  setup();

  Portal.loginStatus(profile)
    .then(loginStatus => Maybe.map(() => t.fail())(loginStatus))
    .then(() => t.pass())
    .catch(t.fail);
});

test('it should destroy all phantom instances', (t) => {
  Portal.login(profile)
    .then(() => Portal.destroyAll())
    .catch(t.fail)
    .then(() => t.end());
});

test('teardown', (t) => {
  server.close(t.end);
});

function setup(): Promise<void> {
  return Portal.logout(profile).then(() => Portal.destroy(profile));
}