declare module '~node-horseman/index' {
  class Horseman extends Promise<any> {
    constructor(options?: {
      clientScripts?: string[],
      timeout?: number,
      interval?: number,
      port?: number,
      loadImages?: boolean,
      switchToNewTab?: boolean,
      cookiesFile?: string,
      ignoreSSLErrors?: boolean,
      sslProtocol?: string,
      webSecurity?: boolean,
      injectJquery?: boolean,
      injectBluebird?: boolean,
      bluebirdDebug?: boolean,
      proxy?: string,
      proxyType?: string,
      proxyAuth?: string,
      phantomPath?: string,
      debugPort?: number,
      debugAutorun?: boolean
    });

    open(url: string): Horseman
    type(selector: string, value: string): Horseman
    click(selector: string): Horseman
    close(): Horseman
    screenshot(filename: string): Horseman
    waitForNextPage(): Horseman
    url(): Horseman
    waitForSelector(selector: string): Horseman
    wait(ms: number): Horseman
    cookies(): Horseman
    cookies(cookies: {}[] | string): Horseman
    on(event: string, callback: (requestData: RequestData, networkRequest: NetworkRequest) => void): Horseman
    at(event: string, callback: (requestData: RequestData, networkRequest: NetworkRequest) => void): Horseman
    text(selector: string): Horseman
    tap(fn: (...args: any[]) => void): Horseman
    userAgent(name: string): Horseman
  }

  class RequestData {
    id: number
    method: string
    url: string
    time: Date
    headers: Header[]
  }

  class NetworkRequest {
    abort(): void
    changeUrl(newUrl: string): void
    setHeader(key: string, value: any): void
  }

  class Header {
    name: string
    value: string
  }

  module Horseman {}

  export = Horseman;
}

declare module 'node-horseman' {
  import alias = require('~node-horseman/index');
  export = alias;
}
