import * as Maybe from './maybe';

export class ℚ {
  private constructor(private rational: 'RATIONAL') {}
}

export function inj<A>(a: string): ℚ {
  return (a as any) as ℚ;
}

export function prj<A>(fa: ℚ): string {
  return (fa as any) as string;
}

export function parse(value: number | string): ℚ {
  const [, fractional] = `${value}`.split('.');
  const length = !!fractional ? fractional.length : 0;
  const integer = parseInt(`${value}`.replace(/\.|\-|\+/gi, ''), 10);
  const sign = `${value}`[0] === '-' ? '-' : '+';
  return inj(`${sign}${integer}/${Math.pow(10, length)}`);
}

export function multiplyBy(bFraction: ℚ | number): (aFraction: ℚ) => ℚ {
  const b = isNumber(bFraction) ? extract(parse(bFraction as number)) : extract(bFraction as ℚ);
  return (aFraction: ℚ): ℚ => {
    const a = extract(aFraction);
    return toString(simplify({
      sign: a.sign * b.sign,
      numerator: a.numerator * b.numerator,
      denominator: a.denominator * b.denominator
    }));
  };
}

export function divideBy(bFraction: ℚ | number): (aFraction: ℚ) => ℚ {
  const b = isNumber(bFraction) ? extract(parse(bFraction as number)) : extract(bFraction as ℚ);
  return (aFraction: ℚ): ℚ => {
    const a = extract(aFraction);
    return toString(simplify({
      sign: a.sign * b.sign,
      numerator: a.numerator * b.denominator,
      denominator: a.denominator * b.numerator
    }));
  };
}

export function addTo(bFraction: ℚ | number): (aFraction: ℚ) => ℚ {
  const b = isNumber(bFraction) ? extract(parse(bFraction as number)) : extract(bFraction as ℚ);
  return (aFraction: ℚ): ℚ => {
    const a = extract(aFraction);
    const numerator = (a.sign * a.numerator * b.denominator) + (b.sign * b.numerator * a.denominator);
    return toString(simplify({
      sign: Math.sign(numerator),
      numerator: Math.abs(numerator),
      denominator: a.denominator * b.denominator
    }));
  };
}

export function subtractTo(bFraction: ℚ | number): (aFraction: ℚ) => ℚ {
  const b = isNumber(bFraction) ? extract(parse(bFraction as number)) : extract(bFraction as ℚ);
  return (aFraction: ℚ): ℚ => {
    const a = extract(aFraction);
    const numerator = (a.sign * a.numerator * b.denominator) + (-1 * b.sign * b.numerator * a.denominator);
    return toString(simplify({
      sign: Math.sign(numerator),
      numerator: Math.abs(numerator),
      denominator: a.denominator * b.denominator
    }));
  };
}

export function inverse(aFraction: ℚ): ℚ {
  const a = extract(aFraction);
  return toString({
    sign: a.sign,
    numerator: a.denominator,
    denominator: a.numerator
  });
}

export function round(precision: number) {
  return (aFraction: ℚ): ℚ => {
    const a = extract(aFraction);
    return parse(rounder(a.numerator / a.denominator, precision));
  };
}

export function isGreaterThan(aFraction: ℚ): (bFraction: ℚ) => Maybe.Maybe<ℚ> {
  const a = extract(aFraction);
  return (bFraction: ℚ): Maybe.Maybe<ℚ> => {
    const b = extract(bFraction);
    return a.sign * a.numerator * b.denominator > a.denominator * b.numerator * b.sign ?
        Maybe.of(aFraction) : Maybe.Nothing;
  };
}

export function isLesserThan(aFraction: ℚ): (bFraction: ℚ) => Maybe.Maybe<ℚ> {
  const a = extract(aFraction);
  return (bFraction: ℚ): Maybe.Maybe<ℚ> => {
    const b = extract(bFraction);
    return a.sign * a.numerator * b.denominator < a.denominator * b.numerator * b.sign ?
        Maybe.of(aFraction) : Maybe.Nothing;
  };
}

export function min(aFraction: ℚ): (bFraction: ℚ) => ℚ {
  const a = extract(aFraction);
  return (bFraction: ℚ): ℚ => {
    const b = extract(bFraction);
    return a.sign * a.numerator * b.denominator > b.sign * b.numerator * a.denominator ?
      bFraction : aFraction;
  }
}

export function abs(aFraction: ℚ): ℚ {
  const a = extract(aFraction);
  return toString({
    sign: 1,
    numerator: a.numerator,
    denominator: a.denominator
  });
}

export function toFloat(aFraction: ℚ): number {
  return (new Function(`return ${aFraction}`) as any)();
}

function toString(fraction: IFraction): ℚ {
  return inj(`${sign(fraction.sign)}${fraction.numerator}/${fraction.denominator}`);
}

function sign(num: number): string {
  return num >= 0 ? '+' : '-';
}

function extract(fraction: ℚ): IFraction {
  const sign = `${prj(fraction)[0]}1`;
  const [numerator, denominator] = prj(fraction).slice(1).split('/');
  return {
    sign: parseInt(sign, 10),
    numerator: parseInt(numerator, 10),
    denominator: parseInt(denominator, 10),
  };
}

function simplify(f: IFraction): IFraction {
  const gcd = greatCommonDivisor(f.numerator, f.denominator);
  return {
    sign: f.sign,
    numerator: f.numerator / gcd,
    denominator: f.denominator / gcd
  };
}

function greatCommonDivisor(a: number, b: number): number {
  return b ? greatCommonDivisor(b, a % b) : a;
}

function rounder(value: number, decimals: number): number {
  return Number(`${Math.round(<any>`${value}e${decimals}`)}e-${decimals}`);
}

interface IFraction {
  sign: number
  numerator: number
  denominator: number
}

function isNumber(value: any): boolean {
  return ({}).toString.call(value) === '[object Number]';
}