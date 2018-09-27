// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

let files = []

if (localStorage.getItem('files')) {
  files = JSON.parse(localStorage.getItem('files'))
}

ReactDOM.render(<App files={files} />, document.getElementById('root'));
registerServiceWorker();
