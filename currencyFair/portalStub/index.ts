import {Router} from 'express';
import {urlencoded} from 'body-parser';
import * as cookieParser from 'cookie-parser';
import {totp} from 'notp';
import {decode} from 'thirty-two';
import {create, StateMachine} from 'javascript-state-machine';

export const currencyFairWebsite = Router();

class State {
  static INIT = 'INIT'
  static VERIFIED = 'VERIFIED'
  static AUTHORISED = 'AUTHORISED'
  static AUTHENTICATED = 'AUTHENTICATED'
  static LOGGED_IN = 'LOGGED_IN'
  static ANY = '*'
}

interface LoginStateMachine extends StateMachine {
  login(username: string, password: string): void
  verify(verifyCode: string): void
  authenticate(): void
  complete(): void
  reset(): void
}

const fsm = <LoginStateMachine>create({
  initial: State.INIT,
  error: () => {},
  events: [
    {name: 'login', from: State.INIT, to: State.VERIFIED},
    {name: 'verify', from: State.VERIFIED, to: State.AUTHORISED},
    {name: 'authenticate', from: State.AUTHORISED, to: State.AUTHENTICATED},
    {name: 'complete', from: State.AUTHENTICATED, to: State.LOGGED_IN},
    {name: 'reset', from: State.ANY, to: State.INIT}
  ],
  callbacks: {
    onbeforelogin: (event: string, from: string, to: string, username: string, password: string) => {
      return username === 'daniele@uasabi.com' && password === 'test123';
    },
    onbeforeverify: (event: string, from: string, to: string, verifyCode: string) => {
      return !!totp.verify(verifyCode, decode('K4AB4BPLOYVQBP65'));
    }
  }
});

currencyFairWebsite.use(cookieParser());
currencyFairWebsite.use(urlencoded({extended: true}));

currencyFairWebsite.get('/login/login', (req, res) => {
  if (fsm.is(State.VERIFIED)) {
    return res.redirect(302, '/auth/challenge/twofactor');
  }

  res.send(`
  <form class="form-horizontal" name="login-form" method="post" action="/login/login">
    <input type="text" placeholder="Username/Email Address" name="email" value="">
    <input autocomplete="off" type="password" placeholder="Password" name="password" value="">
    <button class="btn btn-large btn-block btn-primary" type="submit">Sign in</button>
  </form>
  `);
});

currencyFairWebsite.post('/login/login', (req, res) => {
  fsm.login(req.body.email, req.body.password);
  res.redirect(303, '/login/login');
});

currencyFairWebsite.get('/auth/challenge/twofactor', (req, res) => {
  if (!fsm.is(State.VERIFIED)) {
    return res.redirect(302, '/login/login');
  }

  res.send(`
  <form method="post">
    <input class="span6" type="text" name="token" value="" autocomplete="off">
    <input type="checkbox" name="rememberme" value="true" checked="checked">
    <a id="panel2-verify" class="btn btn-medium btn-primary form-continue" href="javascript:void(0);">Verify</a>
    <a class="btn" href="/login/login">Cancel</a>
  </form>

  <script>
    document.getElementById('panel2-verify').addEventListener('click', function (event) {
      var xhr = new XMLHttpRequest();

      xhr.open('POST', encodeURI('/auth/challenge/twofactor/verify'));
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onload = function() {
        if (!xhr.responseText) {
          return window.location.href = xhr.getResponseHeader("X-CFRedirect");
        }

        var errorMessage = document.createTextNode(JSON.parse(xhr.responseText).message);
        document.querySelector('body').appendChild(errorMessage);
      };
      xhr.send(encodeURI('token=' + document.querySelector('[name="token"]').value));
    });
  </script>
  `)
});

currencyFairWebsite.get('/auth/challenge/twofactor/verify', (req, res) => {
  if (fsm.is(State.AUTHORISED)) {
    res.setHeader('X-CFRedirect', '/login/complete/123');
    return res.send();
  }

  return res.json({
    statusCode: 2,
    message: 'Incorrect code - please try again.'
  });
});

currencyFairWebsite.post('/auth/challenge/twofactor/verify', (req, res) => {
  fsm.verify(req.body.token);
  res.redirect(302, '/auth/challenge/twofactor/verify');
});

currencyFairWebsite.get('/login/complete/:token', (req, res) => {
  fsm.authenticate();

  if (!fsm.is(State.AUTHENTICATED)) {
    return res.redirect(302, '/auth/challenge/twofactor');
  }

  fsm.complete();
  res.cookie('apiToken', '123');
  res.redirect(302, '/exchange');
});

currencyFairWebsite.get('/exchange', (req, res) => {
  if (!fsm.is(State.LOGGED_IN)) {
    return res.redirect(302, '/login/login');
  }

  res.send(`
    <div class="page-header">
      <h1>Exchange Funds</h1>
    </div>
  `);
});

currencyFairWebsite.get('/login/status', (req, res) => {
  res.json({
    sessionAlive: fsm.is(State.LOGGED_IN),
    customerId: fsm.is(State.LOGGED_IN) ? '34567' : null
  })
})

currencyFairWebsite.get('/logout/logout', (req, res) => {
  fsm.reset();
  res.send('<h1>Logged out</h1>');
});