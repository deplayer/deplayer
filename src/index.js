import { fetchPlaylist } from './dat/archive-fetcher';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

fetchPlaylist('dat://ef9f692c003c6491199842ff467d52dc7800a27a87126117db3295b55b48f882')

ReactDOM.render(<App />, document.getElementById('root'));
