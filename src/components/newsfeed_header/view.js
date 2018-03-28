import React, { Component } from 'react';
import './style.css';
import store from '../newsfeed/store';

export default class NewsFeedHeader extends Component {
    render() {
        return (
            <nav>
                <header>
                    <div className="btn-group">
                        <button onClick={this._changeFilter.bind(this)} value="all">Show All</button>
                        <button onClick={this._changeFilter.bind(this)} value="unread">Show Unread</button>
                        <button onClick={this._changeFilter.bind(this)} value="read">Show Read</button>
                    </div>
                </header>
            </nav>
        );
    }

    _changeFilter(ev) {
        store.filterType = ev.target.value;
    }
}