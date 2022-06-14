import React from 'react';
import ReactDOM from 'react-dom';
import Home from './components/Home';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Home />
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.body.appendChild(document.createElement('div'))
);
