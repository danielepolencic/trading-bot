import * as test from 'tape';
import * as Free from './freer';
import * as Eff from './eff';
import {HKT} from './HKT';

type Action1 = {action: 'action1'};
type Action2 = {action: 'action2'};
type Action3 = {action: 'action3'};
type Actions = Action1 | Action2 | Action3;

const S = Free.freeMonad<HKT<Eff.IsEff, Actions>>(Eff);
const lift = <A>(a: Actions) => Free.liftFree<HKT<Eff.IsEff, Actions>, A>(Eff)(Eff.of<Actions, A>(a));
const run = <A>(ffa: Free.Free<HKT<Eff.IsEff, Actions>, A>): Promise<A> => Free.foldFree<any, any>(Eff, Eff.join(interpreter))(ffa);

function interpreter(effect: Actions): Promise<number> {
  switch(effect.action) {
    case 'action1':
      return Promise.resolve(1);
    case 'action2':
      return Promise.resolve(2);
    default:
      return Promise.resolve(0);
  }
}

test('S should run with a custom interpreter', assert => {
  assert.plan(2);
  const one = lift<number>({action: 'action1'});
  const two = lift<number>({action: 'action2'});

  const result = S.fmap(x => {
    assert.equal(x, 11);
    return S.map((x: number) => x + 1)(two)
  })(S.map((x: number) => x + 10)(one));

  run(result).then(result => assert.equal(result, 3));
});