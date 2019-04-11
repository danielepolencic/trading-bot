import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as App from './app';

declare var EventSource: any;

const source = new EventSource('/stream');

source.addEventListener('message', function(e: any) {
  const state = JSON.parse(e.data);
  ReactDOM.render(
    <App.App state={state}/>,
    document.getElementById('root') as HTMLElement
  );
}, false)