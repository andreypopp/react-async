import Promise from 'bluebird';
import React from 'react';
import axios from 'axios';
import ReactMount from 'react/lib/ReactMount';
import {Async} from '../../src';
import Rx from 'rx';

ReactMount.allowFullPageRender = true;

function get(url) {
  return {
    id: url,
    keepData: true,
    start() {
      return Rx.Observable.fromPromise(axios.get(url).then(response => response.data));
    }
  };
}

function AppObservables({name}) {
  return {
    message: get(`http://localhost:3000/api/message?name=${name}`)
  };
}

@Async(AppObservables)
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {name: 'Andrey'};
  }

  componentDidMount() {
    Rx.Observable.interval(1000).forEach(() => {
      this.setState({name: this.state.name + 1});
    });
  }

  render() {
    let {message} = this.props;
    let {name} = this.state;
    return (
      <html>
        <head>
        </head>
        <body>
          <div>{message ? message.message : 'Loading...'}</div>
          <Nested name={this.state.name} />
          <Timer />
        </body>
      </html>
    );
  }
}

@Async
class Nested extends React.Component {

  static observe({name}) {
    return {
      message: get(`http://localhost:3000/api/message?name=${name}`)
    };
  }

  render() {
    let {message} = this.props;
    return <div>{message ? message.message : 'Loading...'}</div>
  }
}

@Async
class Timer extends React.Component {

  static observe() {
    return {
      count: {
        id: null,
        start(count) {
          // produce a new value each second
          let observable = Rx.Observable.interval(1000);
          // if we are resuming counting then shift by a previously computed
          // value on server
          if (count !== undefined) {
            return observable.map(x => x + count).startWith(count);
          } else {
            return observable;
          }
        }
      }
    };
  }

  render() {
    return <div>Count: {this.props.count}</div>;
  }
}

if (typeof window !== 'undefined') {
  React.render(<App />, document);
}

export default App;
