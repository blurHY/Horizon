String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};
const filterblank = x => x.trim() !== ""

!function (t, e) { "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.timeago = e() }(this, function () { "use strict"; var t = "second_minute_hour_day_week_month_year".split("_"), e = "秒_分钟_小时_天_周_月_年".split("_"), n = [60, 60, 24, 7, 365 / 7 / 12, 12], r = { en: function (e, n) { if (0 === n) return ["just now", "right now"]; var r = t[parseInt(n / 2)]; return e > 1 && (r += "s"), [e + " " + r + " ago", "in " + e + " " + r] }, zh_CN: function (t, n) { if (0 === n) return ["刚刚", "片刻后"]; var r = e[parseInt(n / 2)]; return [t + " " + r + "前", t + " " + r + "后"] } }, a = function (t) { return parseInt(t) }, i = function (t) { return t instanceof Date ? t : !isNaN(t) || /^\d+$/.test(t) ? new Date(a(t)) : (t = (t || "").trim().replace(/\.\d+/, "").replace(/-/, "/").replace(/-/, "/").replace(/(\d)T(\d)/, "$1 $2").replace(/Z/, " UTC").replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"), new Date(t)) }, o = function (t, e, i) { e = r[e] ? e : r[i] ? i : "en"; for (var o = 0, u = t < 0 ? 1 : 0, c = t = Math.abs(t); t >= n[o] && o < n.length; o++)t /= n[o]; return (t = a(t)) > (0 === (o *= 2) ? 9 : 1) && (o += 1), r[e](t, o, c)[u].replace("%s", t) }, u = function (t, e) { return ((e = e ? i(e) : new Date) - i(t)) / 1e3 }, c = function (t, e) { return t.getAttribute ? t.getAttribute(e) : t.attr ? t.attr(e) : void 0 }, f = function (t) { return c(t, "data-timeago") || c(t, "datetime") }, d = [], l = function (t) { t && (clearTimeout(t), delete d[t]) }, s = function (t) { if (t) l(c(t, "data-tid")); else for (var e in d) l(e) }, h = function () { function t(t, e) { for (var n = 0; n < e.length; n++) { var r = e[n]; r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r) } } return function (e, n, r) { return n && t(e.prototype, n), r && t(e, r), e } }(); var p = function () { function t(e, n) { !function (t, e) { if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function") }(this, t), this.nowDate = e, this.defaultLocale = n || "en" } return h(t, [{ key: "setLocale", value: function (t) { this.defaultLocale = t } }, { key: "doRender", value: function (t, e, r) { var a = this, i = u(e, this.nowDate); t.innerHTML = o(i, r, this.defaultLocale); var c = function (t, e) { var n = setTimeout(function () { l(n), t() }, e); return d[n] = 0, n }(function () { a.doRender(t, e, r) }, Math.min(1e3 * function (t) { for (var e = 1, r = 0, a = Math.abs(t); t >= n[r] && r < n.length; r++)t /= n[r], e *= n[r]; return a = (a %= e) ? e - a : e, Math.ceil(a) }(i), 2147483647)); !function (t, e) { t.setAttribute ? t.setAttribute("data-tid", e) : t.attr && t.attr("data-tid", e) }(t, c) } }, { key: "render", value: function (t, e) { void 0 === t.length && (t = [t]); for (var n = void 0, r = 0, a = t.length; r < a; r++)n = t[r], s(n), this.doRender(n, f(n), e) } }, { key: "format", value: function (t, e) { return o(u(t, this.nowDate), e, this.defaultLocale) } }]), t }(), v = function (t, e) { return new p(t, e) }; return v.register = function (t, e) { r[t] = e }, v.cancel = s, v });

timeagoinstance = timeago()

class Page extends ZeroFrame {
    setSiteInfo(site_info) {

    }

    onOpenWebsocket() {

        if (!window.logoload)
            $(".logo").attr("src", "logo.png");

        this.perPageCount = 10
        this.maxPagerBtnCount = 5
        $(".minfobox").click(() => false)
        $("a#options").click(options);
        $("a#help").click(help);
        $(".modalbox").click(() => false)

        $(document.body).click(function () {
            page.hideMoreInfo();
            hideModalBox();
        })
        this.cmd("siteInfo", [], function (site_info) {
            page.setSiteInfo(site_info);
        })
        this.cmd("fileGet", ["data_normal.json"], function (res) {
            page.data_normal = JSON.parse(res);
            page.main = page.data_normal[0]
            page.relationship = page.data_normal[1]
            page.keywords = page.data_normal[2]
            page.phrases = page.data_normal[3]
            $(".q").keydown(function (ev) {
                if (ev.key === "Enter" && $(this).val().trim() !== "") {
                    page.Search(this.value)
                }
            });
            $(".logosmall").click(function (e) {
                e.preventDefault();
                page.switchPage("defaultpage");
            });

            $(".q").attr("placeholder", `Search in ${page.main.length} rows,${page.keywords.length} keywords,${page.phrases.length} phrases`)
        })

        this.initCORS()
    }

    onRequest(cmd, message) {
        if (cmd == "setSiteInfo")
            this.setSiteInfo(message.params);
        else
            this.log("Unknown incoming message:", cmd);
    }

    switchPage(name = "resultpage") {
        let ele = document.getElementsByClassName(name);
        ele[0].classList.remove("hide");
        let anele = document.querySelector(`body>div.page:not(.${name})`);
        anele.classList.add("hide");
        if (name === "defaultpage")
            $(".q").val("");
        else if ($(".resultpage .q").val() === "")
            $(".q").val($(".defaultpage .q").val());
    }

    initCORS() {
        this.cmd("corsPermission", ["1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT"], function (res) {
            page.cmd("corsPermission", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB"], function (res) {
                // This two sites are basic
            })
        })
    }

    generateWheres(fields) { // include > exclude > normal (priority)
        let whereand = [];
        let whereor = "";
        for (const a of this.searchq) {
            let es = escapeSql(a)
            let likes = []
            for (let f of fields)
                likes.push(`${f} like "%${es}%"`);
            whereand.push(`(${likes.join(" or ")})`)
        }
        for (const a of this.excludekws) {
            let es = escapeSql(a)
            let likes = []
            for (let f of fields)
                likes.push(`${f} not like "%${es}%"`);
            whereand.push(`(${likes.join(" and ")})`)
        }
        for (const a of this.includekws) {
            let es = escapeSql(a)
            let likes = []
            for (let f of fields)
                likes.push(`${f} like "%${es}%"`);
            whereor = `(${likes.join(" or ")})`
        }
        let final = whereand.join(" and ")
        if (whereor)
            final = `(${final}) or ${whereor}`
        console.log(final)
        return final
    }

    searchCORS(cb, kws) {  // callback,keywords
        let wheres = this.generateWheres(["topic.title", "topic.body"]);
        let wheres_zerosites = this.generateWheres(["title", "description"]);
        let query = `SELECT
        COUNT(comment_id) AS comments_num, MAX(comment.added) AS last_comment, topic.added as last_added, CASE WHEN MAX(comment.added) IS NULL THEN topic.added ELSE MAX(comment.added) END as last_action,
        topic.*,
        topic_creator_user.value AS topic_creator_user_name,
        topic_creator_content.directory AS topic_creator_address,
        topic.topic_id || '_' || topic_creator_content.directory AS row_topic_uri,
        NULL AS row_topic_sub_uri, NULL AS row_topic_sub_title,
        (SELECT COUNT(*) FROM topic_vote WHERE topic_vote.topic_uri = topic.topic_id || '_' || topic_creator_content.directory)+1 AS votes,
        CASE topic.topic_id || '_' || topic_creator_content.directory WHEN '2_1J3rJ8ecnwH2EPYa6MrgZttBNc61ACFiCj' THEN 1 WHEN '8_1J3rJ8ecnwH2EPYa6MrgZttBNc61ACFiCj' THEN 1 ELSE 0 END AS sticky
       FROM topic
       LEFT JOIN json AS topic_creator_json ON (topic_creator_json.json_id = topic.json_id)
       LEFT JOIN json AS topic_creator_content ON (topic_creator_content.directory = topic_creator_json.directory AND topic_creator_content.file_name = 'content.json')
       LEFT JOIN keyvalue AS topic_creator_user ON (topic_creator_user.json_id = topic_creator_content.json_id AND topic_creator_user.key = 'cert_user_id')
       LEFT JOIN comment ON (comment.topic_uri = row_topic_uri AND comment.added < ${(Date.now() / 1000 + 120)})
       WHERE ${wheres}
       GROUP BY topic.topic_id, topic.json_id
       HAVING last_action < ${(Date.now() / 1000 + 120)}
       `

        let query0s = `SELECT site.*, json.*, COUNT(site_star.site_uri) AS star, site_stat.*
       FROM site
       LEFT JOIN json USING (json_id)
       LEFT JOIN site_star ON (site_star.site_uri = json.directory || "_" || site.site_id)
       LEFT JOIN site_stat ON (site_stat.site_uri = json.directory || "_" || site.site_id)
       WHERE ${wheres_zerosites}
       GROUP BY site.json_id, site_id`

        page.cmd("as", ["1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT", "dbQuery", query], function (res) {
            page.cmd("as", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB", "dbQuery", query0s], function (zerositesres) {
                page.zerositesres = zerositesres
                page.searchZeroTalk(kws, res, "/1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT/?Topic:", "ztalk")
                cb()
            })
        })
    }

    searchZeroTalk(kws, dbqueryres, urlprefix, itemidprefix) {
        for (let i = 0, len = dbqueryres.length; i < len; i++) {
            let rankadd = 1 / dbqueryres[i].votes * 4
            let item = {
                rank: page.searchRank(dbqueryres[i].title, kws, true) * 3 + page.searchRank(dbqueryres[i].body, kws, true) + rankadd,
                title: dbqueryres[i].title,
                phrases: [dbqueryres[i].body.slice(0, 100)],
                state: 0,
                url: urlprefix + dbqueryres[i].row_topic_uri + "/" + dbqueryres[i].title.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, ""),
                originalZtalkObj: dbqueryres[i]
            }
            page.searchres[`${itemidprefix}${i}`] = item;
        }
    }

    Search(text) {
        this.searchq = this.parseQuery(text)
        this.originsq = this.searchq.join(" ") // original search query without +xyz-abc
        this.searchQueryLowercase()
        let lastnow = Date.now()
        this.searchres = {}
        this.searchCORS(function () {
            page.searchres = page.search_filter(page.searchAll(page.searchq, page.searchres))
            page.items = page.itemsToArray(page.searchres)
            page.searchInOthers()
            page.displayItems()
            let time = (Date.now() - lastnow) / 1000
            page.showStat(page.items.length, time)
        }, this.searchq)
    }

    searchInOthers() {
        for (let inx = 0, len = this.items.length; inx < len; inx++) {
            let resZeroSites = this.getMoreInfoForSiteRootFromZeroSites(this.items[inx].item.url)
            if (resZeroSites)
                this.items[inx].item.originalZeroSites = resZeroSites;
        }
    }

    searchQueryLowercase() {
        for (let x in this.searchq)
            this.searchq[x] = this.searchq[x].toLowerCase();
    }

    parseQuery(text) {
        let res = /^\s*"(.*)"\s+filter:(.+)\s*$/gi.exec(text)
        if (res && res.length >= 3) {
            this.filter = res[2]
            this.filters = this.filter.split(",").filter(filterblank)
            return this.parseQuery_(res[1])
        }
        else {
            this.filter = undefined
            return this.parseQuery_(text)
        }
    }

    parseQuery_(text) {
        let kws = text.split(" ").filter(filterblank)
        let normalkws = []
        this.includekws = []
        this.excludekws = []
        for (let k of kws) {
            let res = /(\+|-)(.+)/g.exec(k)
            if (res && res.length === 3) {
                if (res[1] === "+")
                    this.includekws.push(res[2])
                else
                    this.excludekws.push(res[2])
            }
            else
                normalkws.push(k)
        }
        return normalkws;
    }

    showStat(rowc, time) {
        $("div.stat").show()
        $(".rowc").text(rowc)
        $(".sec").text(time)
    }

    searchAll(kws) {
        let items = this.searchInPhrases(kws, this.searchInKeywords(kws, this.searchInMain(kws)));
        items = this.getFullItemDataMain(items)
        return items;
    }

    getFullItemDataMain(items) {
        let target = this.main;
        for (let i = 0, len = target.length; i < len; i++) {
            let item = items[target[i][0]];
            if (item) {
                item.url = target[i][1]
                item.imgcount = target[i][2]
                item.title = target[i][3]
                item.state = target[i][4]
            }
        }
        return items
    }

    getMoreInfoForSiteRootFromZeroSites(url) {
        if (!isSiteRoot(url))
            return
        url = getSiteRootUrl(url)
        let urlwithtick = url + "/"
        let filtered = page.zerositesres.filter((v) => v.address === url || v.address === urlwithtick)
        return filtered[0]
        // [{…}] {category: 9, peers: 11, star: 1, description: "Two spiders are using nlp lib to crawl data", language: "multi", …} or undefined
    }

    getFullKeywords(id) {
        let target = this.keywords
        let ret = []
        for (let i = 0, len = target.length; i < len; i++) {
            if (target[i][0] == id)
                ret.push(target[i][1])
        }
        return ret;
    }

    getFullPhrases(id) {
        let target = this.phrases
        let ret = []
        for (let i = 0, len = target.length; i < len; i++) {
            if (target[i][0] == id)
                ret.push(target[i][1])
        }
        return ret;
    }

    searchRankSingle(target, searchquery, phrase = false) {
        let arr = []
        let targetNC = target.toLowerCase()
        let sqNC = searchquery.toLowerCase()
        let included = false;
        for (let index = 0, len = this.includekws.length; index < len; index++) {
            const kw = this.includekws[index].toLowerCase()
            if (targetNC.indexOf(kw) > -1) {
                included = true;
                break;
            }
        }
        if (!included) {
            for (let index = 0, len = this.excludekws.length; index < len; index++) {
                const kw = this.excludekws[index].toLowerCase()
                if (targetNC.indexOf(kw) > -1)
                    return -1
            }
        }
        arr["fullMatch"] = (target === searchquery) * 6
        arr["nocaseFullMatch"] = (targetNC === sqNC) * 4
        arr["matchTimes"] = (target.split(searchquery).length - 1) * 2
        arr["nocaseMatchTimes"] = targetNC.split(sqNC).length - 1
        arr["matchTimesOriginsq"] = (target.split(page.originsq).length - 1) * 10
        arr["nocaseMatchTimesOriginsq"] = (targetNC.split(page.originsq.toLowerCase()).length - 1) * 6

        if (phrase) {
            let space = " " + searchquery + " "
            let spacenc = " " + sqNC + " "
            arr["phrase_wordTimes"] = target.split(space).length - 1
            arr["phrase_wordTimesNocase"] = targetNC.split(spacenc).length - 1
            let titled = searchquery.substr(0, 1).toUpperCase() + searchquery.substr(1).toLowerCase()
            arr["phrase_wordTimesTitle"] = target.split(titled).length - 1
        }

        let rank = 0
        for (let x in arr)
            rank += arr[x]
        return rank
    }

    searchRank(target, queries, phrase = false) {
        let finalval = 0;
        let match = 0;

        for (let q of queries) {
            let m = this.searchRankSingle(target, q, phrase)
            if (m > 0)
                match++;
            let le = q.length <= 3 ? 0.2 : 1 / q.length * 10
            finalval += m * le
        }
        finalval *= 10 * (match / queries.length)
        return finalval;
    }

    searchInMain(kws, items = {}) {
        let target = this.main;
        for (let i = 0, len = target.length; i < len; i++) {
            let rank = this.searchRank(target[i][1], kws) + this.searchRank(target[i][3], kws)
            if (rank > 0) { // 6sr+4?
                rank *= 3
                rank += target[i][5] + target[i][4]
                let item = items[target[i][0]];
                if (!item)
                    item = {}
                if (typeof item.rank !== "undefined")
                    item.rank += rank;
                else item.rank = 1;
                items[target[i][0]] = item;
            }
        }
        return items;
    }

    searchInKeywords(kws, items = {}) {
        let target = this.keywords
        for (let i = 0, len = target.length; i < len; i++) {
            let rank = this.searchRank(target[i][1], kws)
            if (rank > 0) {
                rank *= 2
                let item = items[target[i][0]];
                if (!item)
                    item = {}
                if (typeof item.rank !== "undefined")
                    item.rank += rank; //1sr
                else item.rank = rank;
                if (!item.keywords)
                    item.keywords = [];
                item.keywords.push(target[i][1])
                items[target[i][0]] = item;
            }
        }
        return items;
    }
    searchInPhrases(kws, items = {}) {
        let target = this.phrases
        for (let i = 0, len = target.length; i < len; i++) {
            let rank = this.searchRank(target[i][1], kws, true)
            if (rank > 0) {
                rank *= 2
                let item = items[target[i][0]];
                if (!item)
                    item = {}
                if (typeof item.rank !== "undefined")
                    item.rank += rank; //1sr
                else item.rank = rank;
                if (!item.phrases)
                    item.phrases = [];
                item.phrases.push(target[i][1])
                items[target[i][0]] = item;
            }
        }
        return items;
    }

    search_filter(items) {
        if (this.filters)
            for (let f of this.filters) {
                f = f.toLowerCase()
                switch (f) {
                    case "uniqueTitle":
                        items = this.filterItems_UniqueTitle(items)
                    case "onlySiteRoot":
                        items = this.filter_siteRoot(items)
                }
            }
        return items
    }

    filterItems_UniqueTitle(items) {
        const titleMap = new Map()
        for (let pageid in items) {
            let title = items[pageid].title
            if (typeof title === "undefined" || title.trim() === "")
                continue;
            let obj = titleMap.get(title)
            if (!obj)
                obj = { ids: [], ranks: [], urls: [], imgcs: [], states: [] }
            obj.ids.push(pageid)
            obj.ranks.push(items[pageid].rank)
            obj.urls.push(items[pageid].url)
            obj.imgcs.push(items[pageid].imgcount)
            obj.states.push(items[pageid].state)
            titleMap.set(title, obj)
        }
        for (let x of titleMap) {
            let ids = x[1].ids
            if (ids.length > 1)
                for (let y of ids)
                    delete items[y]
            else
                titleMap.delete(x[0])
        }
        let index = 0;
        for (let x of titleMap) {
            let obj = x[1]
            items["g" + index] = { rank: arrayAverage(obj.ranks), imgcount: arrayAverage(obj.imgcs), title: x[0], state: arrayAverage(obj.states), originalGroupObj: obj, url: this.preferNonDomain(obj.urls) }
            index++;
        }
        return items
    }

    filter_siteRoot(items) {
        for (let pageid in items)
            if (!/^https?:\/\/[^\/]+\/[0-9A-Za-z\.]+\/?\s*$/g.test(items[pageid].url))
                delete items[pageid];
        return items
    }

    preferNonDomain(urls) {
        for (let x of urls)
            if (/^https?:\/\/[^\/]+\/[0-9A-Za-z]+(\/?|\/.+)$/g.test(x))
                return x;
        return urls.length > 0 ? urls[0] : "?";
    }

    itemsToArray(items) {
        let retarr = [];
        for (let pageid in items) {
            retarr.push({ id: pageid, item: items[pageid] });
        }
        retarr = retarr.sort((a, b) => b.item.rank - a.item.rank);
        return retarr;
    }

    ellipsis(text, len) {
        if (typeof text === "undefined")
            return
        return text.length > len ? text.slice(0, len) + "..." : text;
    }

    generateItem(title, imgc, id, link, keywords, phrases, item) {
        let ele = $(".item.template").clone();
        link = this.processLink(link);
        if (!title) title = link
        title = this.processTitle(title)

        title = this.ellipsis(title, 60)

        ele.find("a.ititle").html(this.highlightedText(title)).attr("href", link ? "/" + link : "");

        if (/^https?:\/\/[^\/]+\/[0-9A-Za-z\.]+\/?\s*$/g.test(link))
            ele.find(".type").text("SiteRoot");
        else if (typeof id !== "undefined" && this.searchres[id].originalZtalkObj)
            ele.find(".type").text("ZeroTalk");
        else
            ele.find(".type").remove();

        if (item.originalZeroSites) {
            ele.find(".zsinfo").show()
            ele.find(".zstitle").text(item.originalZeroSites.title)
            ele.find(".zsdescription").text(item.originalZeroSites.description)
            ele.find(".zsstar").text(item.originalZeroSites.star)
            ele.find(".zspeer").text(item.originalZeroSites.peers)
        } else ele.find(".zsinfo").remove()

        link = this.ellipsis(link, 50)
        ele.find(".link").html(this.highlightedText(link));
        ele.data("id", id);
        if (typeof imgc == "undefined") {
            ele.find("span.imgc").remove()
            ele.find("span.imgcc").remove()
        }
        else ele.find("span.imgcc").text(imgc);
        let kwsphs = ""
        if (keywords)
            kwsphs += keywords.join(",")
        if (phrases)
            kwsphs += phrases.join(",")
        link = this.ellipsis(link, 150)
        ele.find(".kwsphs").html(this.highlightedText(kwsphs));
        ele.removeClass("template");

        return ele;
    }

    getKeywordsPositions(kws, str) {
        let poses = []
        function getSingleKwPoses(keyw, str, offset = 0) {
            let i = str.substr(offset).indexOf(keyw)
            if (i >= 0) {
                poses.push([offset + i, keyw.length])
                getSingleKwPoses(keyw, str, offset + i + keyw.length)
            }
        }
        for (let x of kws)
            getSingleKwPoses(x, str)
        return poses;
    }

    highligtRanges(text, arr) {
        arr = arr.sort(function (a, b) { return b[0] - a[0] })
        let poses = []
        for (let a of arr) {
            poses.push({ pos: a[0], type: "start" })
            poses.push({ pos: a[0] + a[1], type: "end" })
        }
        poses = poses.sort(function (a, b) { return a.pos - b.pos })
        let lasttype = "end"
        for (let index = 0; index < poses.length; index++) {
            if (poses[index].type === lasttype) {
                delete poses[index];
                index--;
            }
            lasttype = poses[index]
        }
        let lastpos = 0;
        let textres = "";
        for (let a of poses) {
            if (a.type === "start") {
                textres += escapeHtml(text.slice(lastpos, a.pos))
            }
            else {
                textres += `<span class="match">${escapeHtml(text.slice(lastpos, a.pos))}</span>`
            }
            lastpos = a.pos
        }
        textres += text.slice(lastpos)
        return textres === "" ? text : textres
    }


    highlightedText(text) {
        if (typeof text === "undefined")
            return
        return this.highligtRanges(text, this.getKeywordsPositions(this.searchq, text.toLowerCase()));
    }

    emptyItem() {
        $(".container-left>.item:not(.template)").remove()
    }

    processLink(link) {
        if (typeof link === "undefined")
            return;
        return link.replace("http://127.0.0.1:43111", "");
    }

    displayItems() {
        this.switchPage();
        this.pagenum = 0;
        this.setPager();
        this.showOnePage()
    }

    showOnePage() {
        let cot = $(".container-left");
        this.emptyItem();
        scrollTo(0, 0)
        if (this.items.length < 1) {
            cot.append(this.generateItem("Sorry,noting found"));
        }
        if (this.pagenum > 0)
            $("div.stat").hide()
        let start = this.pagenum * this.perPageCount
        let items = this.items.slice(start, start + this.perPageCount);
        for (let i of items) {
            let pageid = i.id
            let item = i.item
            cot.append(this.generateItem(item.title, item.imgcount, pageid, item.url, item.keywords, item.phrases, item));
        }
        $(".minfo").click(this.showMoreInfo);
    }

    GetPos(obj) {
        var pos = new Object();
        pos.x = obj.offsetLeft;
        pos.y = obj.offsetTop;
        while (obj = obj.offsetParent) {
            pos.x += obj.offsetLeft;
            pos.y += obj.offsetTop;
        }
        return pos;
    }

    showStatus(text){
        
    }

    showMoreInfo(ev) {
        ev.stopPropagation()
        let parentsitem = $(this).parents(".item")
        let id = parentsitem.data("id")
        if (typeof id !== "undefined") {
            let pos = page.GetPos(this);
            $(".minfoitem").remove();
            $(".minfobox>*").hide();
            if (document.body.clientHeight < 700 || document.body.clientWidth < 1000) {
                let mitem = $(".minfobox").clone()
                mitem.removeClass("minfobox hide").addClass("item minfoitem")
                parentsitem.after(mitem)
            } else {
                $(".minfobox").css("top", pos.y + 5).css("left", pos.x).removeClass("hide");
            }
            if (page.searchres[id].originalGroupObj) {
                $(".merged").show()
                $(".mergedrowc").text(page.searchres[id].originalGroupObj.ids.length)
                let murls = $(".mergedurls");
                murls.empty()
                for (let u of page.searchres[id].originalGroupObj.urls) {
                    murls.append(`<span class="onerow">${page.highlightedText(u)}</span>`)
                }
                murls.find(".onerow").click(page.showFullInfo)
            } else if (page.searchres[id].originalZtalkObj) {
                $(".topicvotes").show();
                $(".tvs").text(page.searchres[id].originalZtalkObj.votes)
                $(".lastaction").show();
                $(".la").text(timeagoinstance.format(page.searchres[id].originalZtalkObj.last_action * 1000))
            } else {
                let notempty = false;
                if (page.searchres[id].keywords) {
                    $(".kws").empty();
                    let res = page.getFullKeywords(id)
                    for (let r of res) {
                        $(".kws").append(`<span class="one">${page.highlightedText(r)}</span>`)
                    }
                    $(".keywords").show()
                    notempty = true;
                }
                if (page.searchres[id].phrases) {
                    $(".phs").empty();
                    let res = page.getFullPhrases(id)
                    for (let r of res) {
                        $(".phs").append(page.highlightedText(r))
                    }
                    $(".phrases").show();
                    notempty = true;
                }
                if (!notempty)
                    $(".minfobox .nomoredata").show();
            }
        }
    }

    hideMoreInfo() {
        $(".minfobox").addClass("hide");
        $(".minfobox>*").hide();
        $(".phs").empty();
        $(".kws").empty();
        $(".minfoitem").remove();
        $(".minfobox .nomoredata").hide();
    }


    setPager() {
        let pagescount = Math.ceil(this.items.length / this.perPageCount)
        let pagerscount = pagescount > this.maxPagerBtnCount ? this.maxPagerBtnCount : pagescount
        let startnum = this.pagenum - parseInt(this.maxPagerBtnCount / 2)
        if (startnum - 1 < 1)
            startnum = 1;
        let ps = $(".pagersub");
        ps.empty();
        if (this.pagenum > 0)
            ps.append(`<a class="prev">&lt</a>`);
        for (let index = startnum; index <= startnum + pagerscount - 1 && index <= pagescount; index++) {
            ps.append(`<a${index - 1 == this.pagenum ? ' class="sel"' : ""}>${index}</a>`)
        }
        if (this.pagenum < pagescount - 1)
            ps.append(`<a class="next">&gt</a>`);

        $(".prev").click(function () {
            page.pagenum--;
            page.showOnePage();
            page.setPager();
        })

        $(".next").click(function () {
            page.pagenum++;
            page.showOnePage();
            page.setPager();
        })

        $(".pagersub>a:not(.prev):not(.next)").click(function () {
            page.pagenum = this.innerText - 1;
            page.showOnePage();
            page.setPager();
        })
    }

    processTitle(title) {
        if (typeof title === "undefined")
            return;
        return title.replace(/\s-\sZeroNet$/g, "")
    }
}

const arrayAverage = arr => arr.reduce((acc, val) => acc + val, 0) / arr.length
page = new Page()

function options() {
    showModalBox()
    $(".modalbox .options").show();
    return false;
}

function help() {
    showModalBox()
    $(".modalbox .help").show();
    return false;
}

function showModalBox() {
    $(".modal").show();
    $(".modalbox").show();
}

function hideModalBox() {
    $(".modal").hide();
    $(".modalbox").hide();
}


var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}


function escapeSql(string) {
    return String(string).replace(/[%\\"'_]/g, function (s) {
        return "\\" + s;
    });
}

function getSiteRootUrl(url) {
    try {
        return /(http:\/\/127\.0\.0\.1:4311.\/)?([A-Za-z0-9\.]+)/g.exec(url)[2]
    }
    catch { }
}

function isSiteRoot(url) {
    return /^https?:\/\/[^\/]+\/[0-9A-Za-z\.]+\/?\s*$/g.test(url)
}
