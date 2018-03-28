import { observable, action, computed, reaction } from "mobx";

class NewsfeedStore {
    @observable isFetching = false
    @observable posts = []
    @observable allPosts = []
    @observable filterType = 'all'

    constructor() {
        this.perPage = 10;
        this.maxitem = -1;
        this.currentId = -1;
    }

    getMax() {
        if (this.maxitem === -1)
            return fetch('https://hacker-news.firebaseio.com/v0/maxitem.json?print=pretty').then(res => res.text());
        else
            return Promise.resolve( this.currentId );
    }

    getPost(id) {
        return this.posts.find((e) => e.id === id);
    }

    @computed get length() {
        return this.posts.length;
    }

    @action fetchPost(id) {
        let _storedPost = localStorage.getItem(id);
        
        if (_storedPost) {
            // Update current id
            this.currentId = id;
            // Push from stored posts
            this.posts.push(JSON.parse(_storedPost));
            // Return as resolved promise
            return Promise.resolve(JSON.parse(_storedPost));
        } else {
            if (!localStorage.getItem('fetchedPosts')) {
                localStorage.setItem('fetchedPosts', JSON.stringify([]));
            } else {
                const fetchedPosts = JSON.parse(localStorage.getItem('fetchedPosts'));
                if (fetchedPosts.includes(id))
                    return this.fetchPost(id - 1);
            }
            
            return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`).then(res => {
                return res.json().then(body => {
                    if (body === null) return this.fetchPost(id - 1);

                    let updatedPosts = JSON.parse(localStorage.getItem('fetchedPosts'));
                    updatedPosts.push(body.id);
                    localStorage.setItem('fetchedPosts', JSON.stringify(updatedPosts));

                    if (body.type === "story" && body.dead !== true && body.deleted !== true) {
                        body.isVisible = true;
                        body.isVisited = false;
                        this.posts.push(body);
                        localStorage.setItem(id, JSON.stringify(body));
                        this.currentId = id;
                    } else {
                        return this.fetchPost(id - 1);
                    }
                })
            });
        }
    }

    @action fetchPosts() {
        this.getMax().then(id => {
            if (this.maxitem === -1) {
                this.maxitem = Number(id);
                this.currentId = this.maxitem;
            }

            const fetchRest = () => {
                if (this.posts.length % this.perPage !== 0 || this.posts.length === 0) {
                    this.fetchPost(this.currentId - 1).then(fetchRest);
                } else {
                    this.isFetching = false;
                }
            }
            
            this.isFetching = true;
            this.fetchPost(this.currentId - 1).then(fetchRest);
        })

        return this;
    }

    @action setIsVisited(id) {
        this.posts.find((e) => e.id === id).isVisited = true;
    }

    @action filterBy(value) {
        switch (value) {
            case "all":
                this.posts.forEach(post => post.isVisible = true);
                break;
            case "unread":
                this.posts.forEach((post) => {
                    post.isVisible = !post.isVisited;
                })
                break;
            case "read":
                this.posts.forEach((post) => {
                    post.isVisible = post.isVisited;
                })
                break;
        }
    }
}

const store = new NewsfeedStore().fetchPosts();

window.store = store;

// Reactions
reaction(() => store.filterType, (value) => {
    store.filterBy(value);    
});

export default store;
