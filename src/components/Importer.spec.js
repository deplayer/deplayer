import React from 'react';
import ReactDOM from 'react-dom';
import Importer from './Importer';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Importer />, div);
  ReactDOM.unmountComponentAtNode(div);
})
