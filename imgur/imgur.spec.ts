import * as test from 'tape';
import * as Mitm from 'mitm';
import * as Imgur from './index';
import * as Responses from './responses';

const profile: Imgur.IProfile = {
  url: 'https://api.imgur.com',
  clientId: '698acaa8ed654cb',
  clientSecret: '5c5001cdb464a577d99fca9f21e3aa7b62d74783',
  pin: '9c472ad5b6',
  refreshToken: 'bcec3c6f8e8746da892c01abd1066d18878df7bd'
};

test('it should get the access and refresh token from a pin', assert => {
  assert.plan(5);
  const mitm = Mitm();

  mitm.on('request', (req, res) => {
    assert.equal(req.url, '/oauth2/token');
    assert.equal(req.method, 'POST');
    res.writeHead(200);
    res.end(Responses.accessToken);
  });

  Imgur.getToken(profile).then(token => {
    assert.equal(token.accessToken, '86a88c7c32b2b18e52d6d1fe2615a1df50f3b088');
    assert.equal(token.refreshToken, 'bcec3c6f8e8746da892c01abd1066d18878df7bd');
    assert.equal(token.accountUsername, 'danielepolencic');
    mitm.disable();
    assert.end();
  })
  .catch(assert.fail);
});

test('it should get the access token from a refresh token', assert => {
  assert.plan(5);
  const mitm = Mitm();

  mitm.on('request', (req, res) => {
    assert.equal(req.url, '/oauth2/token');
    assert.equal(req.method, 'POST');
    res.writeHead(200);
    res.end(Responses.refreshToken);
  });

  Imgur.refreshToken(profile).then(token => {
    assert.equal(token.accessToken, '78caed075ab65bd6204aae1b9efdf1ad7289e5d5');
    assert.equal(token.refreshToken, 'fb9841a1d8bab439a2e02bf871c6d60b5b4a61f9');
    assert.equal(token.accountUsername, 'danielepolencic');
    mitm.disable();
    assert.end();
  })
  .catch(assert.fail);
});

test('it should upload an image', assert => {
  assert.plan(3);
  const refreshToken = () => Promise.resolve<Imgur.IToken>({
    accessToken: 'a1',
    refreshToken: 'r1',
    accountUsername: 'dan'
  });
  const mitm = Mitm();

  mitm.on('request', (req, res) => {
    assert.equal(req.url, '/3/upload');
    assert.equal(req.method, 'POST');
    res.writeHead(200);
    res.end(Responses.uploadSuccessful);
  });

  Imgur.upload(refreshToken)(profile, {file: 'a12ef===', albumId: 'a1', description: 'bla'}).then(image => {
    assert.equal(image.link, 'http://i.imgur.com/WA3nwhv.jpg');
    mitm.disable();
    assert.end();
  })
  .catch(assert.fail);
});