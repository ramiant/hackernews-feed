import React, { Component } from 'react';
import DevTools from 'mobx-react-devtools';
import Newsfeed from './components/newsfeed/view';
import NewsFeedHeader from './components/newsfeed_header/view';
import store from './components/newsfeed/store';

import './App.css';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <NewsFeedHeader />
        <Newsfeed store={store}/>
        <DevTools />
      </div>
    );
  }
}
