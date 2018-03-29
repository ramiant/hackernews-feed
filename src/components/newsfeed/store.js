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

    isValid(post) {
        return this.filterFunc()(post) && post.score >= this.filterScore;
    }

    filterFunc() {
        switch (this.filterType) {
            case 'unread':
                return (e) => { return !e.isVisited; }
            case 'read':
                return (e) => { return e.isVisited; }
            default:
                return () => { return true; }
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
            console.info("%cFetching started...", "color: blue");

            if (this.maxitem === -1) {
                this.maxitem = Number(id);
                this.currentId = this.maxitem;
            }

            const fetchRest = () => {
                
                if (this.posts.length % this.perPage !== 0 || this.posts.length === 0) {
                    this.fetchPost(this.currentId - 1).then(fetchRest);
                } else {
                    this.isFetching = false;
                    console.info("%cFetching ended...", "color: red");
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
        this.posts.replace(this.allPosts.filter(this.isValid.bind(this)));
    }
}

const store = new NewsfeedStore().fetchPosts();

// Reactions
reaction(() => store.filterType, (value) => {
    store.filterBy(value);    
});

reaction(() => store.allPosts.length, (length) => {
    const lastPost = store.allPosts[length - 1];
    if (store.isValid(lastPost)) 
        store.posts.push(lastPost);
});

reaction(() => store.filterScore, (value) => {
    store.posts.replace(store.allPosts.filter(store.isValid.bind(store)));
})

export default store;
