import React, { Component } from 'react';
import List from 'react-virtualized/dist/commonjs/List';
import Post from './post/view';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import './style.css';

@observer
export default class Newsfeed extends Component {
    @computed get store() {
        return this.props.store;
    }

    render() {
        return (
            <List className="NewsFeed" height={400} width={700} rowHeight={60} rowCount={this.store.posts.length} rowRenderer={this._rowRenderer.bind(this)}/>
        );
    }

    _rowRenderer(options) {
        if (options.index === this.store.length - 1 && !this.store.isFetching && options.isVisible) {
            console.log('fetch more');
            this.store.fetchPosts()
        }
        
        return (
            <div
                key={options.key}
                style={options.style}
            >
                <Post 
                    id={this.store.posts[options.index].id} 
                    title={this.store.posts[options.index].title} 
                    score={this.store.posts[options.index].score} 
                    url={this.store.posts[options.index].url}
                    isVisited={this.store.posts[options.index].isVisited}
                    store={this.store}
                />
            </div>
        );
    }
}
