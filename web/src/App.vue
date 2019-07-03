<template>
  <div id="app">
    <div class="a">
      <div class="c">
        <div class="b">
          <figure class="image">
            <img src="./assets/logo.png" />
          </figure>
          <p class="control has-icons-right" @dblclick="click" @keypress="enter">
            <input
              ref="input"
              class="input is-rounded is-large main-input"
              type="text"
              placeholder="Search"
            />
            <span class="icon is-small is-right">
              <font-awesome-icon icon="search" />
            </span>
            <progress
              class="progress main-progress is-small is-primary"
              max="100"
              ref="progress"
              value="0"
            >2</progress>
          </p>
        </div>
        <article class="message is-warning" v-if="message.body">
          <div class="message-header">
            <p>{{message.header}}</p>
            <button class="delete" aria-label="delete" @click="message.body=undefined"></button>
          </div>
          <div class="message-body" v-html="message.body"></div>
        </article>

        <div class="cards" v-if="cards.length>0">
          <div class="card" v-for="(card,index) in cards" :key="index">
            <header class="card-header">
              <p class="card-header-title">{{getTitle(card)}}</p>
              <a href="#" class="card-header-icon" aria-label="more options">
                <span class="icon">
                  <i class="fas fa-angle-down" aria-hidden="true"></i>
                </span>
              </a>
            </header>
            <div class="card-content">
              <div class="content" v-html="marked(card.body)" v-if="card.body">{{siteContent(card)}}</div>
              <div v-if="card.inner_path||card.item_type">
                <a
                  @click="getSite(card.siteId)"
                  class="button is-small"
                  :data-site="card.siteId"
                >View site address</a>
                <span class="tag is-small" v-if="card.url">{{card.url}}</span>
              </div>
            </div>
            <footer class="card-footer">
              <span class="card-footer-item item_footer">
                <div class="tags has-addons are-medium">
                  <span class="tag is-white">Date</span>
                  <span class="tag is-light">{{getDate(card)}}</span>
                </div>
                <div class="tags has-addons are-medium">
                  <span class="tag is-white">{{getSecond(card,true)}}</span>
                  <span class="tag is-light">{{getSecond(card)}}</span>
                </div>
                <div class="tags has-addons are-medium" v-if="getThird(card)">
                  <span class="tag is-white">{{getThird(card,true)}}</span>
                  <span class="tag is-light">{{getThird(card)}}</span>
                </div>
              </span>
            </footer>
          </div>
          <nav class="pagination is-centered" role="navigation" aria-label="pagination">
            <a class="pagination-previous" v-if="currentPage-1>0" @click="previous">Previous</a>
            <a
              class="pagination-next"
              v-if="currentPage+1<=Math.ceil(total/10)"
              @click="next"
            >Next page</a>
            <ul class="pagination-list">
              <li>
                <a class="pagination-link">1</a>
              </li>
              <li>
                <span class="pagination-ellipsis">&hellip;</span>
              </li>
              <li>
                <a
                  class="pagination-link"
                  v-if="currentPage-1>0"
                  @click="previous"
                >{{currentPage-1}}</a>
              </li>
              <li>
                <a class="pagination-link is-current" aria-current="page">{{currentPage}}</a>
              </li>
              <li>
                <a
                  class="pagination-link"
                  v-if="currentPage+1<=Math.ceil(total/10)"
                  @click="next"
                >{{currentPage+1}}</a>
              </li>
              <li>
                <span class="pagination-ellipsis">&hellip;</span>
              </li>
              <li>
                <a
                  class="pagination-link"
                  aria-label="Goto page 86"
                  v-if="total>10"
                  @click="currentPage=Math.ceil(total/10);get(true)"
                >{{Math.ceil(total/10)}}</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.app,
.html,
.body {
  width: 100%;
}
.a {
  margin-top: 200px;
  width: 100%;
  display: flex;
  justify-content: center;
}
@media only screen and (max-height: 600px) {
  .a {
    margin-top: 60px;
  }
  .b {
    width: 200px;
  }
}

.card-footer-item.item_footer {
  display: flex;
  justify-content: space-around;
}
.item_footer .tags {
  margin: 0 !important;
}
.c {
  max-width: 100vw;
  width: 900px;
  justify-content: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-content {
  word-break: break-all;
}
.card {
  margin-bottom: 10px;
}
.b {
  width: 500px;
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 10px;
}
.image {
  width: 320px;
}
@media only screen and (max-width: 600px) {
  .a {
    margin-top: 120px;
  }
  .b {
    width: 90%;
  }
  .image {
    width: 80%;
  }
}
.b > * {
  margin-bottom: 20px;
}

.input.main-input {
  -webkit-box-shadow: none;
  box-shadow: none;
  border: none !important;
}
.cards {
  margin: 5px;
  max-width: 100%;
}
p.control {
  width: 100%;
}
p.control > * {
  width: 100%;
}
textarea:focus,
input:focus {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}
.progress.main-progress {
  margin-top: -56px;
  width: calc(100% + 4px);
  height: 58px !important;
  margin-left: -2px;
}
</style>
<script>
import dateTime from "date-time";
import marked from "marked";
window.addr = window.webpackHotUpdate
  ? "http://127.0.0.1:8021"
  : "https://api.horizon.blurhy.xyz";
marked.setOptions({ sanitize: true, baseUrl: "127.0.0.1:43110" });
export default {
  methods: {
    get(usePrev) {
      if (!usePrev) {
        this.currentPage = 1;
        this.prevQ = this.$refs.input.value;
      }
      if (!this.prevQ) return;
      this.restoreSiteTags();
      scrollTo(0, 0);
      let q = `${addr}/q/q="${encodeURI(
        usePrev ? this.prevQ : this.$refs.input.value
      )}"&from=${(this.currentPage - 1) * 10}`;
      console.log(q);
      this.$refs.progress.removeAttribute("value");
      fetch(q)
        .then(async res => {
          let r = await res.json();
          if (r.hits.hits.length === 0) {
            this.message.header = "Warning";
            this.message.body = "No results";
          }
          if (this.currentPage <= 1) this.total = r.hits.total.value;
          console.log(r);
          this.cards = r.hits.hits.map(x => x._source);
          this.$refs.input.value = "";
          this.$refs.progress.value = 0;
        })
        .catch(res => {
          this.message.body = res;
          this.$refs.progress.value = 0;
        });
    },
    next() {
      this.currentPage++;
      console.log("next");
      this.get(true);
    },
    previous() {
      this.currentPage--;
      console.log("prev");
      this.get(true);
    },
    click() {
      this.get();
    },
    getSite(siteId, cb) {
      let q = `${addr}/get/site/${siteId}`;
      this.$refs.progress.removeAttribute("value");
      fetch(q)
        .then(async res => {
          let r = await res.json();
          console.log(r["_source"]);
          this.site[siteId] = r["_source"];
          document
            .querySelectorAll(`.button[data-site='${siteId}']`)
            .forEach(x => {
              if (x.style.display !== "none") {
                x.style = "display:none";
                x.outerHTML += `<div class="tags has-addons site-tag">
          <span class="tag">Site</span>
          <span class="tag is-success">${this.site[siteId].address}</span>
        </div>`;
              }
            });
          if (cb) cb(r);
          this.$refs.progress.value = 0;
        })
        .catch(res => {
          this.message.body = res;
          this.$refs.progress.value = 0;
        });
    },
    restoreSiteTags() {
      document.querySelectorAll(".button").forEach(x => {
        x.style = "";
        x.addEventListener("click", x => {
          this.getSite(x.target.dataset.site);
        });
      });
      document.querySelectorAll(".site-tag").forEach(x => {
        x.remove();
      });
    },
    enter(e) {
      if (e.keyCode === 13) this.click();
    },
    getTitle(card) {
      if (card.title)
        return (card.address ? card.address + " " : "") + card.title;
      if (card.inner_path) {
        let res = /[/]([^/]+)$/g.exec(card.inner_path);
        if (res[1])
          if (res) return res[1];
          else return card.inner_path;
      }
    },
    getDate(card) {
      let date = 0;
      if (card.date_added) date = card.date_added;
      if (card.time_added) date = card.time_added;
      if (card.modified) date = card.modified;
      return dateTime({ date: new Date(date * 1000) });
    },
    getSecond(card, name) {
      if (card.item_type) return name ? "Type" : card.item_type;
      if (card.size) return name ? "Size" : card.size;
      if (card.domain) return name ? "Domain" : card.domain;
    },
    getThird(card, name) {
      if (card.peer) return name ? "Peers" : card.peer;
      if (card.category) return name ? "Category" : card.category;
      if (card.peers) return name ? "Peers" : card.peers;
    },
    siteContent(card) {
      if (card.description) {
        return card.description;
      }
    },
    marked,
    opText(index) {
      return this.site[index] && this.site[index].address
        ? this.site[index].address
        : "View site address";
    }
  },
  data() {
    return {
      cards: [],
      message: {
        header: "Warning",
        body: undefined
      },
      total: 0,
      currentPage: 1,
      prevQ: "",
      site: {}
    };
  }
};
</script>
