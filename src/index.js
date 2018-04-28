import { fetchPlaylist } from './dat/archive-fetcher';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const datBase = 'dat://ef9f692c003c6491199842ff467d52dc7800a27a87126117db3295b55b48f882'

fetchPlaylist(datBase)

let files = []

if (localStorage.getItem('files')) {
  files = JSON.parse(localStorage.getItem('files'))
}

ReactDOM.render(<App urlBase={datBase} files={files} />, document.getElementById('root'));
registerServiceWorker();
