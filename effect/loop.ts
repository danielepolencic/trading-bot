import * as Actor from './actor';
import * as S from './system';
import * as Effect from './defaultEffects';
import {IMessage, Type} from './message';
import * as Redis from '../redis/connection';

export interface IApp<Props, M extends Actor.IMessage> {
  Init: (...args: any[]) => S.System<any, Actor.State<Props>>
  Update: (state: Actor.State<Props>, message: M) => [Actor.State<Props>, S.System<any, M>]
  Subscriptions: (state: Actor.State<Props>) => S.System<any, M>
}

const FPS = 30;

export function run<Props, M extends Actor.IMessage>(queue: M[], interpreter: Function, app: IApp<Props, M>) {
  let currentState: Actor.State<Props> | void = undefined;

  S.run(
    interpreter({}),
    S.map((state: Actor.State<Props>) => {
      currentState = state;
      setInterval(innerloop, 1000 / FPS)
    })(app.Init())
  );

  function innerloop() {
    if (currentState === undefined) {
      console.log('Current state is undefined');
      return;
    }

    const currentQueue = queue.slice(0).filter(rejectNone).filter(rejectEmpty);
    queue = [];

    currentQueue.forEach(message => {
      const [state, effect] = app.Update((currentState as Actor.State<Props>), message);
      currentState = state;
      Redis.connection.set('state', JSON.stringify(currentState));

      S.run(
        interpreter({}),
        S.bimap<any, M, any, void>(
          error => console.log('error parsing Effect', error),
          message => queue.push(message))
          (effect)
      );
    });

    S.run(
      interpreter({id: generateUuid()}),
      S.bimap<any, M, any, void>(
        error => undefined,
        message => queue.push(message))
        (app.Subscriptions(currentState))
    );
  }

  return (message: M) => {
    queue.push(message);
  };
}

function generateUuid() {
  return Math.random().toString(36).substring(7);
}

function rejectNone(message: any): boolean {
  return (message.payload && message.payload.message) ? rejectNone(message.payload.message) : message.type !== Effect.NONE;
}

function rejectEmpty(message: IMessage): boolean {
  return (message.payload && message.payload.message) ? rejectEmpty(message.payload.message) : (message.type !== Type.Empty)
}