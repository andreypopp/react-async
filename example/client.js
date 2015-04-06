import Promise from 'bluebird';
import React from 'react';
import axios from 'axios';
import ReactMount from 'react/lib/ReactMount';
import {Async} from '../';

ReactMount.allowFullPageRender = true;

function get(url) {
  return {
    id: url,
    keepData: true,
    start() {
      return axios.get(url).then(response => response.data);
    }
  };
}

function AppProcesses({name}) {
  return {
    message: get(`http://localhost:3000/api/message?name=${name}`)
  };
}

@Async(AppProcesses)
class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {name: 'Andrey'};
  }

  componentDidMount() {
    setInterval(() => {
      this.setState({name: this.state.name + 1});
    }, 1000);
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
          <Nested name={name} />
          <Timer />
        </body>
      </html>
    );
  }
}

@Async
class Nested extends React.Component {

  static processes({name}) {
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

  static processes() {
    return {
      count: {
        id: null,
        resume(data) {
          return new TimerProcess(data);
        },
        start() {
          return new TimerProcess();
        }
      }
    };
  }

  render() {
    return <div>Count: {this.props.count}</div>;
  }
}

class TimerProcess {

  constructor(data) {
    this.timer = setInterval(this.tick.bind(this), 1000);
    this.data = data || 0;
    this.onNext = undefined;
    this.onError = undefined;
  }

  then(onNext, onError) {
    this.onNext = onNext;
    this.onError = onError;
  }

  cancel() {
    clearInterval(this.timer);
  }

  tick() {
    console.log('tick');
    this.data += 1;
    if (this.onNext) {
      this.onNext(this.data);
    }
  }
}

if (typeof window !== 'undefined') {
  React.render(<App />, document);
}

export default App;
