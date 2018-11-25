// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'))

// Browser bar hack
window.scrollTo(0,1)

registerServiceWorker();
