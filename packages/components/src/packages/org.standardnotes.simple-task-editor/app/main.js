import React from 'react';
import ReactDOM from 'react-dom';
import Tasks from '@Components/Tasks';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="sn-component">
        <Tasks />
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.body.appendChild(document.createElement('div'))
);
