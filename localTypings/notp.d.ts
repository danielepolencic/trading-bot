declare module '~notp/index' {
  export module hotp {}
  export module totp {
    function gen(key: string, options?: {time: number}): string
    function verify(token: string, key: string, options?: {time?: number, window?: number}): boolean
  }
}

declare module 'notp' {
  import alias = require('~notp/index');
  export = alias;
}