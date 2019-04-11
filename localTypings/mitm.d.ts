declare module '~mitm/index' {
  import * as Net from 'net';
  import * as Http from 'http';
  import * as Event from 'events';
  import * as Express from 'express';

  type REQUEST = 'request';
  type CONNECTION = 'connection';
  type CONNECT = 'connect';

  class MitmInstance extends Event.EventEmitter {
    disable(): void
    on(event: REQUEST, fn: (request: Http.IncomingMessage, response: Http.ServerResponse) => void): this
    on(event: REQUEST, fn: Express.IRouter<any>): this
    on(event: CONNECT | CONNECTION, fn: (socket: Socket, options?: {port: number, host: string} | {path: string}) => void): this
    once(event: REQUEST, fn: (request: Http.IncomingMessage, response: Http.ServerResponse) => void): this
    once(event: REQUEST, fn: Express.IRouter<any>): this
    once(event: CONNECT | CONNECTION, fn: (socket: Socket, options?: {port: number, host: string} | {path: string}) => void): this
    addListener(event: REQUEST, fn: (request: Http.IncomingMessage, response: Http.ServerResponse) => void): this
    addListener(event: REQUEST, fn: Express.IRouter<any>): this
    addListener(event: CONNECT | CONNECTION, fn: (socket: Socket, options?: {port: number, host: string} | {path: string}) => void): this
  }

  class Socket extends Net.Socket {
    bypass(): void
  }

  function Mitm(): MitmInstance

  module Mitm {}

  export = Mitm;
}

declare module 'mitm' {
  import alias = require('~mitm/index');
  export = alias;
}
