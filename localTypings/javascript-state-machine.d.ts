declare module '~javascript-state-machine/index' {

  module StateMachine {
    function create(config: StateMachineConfig, target?: StateMachine): StateMachine;

    interface StateMachineConfig {
      initial?: any; // string or { state: 'foo', event: 'setup', defer: true|false }
      events?: StateMachineEventDef[];
      callbacks?: {
          [s: string]: (event?: string, from?: string, to?: string, ...args: any[]) => any;
      };
      target?: StateMachine;
      error?: StateMachineErrorCallback;
    }

    class StateMachine {
        static ASYNC: string;
        current: string;
        is: StateMachineIs;
        can: StateMachineCan;
        cannot: StateMachineCan;
        error: StateMachineErrorCallback;
        transition: StateMachineTransition;
    }

    interface StateMachineEventDef {
        name: string;
        from: string | string[];
        to: string;
    }

    interface StateMachineTransition {
      (): void;
      cancel(): void;
    }

    interface StateMachineIs {
      (state: string): boolean;
    }

    interface StateMachineCan {
      (evt: string): boolean;
    }

    interface StateMachineErrorCallback {
      (eventName?: string, from?: string, to?: string, args?: any[], errorCode?: number, errorMessage?: string, ex?: Error): void; // NB. errorCode? See: StateMachine.Error
    }
  }

  export = StateMachine;
}

declare module 'javascript-state-machine' {
  import alias = require('~javascript-state-machine/index');
  export = alias;
}