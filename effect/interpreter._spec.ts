import * as test from 'tape';
import * as Interpreter from './interpreter';
import * as S from './system';
import * as Either from '../monad/either';
import * as Effect from './defaultEffects';
import {Noop, Empty} from './message';
import * as Glue from './superglue';

class GenericEffect {
  constructor(public readonly name: string) {}
}

test('it should parse an ast', assert => {
  assert.plan(1);
  const result: any = S.run(Interpreter.interpreter({}), Effect.None());

  (result as Promise<void>)
    .catch(() => assert.fail())
    .then(message => assert.deepEqual(message, Either.Right({type: Effect.NONE})));
});

test('it should use superglue', assert => {
  assert.plan(1);
  const result: any = S.run(Interpreter.interpreter({}), Glue.Superglue(Noop()));

  (result as Promise<void>)
    .catch(() => assert.fail())
    .then(message => assert.deepEqual(message, [Either.Right(new Empty())]));
});

test(assert => {
  process.exit(1);
  assert.end();
});