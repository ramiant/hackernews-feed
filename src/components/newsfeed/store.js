import { observable, action, reaction } from "mobx";

class NewsfeedStore {
    @observable isFetching = false
    @observable posts = []
    @observable allPosts = []
    @observable filterType = 'all'
    @observable filterScore = 0

    constructor() {
        this.perPage = 50;
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

    filterFunc() {
        switch (this.filterType) {
            case 'all':
                return function (e) {
                    return true;
                }
            case 'unread':
                return function(e) {
                    return !e.isVisited;
                }
            case 'read':
                return function(e) {
                    return e.isVisited;
                }
            default:
                return () => { true }
        }
        
    }

    @action fetchPost(id) {
        let _storedPost = localStorage.getItem(id);
        
        if (_storedPost) {
            // Update current id
            this.currentId = id;
            // Push from stored posts
            this.allPosts.push(JSON.parse(_storedPost));
            // Return as resolved promise
            return Promise.resolve(JSON.parse(_storedPost));
        } else {
            if (!localStorage.getItem('fetchedPosts')) {
                localStorage.setItem('fetchedPosts', JSON.stringify([]));
            } else if (JSON.parse(localStorage.getItem('fetchedPosts')).includes(id)) {
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
                        this.allPosts.push(body);
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
        this.posts.replace(this.allPosts.filter(this.filterFunc()));
    }
}

// Reactions
reaction(() => store.filterType, (value) => {
    store.filterBy(value);    
});

reaction(() => store.allPosts.length, (len) => {
    if (store.filterFunc()(store.allPosts[len - 1])) {
        store.posts.push(store.allPosts[len - 1]);
    }
});

reaction(() => store.filterScore, (value) => {
    store.posts.replace(store.allPosts.filter((post) => {
        return post.score >= value && store.filterFunc()(post);
    }))
})

export default new NewsfeedStore().fetchPosts();
