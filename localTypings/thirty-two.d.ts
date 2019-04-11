declare module '~thirty-two/index' {
  export function encode(value: string): string
  export function decode(value: string): string
}

declare module 'thirty-two' {
  import alias = require('~thirty-two/index');
  export = alias;
}