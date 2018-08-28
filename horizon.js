String.prototype.splice = function (idx, rem, str) {
	return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem))
}
const filterblank = x => x.trim() !== ""

timeagoinstance = timeago()

window.onscroll = function () {
	if (document.documentElement.scrollTop > 10)
		$(".topbar").removeClass("top")
	else
		$(".topbar").addClass("top")
}

$(function () {
	page.switchPage("defaultpage")
})

class Page extends ZeroFrame {
	setSiteInfo(site_info) {
		this.site_info = site_info
	}

	onOpenWebsocket() {
		if (!window.logoload)
			$(".logo").attr("src", "logo.png")

		if (!window.logosmallload)
			$(".logosmall").attr("src", "logo.png")


		this.perPageCount = 20
		this.maxPagerBtnCount = 4
		$(".minfobox").click(() => false)
		$("a#options").click(options)
		$("a#help").click(help)
		$(".modalbox").click(() => false)
		$(".settingbtn").click(function (ev) {
			ev.stopPropagation()
			page.switchPage("settingspage")
		})

		this.getCORSList()

		$(".corszitessubmit").click(function () {
			page.submitCORSZite()
			return false
		})

		$(document.body).click(function () {
			page.hideMoreInfo()
			hideModalBox()
		})
		this.cmd("siteInfo", [], function (site_info) {
			page.setSiteInfo(site_info)
		})
		this.cmd("fileGet", ["data_normal.json"], function (res) {
			page.data_normal = JSON.parse(res)
			page.main = page.data_normal[0]
			page.relationship = page.data_normal[1]
			page.keywords = page.data_normal[2]
			page.phrases = page.data_normal[3]
			$(".q").keydown(function (ev) {
				if (ev.key === "Enter" && $(this).val().trim() !== "") {
					page.Search(this.value)
				}
			})
			$(".logosmall").click(function (e) {
				e.preventDefault()
				page.switchPage("defaultpage")
			})

			$(".q").attr("placeholder", `Search in ${page.main.length} rows,${page.keywords.length} keywords,${page.phrases.length} phrases`)
		})

		this.initCORS()
		this.getsettings()

		$(".ui.dropdown").dropdown({
			values: [{
					name: "ZeroTalk",
					value: "ZeroTalk"
				}, {
					name: "ZeroBlog",
					value: "ZeroBlog"
				},
				{
					name: "ZeroWiki",
					value: "ZeroWiki"
				}
			]
		}).find(".default").text("Type")
	}

	onRequest(cmd, message) {
		if (cmd == "setSiteInfo")
			this.setSiteInfo(message.params)
		else
			this.log("Unknown incoming message:", cmd)
	}

	switchPage(name = "resultpage") {
		window.onscroll()
		$(`.${name}`).removeClass("hide")
		let hides = $(`body>div.page:not(.${name})`)
		hides.addClass("hide")
		if (name === "settingspage") {
			this.getCORSList(function () {
				page.displayCORSList()
			})
		}
		if (name === "defaultpage")
			$(".q").val("")
		else if ($(".resultpage .q").val() === "")
			$(".q").val($(".defaultpage .q").val())
	}

	initCORS() {
		this.cmd("corsPermission", ["1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT"], function (res) {
			page.cmd("corsPermission", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB"], function (res) {
				page.cmd("corsPermission", ["138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP"], function (res) {
					// These sites are basic
					page.initFollowedCORS()
				})
			})
		})
	}

	initFollowedCORS() {
		this.getFollowedCors()

		function f(index) {
			if (index >= page.corszitesForQuery.length)
				return
			let item = page.corszitesForQuery[index]
			if (item && item.address)
				page.cmd("corsPermission", [item.address], function (res) {
					f(index + 1)
				})
			else
				f(index + 1)
		}

		f(0)
	}

	generateWheres(fields) { // include > exclude > normal (priority)
		let whereand = []
		let whereor = ""
		for (const a of this.searchq) {
			let es = escapeSql(a)
			let likes = []
			for (let f of fields)
				likes.push(`${f} like "%${es}%"`)
			whereand.push(`(${likes.join(" or ")})`)
		}
		for (const a of this.excludekws) {
			let es = escapeSql(a)
			let likes = []
			for (let f of fields)
				likes.push(`${f} not like "%${es}%"`)
			whereand.push(`(${likes.join(" and ")})`)
		}
		for (const a of this.includekws) {
			let es = escapeSql(a)
			let likes = []
			for (let f of fields)
				likes.push(`${f} like "%${es}%"`)
			whereor = `(${likes.join(" or ")})`
		}
		let final = whereand.join(" and ")
		if (whereor)
			final = `(${final}) or ${whereor}`
		console.log(final)
		return final
	}

	genZeroTalkQuery() {
		let wheres = this.generateWheres(["topic.title", "topic.body"])
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
		return query
	}

	genZeroSitesQuery() {
		let wheres_zerosites = this.generateWheres(["title", "description"])
		let query0s = `SELECT site.*, json.*, COUNT(site_star.site_uri) AS star, site_stat.*
       FROM site
       LEFT JOIN json USING (json_id)
       LEFT JOIN site_star ON (site_star.site_uri = json.directory || "_" || site.site_id)
       LEFT JOIN site_stat ON (site_stat.site_uri = json.directory || "_" || site.site_id)
       WHERE ${wheres_zerosites}
       GROUP BY site.json_id, site_id`
		return query0s
	}


	searchCORS(cb, kws) { // callback,keywords
		page.cmd("as", ["1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT", "dbQuery", this.genZeroTalkQuery()], function (res) {
			page.cmd("as", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB", "dbQuery", page.genZeroSitesQuery()], function (zerositesres) {
				page.zerositesres = zerositesres
				page.searchZeroTalk(kws, res, "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT/?Topic:", "ztalk")
				page.getFollowedCors()
				page.searchFollowedCORS(cb)
			})
		})
	}

	genQuery(type) {
		switch (type) {
			case "ZeroWiki":
				return this.genWikiQuery()
			case "ZeroTalk":
				return this.genZeroTalkQuery()
			case "ZeroBlog":
				return this.genZeroBlogQuery()
			default:
				return null
		}
	}

	searchFollowedCORS(cb) { //CORS in settings
		function next(index) {
			if (index >= page.corszitesForQuery.length) {
				cb()
				return
			}
			let item = page.corszitesForQuery[index]
			let query = page.genQuery(item.type)
			if (query)
				page.cmd("as", [item.address, "dbQuery", query], function (res) {
					switch (item.type) {
						case "ZeroWiki":
							page.carditems.push(page.searchWiki(res, item.address))
							break
						case "ZeroTalk":
							page.searchZeroTalk(page.searchq, res, `${item.address}/?Topic:`, `fcors${index}`)
							break
						case "ZeroBlog":
							page.searchZeroBlog(res, `fcors${index}`, item.address)
							break
					}
					next(index + 1)
				})
			else
				next(index + 1)
		}

		next(0)
	}

	displayCards() {
		this.clearCards()
		if (document.body.clientWidth < 480)
			for (let c of this.carditems)
				this.displayCardsAsItems(c)
		else
			for (let c of this.carditems)
				this.displayCardsNormal(c)
	}

	displayCardsAsItems(item) { //Show cards on mobile
		$(".container-left").append(this.generateCard(item, true))
	}

	displayCardsNormal(item) {
		$(".container-right").append(this.generateCard(item, true))
	}

	clearCards() {
		$(".card:not(.template)").remove()
	}

	generateCard(item, markdown = false) {
		if (typeof item === "undefined")
			return
		if (typeof item.body === "undefined")
			return
		let card = $(".card.template").clone().removeClass("template")
		if (typeof item.datetime === "number")
			item.datetime = timeagoinstance.format(item.datetime)
		card.find(".cardtitle").text(item.title).attr("href", item.link ? item.link : "javascript:void 0")
		if (!markdown)
			item.card.find(".cardbody").text(item.body)
		else
			card.find(".cardbody").html(marked(item.body, {
				sanitize: true
			}))
		if (item.datetime)
			card.find(".datetime").text(item.datetime)
		if (item.user)
			card.find(".user").text(item.user)
		if (item.type)
			card.find(".cardtype").text(item.type)
		return card
	}

	genWikiQuery() {
		let conds = []
		for (let x of this.searchq)
			conds.push(`slug="${escapeSql(x)}"`)
		return `select body,date_added,slug from pages where ${conds.join(" or ")}`
	}

	genZeroBlogQuery() {
		return "select * from post"
	}

	searchCards() {
		page.cmd("as", ["138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP", "dbQuery", this.genWikiQuery()], function (res) {
			page.carditems.push(page.searchWiki(res, "138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP"))
		})
	}

	searchWiki(dbquery, addr) {
		let wikis = []
		for (let index = 0, length = dbquery.length; index < length; index++) {
			wikis.push({
				type: "wiki",
				obj: dbquery[index],
				rank: page.searchRank(dbquery[index].body, page.searchq, true),
				datetime: dbquery[index].date_added,
				body: dbquery[index].body.replace(/\[\[([A-Za-z0-9\-\s]+)\]\]/g, str => ` [${str.slice(2, -2)}](/${addr}/?Page:` + encodeURI(str.slice(2, -2)) + ") "),
				title: dbquery[index].slug,
				link: `/${addr}/?Page:${encodeURI(dbquery[index].slug)}`
			})
		}
		wikis.sort((a, b) => b.datetime - a.datetime)
		return wikis[0]
	}


	searchZeroTalk(kws, dbqueryres, urlprefix, itemidprefix) {
		for (let i = 0, len = dbqueryres.length; i < len; i++) {
			try {
				var rankadd = 1 / dbqueryres[i].votes * 4
				var item = {
					rank: page.searchRank(dbqueryres[i].title, kws, true) * 3 + page.searchRank(dbqueryres[i].body, kws, true) + rankadd,
					title: dbqueryres[i].title,
					phrases: [dbqueryres[i].body.slice(0, 100)],
					state: 0,
					url: urlprefix + dbqueryres[i].row_topic_uri + "/" + dbqueryres[i].title.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, ""),
					originalZtalkObj: dbqueryres[i]
				}
			} catch (e) {
				console.log(e)
				continue
			}
			page.searchres[`${itemidprefix}${i}`] = item
		}
	}

	Search(text) {
		this.searchq = this.parseQuery(text)
		this.originsq = this.searchq.join(" ") // original search query without +xyz-abc
		this.searchQueryLowercase()
		let lastnow = Date.now()
		this.searchres = {}
		this.carditems = []
		page.searchCards()
		this.searchCORS(function () {
			page.searchres = page.search_filter(page.searchAll(page.searchq, page.searchres))
			page.items = page.itemsToArray(page.searchres)
			page.searchInOthers()
			page.displayItems()
			page.carditems.sort((a, b) => b.rank - a.rank)
			page.displayCards()
			let time = (Date.now() - lastnow) / 1000
			page.showStat(page.items.length, time)
		}, this.searchq)
	}

	searchInOthers() {
		for (let inx = 0, len = this.items.length; inx < len; inx++) {
			let resZeroSites = this.getMoreInfoForSiteRootFromZeroSites(this.items[inx].item.url)
			if (resZeroSites)
				this.items[inx].item.originalZeroSites = resZeroSites
		}
	}

	searchQueryLowercase() {
		for (let x in this.searchq)
			this.searchq[x] = this.searchq[x].toLowerCase()
	}

	parseQuery(text) {
		let res = /^\s*"(.*)"\s+filter:(.+)\s*$/gi.exec(text)
		if (res && res.length >= 3) {
			this.filter = res[2]
			this.filters = this.filter.split(",").filter(filterblank)
			return this.parseQuery_(res[1])
		} else {
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
			let res = /^(\+|-)(.+)$/g.exec(k)
			if (res && res.length === 3) {
				if (res[1] === "+")
					this.includekws.push(res[2])
				else
					this.excludekws.push(res[2])
			} else
				normalkws.push(k)
		}
		return normalkws
	}

	showStat(rowc, time) {
		$("div.stat").show()
		$(".rowc").text(rowc)
		$(".sec").text(time)
	}

	searchAll(kws, items) {
		items = this.searchInPhrases(kws, this.searchInKeywords(kws, this.searchInMain(kws, items)))
		items = this.getFullItemDataMain(items)
		return items
	}

	getFullItemDataMain(items) {
		let target = this.main
		for (let i = 0, len = target.length; i < len; i++) {
			let item = items[target[i][0]]
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
		return ret
	}

	getFullPhrases(id) {
		let target = this.phrases
		let ret = []
		for (let i = 0, len = target.length; i < len; i++) {
			if (target[i][0] == id)
				ret.push(target[i][1])
		}
		return ret
	}

	searchZeroBlog(dbqueryres, itemprefix, addr) {
		for (let index = 0, length = dbqueryres.length; index < length; index++) {
			const row = dbqueryres[index]
			let ranktitle = this.searchRank(row.title, page.searchq) * 8
			let rankbody = this.searchRank(row.body, page.searchq, true)
			let total = ranktitle + rankbody
			if (total <= 0)
				continue
			let item = {
				rank: total,
				title: row.title,
				phrases: [row.body.slice(0, 100)],
				state: 0,
				url: `/${addr}/?Post:${row.post_id}`,
				originalZblogObj: row
			}
			page.searchres[`${itemprefix}${index}`] = item
		}
	}

	searchRankSingle(target, searchquery, phrase = false) {
		let arr = []
		if (typeof target === "undefined")
			return
		let targetNC = target.toLowerCase()
		let sqNC = searchquery.toLowerCase()
		let included = false
		for (let index = 0, len = this.includekws.length; index < len; index++) {
			const kw = this.includekws[index].toLowerCase()
			if (targetNC.indexOf(kw) > -1) {
				included = true
				break
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
		let finalval = 0
		let match = 0

		for (let q of queries) {
			let m = this.searchRankSingle(target, q, phrase)
			if (m > 0)
				match++
				let le = q.length <= 3 ? 0.2 : 1 / q.length * 10
			finalval += m * le
		}
		finalval *= 10 * (match / queries.length)
		return finalval
	}

	searchInMain(kws, items = {}) {
		let target = this.main
		for (let i = 0, len = target.length; i < len; i++) {
			let rank = this.searchRank(target[i][1], kws) + this.searchRank(target[i][3], kws)
			if (rank > 0) { // 6sr+4?
				rank *= 3
				rank += target[i][5] + target[i][4]
				let item = items[target[i][0]]
				if (!item)
					item = {}
				if (typeof item.rank !== "undefined")
					item.rank += rank
				else item.rank = 1
				items[target[i][0]] = item
			}
		}
		return items
	}

	searchInKeywords(kws, items = {}) {
		let target = this.keywords
		for (let i = 0, len = target.length; i < len; i++) {
			let rank = this.searchRank(target[i][1], kws)
			if (rank > 0) {
				rank *= 2
				let item = items[target[i][0]]
				if (!item)
					item = {}
				if (typeof item.rank !== "undefined")
					item.rank += rank //1sr
				else item.rank = rank
				if (!item.keywords)
					item.keywords = []
				item.keywords.push(target[i][1])
				items[target[i][0]] = item
			}
		}
		return items
	}

	searchInPhrases(kws, items = {}) {
		let target = this.phrases
		for (let i = 0, len = target.length; i < len; i++) {
			let rank = this.searchRank(target[i][1], kws, true)
			if (rank > 0) {
				rank *= 2
				let item = items[target[i][0]]
				if (!item)
					item = {}
				if (typeof item.rank !== "undefined")
					item.rank += rank //1sr
				else item.rank = rank
				if (!item.phrases)
					item.phrases = []
				item.phrases.push(target[i][1])
				items[target[i][0]] = item
			}
		}
		return items
	}

	search_filter(items) {
		if (this.filters)
			for (let f of this.filters) {
				f = f.toLowerCase()
				switch (f) {
					case "uniquetitle":
						items = this.filterItems_UniqueTitle(items)
						break;
					case "onlysiteroot":
						items = this.filter_siteRoot(items)
						break;
				}
			}
		return items
	}

	filterItems_UniqueTitle(items) {
		const titleMap = new Map()
		for (let pageid in items) {
			let title = items[pageid].title
			if (typeof title === "undefined" || title.trim() === "")
				continue
			let obj = titleMap.get(title)
			if (!obj)
				obj = {
					ids: [],
					ranks: [],
					urls: [],
					imgcs: [],
					states: []
				}
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
		let index = 0
		for (let x of titleMap) {
			let obj = x[1]
			items["g" + index] = {
				rank: arrayAverage(obj.ranks),
				imgcount: arrayAverage(obj.imgcs),
				title: x[0],
				state: arrayAverage(obj.states),
				originalGroupObj: obj,
				url: this.preferNonDomain(obj.urls)
			}
			index++
		}
		return items
	}

	filter_siteRoot(items) {
		for (let pageid in items)
			if (!/^\s*[0-9A-Za-z\.]+\/?\s*$/g.test(items[pageid].url))
				delete items[pageid]
		return items
	}

	preferNonDomain(urls) {
		for (let x of urls)
			if (/^https?:\/\/[^\/]+\/[0-9A-Za-z]+(\/?|\/.+)$/g.test(x))
				return x
		return urls.length > 0 ? urls[0] : "?"
	}

	itemsToArray(items) {
		let retarr = []
		for (let pageid in items) {
			retarr.push({
				id: pageid,
				item: items[pageid]
			})
		}
		retarr = retarr.sort((a, b) => b.item.rank - a.item.rank)
		return retarr
	}

	ellipsis(text, len) {
		if (typeof text === "undefined")
			return
		return text.length > len ? text.slice(0, len) + "..." : text
	}

	generateItem(title, imgc, id, link, keywords, phrases, item) {
		let ele = $(".item.template").clone()
		link = this.processLink(link)
		if (!title) title = link
		title = this.processTitle(title)

		title = this.ellipsis(title, 60)

		ele.find("a.ititle").html(this.highlightedText(title)).attr("href", link ? (link.startsWith("/") ? link : ("/" + link)) : "")

		if (/^https?:\/\/[^\/]+\/[0-9A-Za-z\.]+\/?\s*$/g.test(link))
			ele.find(".type").text("SiteRoot")
		else if (typeof id !== "undefined" && this.searchres[id].originalZtalkObj)
			ele.find(".type").text("ZeroTalk")
		else if (typeof id !== "undefined" && this.searchres[id].originalZblogObj)
			ele.find(".type").text("ZeroBlog")
		else
			ele.find(".type").remove()

		if (item) {
			if (item.originalZeroSites) {
				ele.find(".zsinfo").show()
				ele.find(".zstitle").text(item.originalZeroSites.title)
				ele.find(".zsdescription").text(item.originalZeroSites.description)
				ele.find(".zsstar").text(item.originalZeroSites.star)
				ele.find(".zspeer").text(item.originalZeroSites.peers)
			} else ele.find(".zsinfo").remove()

			if (item.originalZtalkObj) {
				ele.find(".ztinfo").show()
				ele.find(".ztvote").text(item.originalZtalkObj.votes)
			} else ele.find(".ztinfo").remove()
		}


		link = this.ellipsis(link, 50)
		ele.find(".link").html(this.highlightedText(link))
		ele.data("id", id)
		if (typeof imgc == "undefined") {
			ele.find("span.imgc").remove()
			ele.find("span.imgcc").remove()
		} else ele.find("span.imgcc").text(imgc)
		let kwsphs = ""
		if (keywords)
			kwsphs += keywords.join(",")
		if (phrases)
			kwsphs += phrases.join(",")
		link = this.ellipsis(link, 150)
		ele.find(".kwsphs").html(this.highlightedText(kwsphs))
		ele.removeClass("template")

		return ele
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
		return poses
	}

	highligtRanges(text, arr) {
		arr = arr.sort(function (a, b) {
			return b[0] - a[0]
		})
		let poses = []
		for (let a of arr) {
			poses.push({
				pos: a[0],
				type: "start"
			})
			poses.push({
				pos: a[0] + a[1],
				type: "end"
			})
		}
		poses = poses.sort(function (a, b) {
			return a.pos - b.pos
		})
		let lasttype = "end"
		for (let index = 0; index < poses.length; index++) {
			if (poses[index].type === lasttype) {
				delete poses[index]
				index--
			}
			lasttype = poses[index]
		}
		let lastpos = 0
		let textres = ""
		for (let a of poses) {
			if (a.type === "start") {
				textres += escapeHtml(text.slice(lastpos, a.pos))
			} else {
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
		return this.highligtRanges(text, this.getKeywordsPositions(this.searchq, text.toLowerCase()))
	}

	emptyItem() {
		$(".container-left>.item:not(.template)").remove()
	}

	processLink(link) {
		if (typeof link === "undefined")
			return
		return link.replace("http://127.0.0.1:43111", "")
	}

	displayItems() {
		this.switchPage()
		this.pagenum = 0
		this.setPager()
		this.showOnePage()
	}

	showOnePage() {
		let cot = $(".container-left")
		this.emptyItem()
		scrollTo(0, 0)
		if (this.items.length < 1) {
			cot.append(this.generateItem("Sorry,noting found"))
		}
		if (this.pagenum > 0)
			$("div.stat").hide()
		let start = this.pagenum * this.perPageCount
		let items = this.items.slice(start, start + this.perPageCount)
		for (let i of items) {
			let pageid = i.id
			let item = i.item
			cot.append(this.generateItem(item.title, item.imgcount, pageid, item.url, item.keywords, item.phrases, item))
		}
		$(".minfo").click(this.showMoreInfo)
	}

	GetPos(obj) {
		var pos = new Object()
		pos.x = obj.offsetLeft
		pos.y = obj.offsetTop
		while (obj = obj.offsetParent) {
			pos.x += obj.offsetLeft
			pos.y += obj.offsetTop
		}
		return pos
	}

	showStatus(text) {

	}

	showMoreInfo(ev) {
		ev.stopPropagation()
		let parentsitem = $(this).parents(".item")
		let id = parentsitem.data("id")
		if (typeof id !== "undefined") {
			let pos = page.GetPos(this)
			$(".minfoitem").remove()
			$(".minfobox>*").hide()
			if (document.body.clientHeight < 700 || document.body.clientWidth < 1000) {
				let mitem = $(".minfobox").clone()
				mitem.removeClass("minfobox hide").addClass("item minfoitem")
				parentsitem.after(mitem)
			} else {
				$(".minfobox").css("top", pos.y + 5).css("left", pos.x).removeClass("hide")
			}
			if (page.searchres[id].originalGroupObj) {
				$(".merged").show()
				$(".mergedrowc").text(page.searchres[id].originalGroupObj.ids.length)
				let murls = $(".mergedurls")
				murls.empty()
				for (let u of page.searchres[id].originalGroupObj.urls) {
					murls.append(`<span class="onerow">${page.highlightedText(u)}</span>`)
				}
				murls.find(".onerow").click(page.showFullInfo)
			} else if (page.searchres[id].originalZtalkObj) {
				$(".topicvotes").show()
				$(".tvs").text(page.searchres[id].originalZtalkObj.votes)
				$(".lastaction").show()
				$(".la").text(timeagoinstance.format(page.searchres[id].originalZtalkObj.last_action * 1000))
			} else {
				let notempty = false
				if (page.searchres[id].keywords) {
					$(".kws").empty()
					let res = page.getFullKeywords(id)
					for (let r of res) {
						$(".kws").append(`<span class="one">${page.highlightedText(r)}</span>`)
					}
					$(".keywords").show()
					notempty = true
				}
				if (page.searchres[id].phrases) {
					$(".phs").empty()
					let res = page.getFullPhrases(id)
					for (let r of res) {
						$(".phs").append(page.highlightedText(r))
					}
					$(".phrases").show()
					notempty = true
				}
				if (!notempty)
					$(".minfobox .nomoredata").show()
			}
		}
	}

	hideMoreInfo() {
		$(".minfobox").addClass("hide")
		$(".minfobox>*").hide()
		$(".phs").empty()
		$(".kws").empty()
		$(".minfoitem").remove()
		$(".minfobox .nomoredata").hide()
	}


	setPager() {
		let pagescount = Math.ceil(this.items.length / this.perPageCount)
		let pagerscount = pagescount > this.maxPagerBtnCount ? this.maxPagerBtnCount : pagescount
		let startnum = this.pagenum - parseInt(this.maxPagerBtnCount / 2)
		if (startnum - 1 < 1)
			startnum = 1
		let ps = $(".pagersub")
		ps.empty()
		if (this.pagenum > 0)
			ps.append(`<a class="prev">&lt</a>`)
		for (let index = startnum; index <= startnum + pagerscount - 1 && index <= pagescount; index++) {
			ps.append(`<a${index - 1 == this.pagenum ? " class=\"sel\"" : ""}>${index}</a>`)
		}
		if (this.pagenum < pagescount - 1)
			ps.append(`<a class="next">&gt</a>`)

		$(".prev").click(function () {
			page.pagenum--
				page.showOnePage()
			page.setPager()
		})

		$(".next").click(function () {
			page.pagenum++
				page.showOnePage()
			page.setPager()
		})

		$(".pagersub>a:not(.prev):not(.next)").click(function () {
			page.pagenum = this.innerText - 1
			page.showOnePage()
			page.setPager()
		})
	}

	processTitle(title) {
		if (typeof title === "undefined")
			return
		return title.replace(/\s-\sZeroNet$/g, "")
	}

	getCORSList(cb) {
		this.cmd("dbQuery", ["select * from search_zite left join json using(json_id) order by date_added desc"], function (res) {
			page.corszites_list = res
			if (cb)
				cb()
		})
	}

	displayCORSList() {
		let listele = $(".list.cors")
		listele.empty()
		for (let index = 0; index < this.corszites_list.length; index++) {
			const element = this.corszites_list[index]
			if (!(element.header && element.site_address && element.date_added && element.site_type))
				continue
			let ele = $(`<div class="item">
                            <div class="content">
                                <a href="javascript:void 0" class="header">Untitled</a>
                                <div class="description"></div>
                            </div>
                        </div>`)

			ele.find(".header").text(element.header).click(function (e) {
				page.EnableOrDisableCORSZite($(this).data("site_address"))
				return false
			}).data("site_address", element.site_address)

			let site_type_label = $(`<span class="ui small label teal">
                                        <i class="tag icon"></i>
                                        <span class="typename"></span>
                                    </span>`)
			let desc = ele.find(".description")
			desc.append(site_type_label.find(".typename").text(element.site_type))

			desc.append($(`<span class="date"></span>`).text(timeagoinstance.format(element.date_added, "en_US")))
			desc.append($(`<span class="user"></span>`).text(element.directory))
			listele.append(ele)
		}
		this.displaySettingsCORSItem()
	}

	submitCORSZite() {
		let item = {}
		item.site_address = $(".siteaddr").val()
		item.date_added = Date.now()
		item.header = $(".szsheader").val()
		item.site_type = $(".dropdown.site_type").dropdown("get value")
		for (let x in item)
			if (item.hasOwnProperty(x) && !item[x]) {
				page.cmd("wrapperNotification", ["info", "Field should not be empty", 3000])
				return
			}
		this.editUserContent(function (json) {
			if (!json.search_zite)
				json.search_zite = []
			json.search_zite.push(item)
		})
	}

	displaySettingsCORSItem() {
		$(".list.cors>.item").each(function () {
			if (page.settings.corszites.indexOf($(this).find(".header").data("site_address")) > -1)
				$(this).addClass("corsinsettings")
			else
				$(this).removeClass("corsinsettings")
		})
	}

	getsettings(cb) {
		page.cmd("userGetSettings", [], function (res) {
			page.settings = res
			if (cb)
				cb()
		})
	}

	setSettings(cb = null) {
		if (typeof this.settings !== "object")
			this.settings = {}
		page.cmd("userSetSettings", [this.settings], function () {
			if (cb)
				cb()
		})
	}

	getFollowedCors() {
		if (!page.corszites_list || !page.settings.corszites)
			return
		page.corszitesForQuery = []
		for (let c of page.corszites_list) {
			if (page.settings.corszites.indexOf(c.site_address) > -1) {
				let duplicate = false
				for (let obj in page.corszitesForQuery)
					if (obj.address === c.site_address)
						duplicate = true
				if (duplicate)
					continue
				if (c.site_address && c.date_added && c.site_type && c.header)
					page.corszitesForQuery.push({
						address: c.site_address,
						type: c.site_type
					})
			}
		}
	}

	EnableOrDisableCORSZite(siteAddr) {
		if (!siteAddr)
			return
		if (typeof this.settings !== "object")
			this.settings = {}
		if (!this.settings.corszites)
			this.settings.corszites = []
		if (this.settings.corszites.indexOf(siteAddr) < 0)
			this.settings.corszites.push(siteAddr)
		else
			delete this.settings.corszites[this.settings.corszites.indexOf(siteAddr)]
		this.setSettings(function () {
			page.getsettings(function () {
				page.displaySettingsCORSItem()
			})
		})
	}

	editUserContent(callback, times = 0) {
		if (times > 1)
			return
		if (!this.site_info.cert_user_id) {
			this.cmd("certSelect", {
				"accepted_domains": ["zeroid.bit"]
			}, function (res) {
				page.editUserContent(callback, times + 1)
			})
			return
		}
		let inner_path = "data/users/" + this.site_info.auth_address + "/data.json"
		page.cmd("fileGet", [inner_path, false], function (res) {
			if (res) {
				try {
					res = JSON.parse(res)
				} catch {
					return
				}
			}
			if (res == null)
				res = {}
			callback(res)
			page.cmd("fileWrite", [inner_path, Text.fileEncode(res)], function (res) {
				if (res === "ok") {
					page.cmd("sitePublish", {
						"inner_path": "data/users/" + page.site_info.auth_address + "/content.json"
					}, function (res) {
						console.log(res)
					})
				} else {
					page.cmd("wrapperNotification", ["error", "File write error: #{res}"])
				}
			})
		})
	}
}

const arrayAverage = arr => arr.reduce((acc, val) => acc + val, 0) / arr.length

page = new Page()


function options() {
	showModalBox("options")
	return false
}

function help() {
	showModalBox("help")
	return false
}

function showModalBox(divclass) {
	$(`.${divclass}`).show()
	$(`.modalbox>div:not(.${divclass})`).hide()
	$(".modal").show()
	$(".modalbox").show()
}

function hideModalBox() {
	$(".modal").hide()
	$(".modalbox").hide()
}


var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"/": "&#x2F;",
	"`": "&#x60;",
	"=": "&#x3D;"
}

function escapeHtml(string) {
	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
		return entityMap[s]
	})
}


function escapeSql(string) {
	return String(string).replace(/[%\\"'_]/g, function (s) {
		return "\\" + s
	})
}

function getSiteRootUrl(url) {
	try {
		return /(http:\/\/127\.0\.0\.1:4311.\/)?([A-Za-z0-9\.]+)/g.exec(url)[2]
	} catch {}
}

function isSiteRoot(url) {
	return /^\s*[0-9A-Za-z\.]+\/?\s*$/g.test(url)
}

class Text {
	static fileEncode(obj) {
		if (typeof obj === "string") {
			return btoa(unescape(encodeURIComponent(obj)))
		} else {
			return btoa(unescape(encodeURIComponent(JSON.stringify(obj, void 0, "\t"))))
		}
	}
}