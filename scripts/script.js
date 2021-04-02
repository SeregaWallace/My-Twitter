class FetchData {
    getResource = async url => {
        const result = await fetch(url);

        if (!result.ok) {
            throw new Error('Error:' + result.status);
        }

        return result.json();
    }

    getPost = () => this.getResource('db/database.json');
    
}

class Twitter {
    constructor({ user,
            listElems,
            modalElems,
            tweetElems,
            classDeleteTweet,
            classLikeTweet,
            tweetsSort,
            showLikedPosts,
            showUserPosts, }) {
        const fetchData = new FetchData();
        
        this.user = user;
        this.tweets = new AllPosts();
        this.elements = {
            listElems: document.querySelector(listElems),
            tweetsSort: document.querySelector(tweetsSort),
            showLikedPosts: document.querySelector(showLikedPosts),
            showUserPosts: document.querySelector(showUserPosts),
            modal: modalElems,
            tweetElems: tweetElems,
        }
        this.class = {
            classDeleteTweet,
            classLikeTweet
        }
        this.sortDate = true;

        fetchData.getPost()
            .then(data => {
                data.forEach(this.tweets.addPost);
                this.showAllTweets();
            })

        this.elements.modal.forEach(this.handlerModal, this);
        this.elements.tweetElems.forEach(this.addTweet, this);
        
        this.elements.listElems.addEventListener('click', this.handlerTweet);
        this.elements.tweetsSort.addEventListener('click', this.changeSort);

        this.elements.showLikedPosts.addEventListener('click', this.showLikedTweets);
        this.elements.showUserPosts.addEventListener('click', this.showUserTweets);

    }

    renderTweets(posts) {
        const sortPosts = posts.sort(this.sortFields());
        this.elements.listElems.textContent = '';

        sortPosts.forEach(({ id, userName, nickname, getDate, text, img, likes, liked }) => {
            this.elements.listElems.insertAdjacentHTML('beforeend', `
                <li>
                    <article class="tweet">
                        <div class="row">
                            <img class="avatar" src="images/${nickname}.jpg" alt="Аватар пользователя ${nickname}">
                            <div class="tweet__wrapper">
                                <header class="tweet__header">
                                    <h3 class="tweet-author">${userName}
                                        <span class="tweet-author__add tweet-author__nickname">@${nickname}</span>
                                        <time class="tweet-author__add tweet__date">${getDate()}</time>
                                    </h3>
                                    <button class="tweet__delete-button chest-icon" data-id="${id}"></button>
                                </header>
                                <div class="tweet-post">
                                    <p class="tweet-post__text">${text}</p>
                                    ${img ? `<figure class="tweet-post__image">
                                            <img src="${img}" alt="${text}">
                                        </figure>` : ''}
                                </div>
                            </div>
                        </div>
                        <footer>
                            <button class="tweet__like ${liked ? this.class.classLikeTweet.activeLike : ''}"
                                data-id="${id}">
                                ${likes}
                            </button>
                        </footer>
                    </article>
                </li>
            `);
        })
    }

    showUserTweets = () => {
        const tweet = this.tweets.posts.filter(item => item.nickname === this.user.nickname);
        this.renderTweets(tweet);
    }

    showLikedTweets = () => {
        const tweet = this.tweets.posts.filter(item => item.liked);
        this.renderTweets(tweet);
    }

    showAllTweets() {
        this.renderTweets(this.tweets.posts);
    }

    handlerModal({ button, modal, overlay, closeBtn }) {
        const closeBtnElem = document.querySelector(closeBtn),
            buttonElem = document.querySelector(button),
            modalElem = document.querySelector(modal),
            overlayElem = document.querySelector(overlay);

        const openModal = () => {
            modalElem.style.display = 'block';
        };

        const closeModal = (elem, event) => {
            const target = event.target;
            if (target === elem) {
                modalElem.style.display = 'none';
            }
        };

        buttonElem.addEventListener('click', openModal);
        closeBtnElem.addEventListener('click', closeModal.bind(null, closeBtnElem));
        overlayElem.addEventListener('click', closeModal.bind(null, overlayElem));

        this.handlerModal.closeModal = () => {
            modalElem.style.display = 'none';
        }

    }

    addTweet({ text, img, addBtn }) {
        const textElem = document.querySelector(text),
            imgElem = document.querySelector(img),
            addBtnElem = document.querySelector(addBtn);

        let imgUrl = '';
        let tempString = textElem.innerHTML;

        addBtnElem.addEventListener('click', () => {
            this.tweets.addPost({
                userName: this.user.userName,
                nickname: this.user.nickname,
                text: textElem.innerHTML,
                img: imgUrl,
            })
            this.showAllTweets();
            this.handlerModal.closeModal();
            textElem.innerHTML = tempString;
        });

        textElem.addEventListener('click', () => {
            if (textElem.innerHTML === tempString) {
                textElem.textContent = '';
            }
        });

        imgElem.addEventListener('click', () => {
            imgUrl.prompt('Add picture URL adress');
        });

    }

    handlerTweet = event => {
        const target = event.target;
        if (target.classList.contains(this.class.classDeleteTweet)) {
            this.tweets.deletePost(target.dataset.id);
            this.showAllTweets();
        }

        if (target.classList.contains(this.class.classLikeTweet.like)) {
            this.tweets.likePost(target.dataset.id);
            this.showAllTweets();
        }
    }

    changeSort = () => {
        this.sortDate = !this.sortDate;
        this.showAllTweets();
    }

    sortFields() {
        if (this.sortDate) {
            return (a, b) => {
                const dateA = new Date(a.postDate);
                const dateB = new Date(b.postDate);
                return dateB - dateA;
            }
        } else {
            return (a, b) => b.likes - a.likes;
        }
    }

}

class AllPosts {
    constructor({ posts = [] } = {}) {
        this.posts = posts;
    }

    addPost = data => {
        this.posts.unshift(new Post(data));
    }

    deletePost(id) {
        this.posts = this.posts.filter(item => item.id !== id);
    }

    likePost(id) {
        this.posts.forEach(item => {
            if (item.id === id) {
                item.changeLike();
            }
        })
    }
}

class Post {
    constructor({ id, userName, nickname, postDate, text, img, likes = 0 }) {
        this.id = id ? id : this.generateId();
        this.userName = userName;
        this.nickname = nickname;
        this.postDate = postDate ? this.correctDate(postDate) : new Date();
        this.text = text;
        this.img = img;
        this.likes = likes;
        this.liked = false;
    }

    changeLike() {
        this.liked = !this.liked;
        if (this.liked) {
            this.likes++;
        } else {
            this.likes--;
        }
    }

    generateId() {
        return Math.random().toString(32).substring(2, 9) + (+new Date).toString(32);
    }

    getDate = () => {
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };

        return this.postDate.toLocaleString('by-BY', options);
    }

    correctDate(date) {
        if (isNaN(Date.parse(date))) {
            date = date.replaceAll('.', '/');
        }
        return new Date(date);
    }
}

const twitter = new Twitter({
    listElems: '.tweet-list',
    user: {
        userName: 'Serega',
        nickname: 'serega',
    },
    modalElems: [
        {
            button: '.header__link_tweet',
            modal: '.modal',
            overlay: '.overlay',
            closeBtn: '.modal-close__btn',
        },
    ],
    tweetElems: [
        {
            text: '.modal .tweet-form__text',
            img: '.modal .tweet-img__btn',
            addBtn: '.modal .tweet-form__btn',
        },
        {
            text: '.tweet-form__text',
            img: '.tweet-img__btn',
            addBtn: '.tweet-form__btn',
        },
    ],
    classDeleteTweet: 'tweet__delete-button',
    classLikeTweet: {
        like: 'tweet__like',
        activeLike: 'tweet__like_active',
    },
    tweetsSort: '.header__link_sort',
    showUserPosts: '.header__link_profile',
    showLikedPosts: '.header__link_likes',

})