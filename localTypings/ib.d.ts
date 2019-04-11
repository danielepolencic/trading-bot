declare module '~ib/index' {
  import {EventEmitter} from 'events';

  interface IEvents {
    on(name: 'error', listener: (err: Error) => void): this
    on(name: 'result', listener: (event: string, args: any[]) => void): this
    on(name: 'accountDownloadEnd', listener: (accountName: string) => void): this
    on(name: 'updateAccountTime', listener: (timeStamp: string) => void): this
    on(name: 'updateAccountValue', listener: (key: string, value: string, currency: string, accountName: string) => void): this
    on(name: 'updatePortfolio', listener: (contract: InteractiveBrokers.IContract, position: number, marketPrice: number, marketValue: number, averageCost: number, unrealizedPNL: number, realizedPNL: number, accountName: string) => void): this
  }

  class InteractiveBrokers extends EventEmitter implements IEvents {
    constructor(options?: InteractiveBrokers.IOptions)
    connect(): this
    disconnect(): this
    reqAccountUpdates(subscribe: boolean, accountCode: string): this
  }

  module InteractiveBrokers {
    export interface IOptions {
      host?: 'string',
      port?: number,
      clientId?: number,
    }

    export interface IContract {}
  }

  export = InteractiveBrokers;
}

declare module 'ib' {
  import alias = require('~ib/index');
  export = alias;
}
