import React, { Component } from 'react';
import { computed, action } from 'mobx';
import { observer } from 'mobx-react';
import './style.css';

@observer
export default class Post extends Component {
    render() {
        return (
            <div 
                className={`Post ${this.store.getPost(this.props.id).isVisited ? 'Post--Visited' : ''} ${this.store.getPost(this.props.id).type === "mock" ? 'Post--Mock' : ''}`} 
                onClick={this.store.getPost(this.props.id).type !== "mock" ? this._onClick.bind(this) : null}
            >
                <div className={`Post__Favicon ${this.store.getPost(this.props.id).type === "mock" ? 'hidden' : ''}`}>
                    <span>&#x25C9;</span>
                    <img 
                        src={this.props.url ? "https://www.google.com/s2/favicons?domain_url=" + new URL(this.props.url).hostname : "http://via.placeholder.com/30x30"}
                        width={35} 
                        height={35} 
                        alt={"favicon?"+this.props.id}></img>
                </div>
                <div className="Post__Content">
                    <div className="Post__Data">
                        <div className={`Post__Link ${this.props.url ? '' : 'hidden'}`}>
                            <span>{this.props.url ? new URL(this.props.url).hostname : ''}</span>
                        </div>
                        <div className="Post__Title">
                            {this.props.title}
                        </div>
                    </div>
                    <div className="Post__Score">
                        <big>{this.props.score}</big>
                    </div>
                </div>
            </div>
        )
    }

    _onClick(ev) {
        if (this.props.url)
            window.open(this.props.url, '_blank');

        this.visit();
    }

    @computed get store() {
        return this.props.store;
    }

    @action('visit')
    visit() {
        this.store.setIsVisited(this.props.id);
        // Store visited state in localStorage
        let storedPost = JSON.parse(localStorage.getItem(this.props.id));
        storedPost.isVisited = true;
        localStorage.setItem(this.props.id, JSON.stringify(storedPost));
    }
}
