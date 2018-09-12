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
	window.progressbox = $(".progressbox")
	window.progressbar = $(".progressbox .progress")
	window.progressbar.progress()
})

function beatifyUrl(link) {
	if (!link) return ""
	link = link.replace(/^\/*(.*?)$/g, "/$1")
	link = link.endsWith("/") ? link.slice(0, -1) : link
	return link
}

class Page extends ZeroFrame {
	setSiteInfo(site_info) {
		this.site_info = site_info
	}

	onOpenWebsocket() {

		$(".help").html(marked(`
### Examples
0chan -porn (Exclude keyword porn)
### About
Learn more on github repo <https://github.com/blurHY/Horizon/projects>
Keywords and phrases are generated by python nlp library, jieba and rake.
`))


		this.perPageCount = 100
		this.maxPagerBtnCount = 4

		$(".minfobox").click(() => false)
		$("a#options").click(options)
		$("a#help").click(help)
		$(".modalbox").click(() => false)
		$(".settingbtn").click(function (ev) {
			ev.stopPropagation()
			page.switchPage("settingspage")
		})

		$(".logosmall").click(function () {
			page.switchPage("defaultpage")
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

		this.initCORS()
		this.getsettings()

		$(".ui.dropdown").dropdown({
			values: [{
				name: "ZeroTalk",
				value: "ZeroTalk"
			},
				{
					name: "ZeroBlog",
					value: "ZeroBlog"
				},
				{
					name: "ZeroWiki",
					value: "ZeroWiki"
				},
				{
					name: "ZeroUp",
					value: "ZeroUp"
				}
			]
		}).find(".default").text("Type")

		$(".q").keydown(function (ev) {
			if (ev.key === "Enter" && $(this).val().trim() !== "") {
				page.Search(this.value)
			}
		})
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

	checkPermiRes(res) {
		if (res !== "ok" && res !== "ignored") {
			page.cmd("wrapperNotification", ["info", "We use CORS to search in other sites.Please grant it (refresh page first).", 5000])
		}
	}

	initCORS() {
		this.cmd("corsPermission", ["1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT"], function (res) {
			page.checkPermiRes(res)
			page.cmd("corsPermission", ["1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB"], function (res) {
				page.checkPermiRes(res)
				page.cmd("corsPermission", ["138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP"], function (res) {
					page.checkPermiRes(res)
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
					page.checkPermiRes(res)
					f(index + 1)
				})
			else
				f(index + 1)
		}

		f(0)
	}

	generateOrderBys(fields) {
		let arr = []
		for (let f of fields)
			for (let q in this.querySplited)
				arr.push(`lower(${f} like '%${escapeSql(this.querySplited[q]).toLowerCase()}%') desc`)
		return arr.join(",")
	}

	genZeroTalkQuery(mode = "and", siteaddr) {
		let wheres = this.generateLikes("topic.title", "topic.body", mode)
		return `SELECT
			        COUNT(comment_id) AS comments_num, MAX(comment.added) AS last_comment, topic.added as last_added, CASE WHEN MAX(comment.added) IS NULL THEN topic.added ELSE MAX(comment.added) END as last_action,
			        topic.*,
			        topic_creator_user.value AS topic_creator_user_name,
			        topic_creator_content.directory AS topic_creator_address,
			        topic.topic_id || '_' || topic_creator_content.directory AS row_topic_uri,
			        NULL AS row_topic_sub_uri, NULL AS row_topic_sub_title,
			        (SELECT COUNT(*) FROM topic_vote WHERE topic_vote.topic_uri = topic.topic_id || '_' || topic_creator_content.directory)+1 AS votes,
			        CASE topic.topic_id || '_' || topic_creator_content.directory WHEN '2_1J3rJ8ecnwH2EPYa6MrgZttBNc61ACFiCj' THEN 1 WHEN '8_1J3rJ8ecnwH2EPYa6MrgZttBNc61ACFiCj' THEN 1 ELSE 0 END AS sticky,
			        "${escapeSql(siteaddr)}" as siteaddr
				FROM topic
					LEFT JOIN json AS topic_creator_json ON (topic_creator_json.json_id = topic.json_id)
					LEFT JOIN json AS topic_creator_content ON (topic_creator_content.directory = topic_creator_json.directory AND topic_creator_content.file_name = 'content.json')
					LEFT JOIN keyvalue AS topic_creator_user ON (topic_creator_user.json_id = topic_creator_content.json_id AND topic_creator_user.key = 'cert_user_id')
					LEFT JOIN comment ON (comment.topic_uri = row_topic_uri AND comment.added < ${(Date.now() / 1000 + 120)})
				WHERE ${wheres}
				GROUP BY topic.topic_id, topic.json_id
				HAVING last_action < ${(Date.now() / 1000 + 120)}
				order by ${this.generateOrderBys(["topic.title", "topic.body"])},votes,comments_num,last_action
				Limit 1000
				`
	}

	genZeroSitesQuery() {
		let wheres_zerosites = this.generateLikes("title", "description")
		let query0s = `SELECT site.*, json.*, COUNT(site_star.site_uri) AS star, site_stat.*
       FROM site
       LEFT JOIN json USING (json_id)
       LEFT JOIN site_star ON (site_star.site_uri = json.directory || "_" || site.site_id)
       LEFT JOIN site_stat ON (site_stat.site_uri = json.directory || "_" || site.site_id)
       WHERE ${wheres_zerosites}
       GROUP BY site.json_id, site_id`
		return query0s
	}

	searchCORS(cb) { // callback,keywords
		let wikiAddr = "138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP"
		let talkAddr = "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT"
		let sitesAddr = "1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB"
		page.cmd("as", [wikiAddr, "dbQuery", this.genWikiQuery(wikiAddr)], function (wikires) {
			page.cmd("as", [talkAddr, "dbQuery", page.genZeroTalkQuery("or", talkAddr)], function (talkres) {
				page.cmd("as", [sitesAddr, "dbQuery", page.genZeroSitesQuery(sitesAddr)], function (zerositesres) {
					page.zerositesres = zerositesres
					page.talkres = talkres
					page.wikires = wikires
					console.log(zerositesres)
					console.log(talkres)
					console.log(wikires)
					page.getFollowedCors()
					page.searchFollowedCORS(cb)
				})
			})
		})
	}

	genQuery(type, siteaddr) {
		switch (type) {
			case "ZeroWiki":
				return this.genWikiQuery(siteaddr)
			case "ZeroTalk":
				return this.genZeroTalkQuery("and", siteaddr)
			case "ZeroBlog":
				return this.genZeroBlogQuery("or", siteaddr)
			case "ZeroUp":
				return this.genZeroUpQuery(siteaddr)
			default:
				return null
		}
	}

	insertItems(dbQueryRes, random) {
		// Randomly insert ZeroTalk&ZeroUp items (because that's sorted)
		// Make ZeroBlog items rank ahead (User subscribed)
		console.log(dbQueryRes)

		function randomInsert(startnum, endnum, step, array) {
			for (let i = 0; i < array.length; i++) {
				page.searchResult.splice(startnum + i * step + 1, 0, array[i])
			}
		}

		if (random) {
			let start = Math.ceil(this.perPageCount / 2)
			let end = this.searchResult.length
			let count = (end - start)
			let step = count / dbQueryRes.length
			if (!isFinite(step))
				step = 0
			randomInsert(start, end, step, dbQueryRes)
		} else { // For zeroblog
			let start = Math.ceil(this.perPageCount / 3)
			let end = this.perPageCount
			let count = (end - start)
			let countonpage = count / 3
			let step = count / countonpage
			randomInsert(start, end, step, dbQueryRes.slice(0, countonpage))

			start = this.perPageCount
			end = this.searchResult.length
			count = (end - start)
			let left = dbQueryRes.slice(countonpage)
			step = count / left
			if (!isFinite(step))
				step = 0
			randomInsert(start, end, step, left)
		}
	}

	searchFollowedCORS(cb) { //CORS in settings
		function next(index) {
			if (index >= page.corszitesForQuery.length) {
				cb()
				return
			}
			let item = page.corszitesForQuery[index]
			let query = page.genQuery(item.type, item.address)
			if (query)
				page.cmd("as", [item.address, "dbQuery", query], function (res) {
					switch (item.type) {
						case "ZeroWiki":
							page.carditems.push(page.processWikiRes(res, item.address))
							break
						case "ZeroBlog":
							page.insertItems(res, false)
						case "ZeroTalk":
						case "ZeroUp":
							page.insertItems(res, true)
					}
					next(index + 1)
				})
			else
				next(index + 1)
		}

		next(0)
	}

	genWikiQuery(siteaddr) {
		let conds = []
		for (let x in this.querySplited) {
			conds.push(`lower(slug) like "%${escapeSql(this.querySplited[x].toLowerCase())}%" escape "\\"`)
			conds.push(`lower(slug) like "%${escapeSql(encodeURIComponent(this.querySplited[x].toLowerCase()).toLowerCase())}%" escape "\\"`) // Some Chinese wiki encoded slug
			conds.push(`lower(slug) like "%${escapeSql(encodeURIComponent(this.querySplited[x].toUpperCase()).toLowerCase())}%" escape "\\"`)
		}
		return `select body,date_added,slug,"${escapeSql(siteaddr)}" as siteaddr,"/${escapeSql(siteaddr)}/?Page:" || slug as link from pages where date_added in (select max(date_added) from pages where ${conds.join(" or ")} group by slug limit 2) order by length(body) desc,date_added desc limit 2`
	}

	genZeroBlogQuery(mode = "or", siteaddr) {
		return `select *,"${escapeSql(siteaddr)}" as siteaddr from post where ${this.generateLikes("body", "title", mode)} order by ${this.generateOrderBys(["title", "body"])} limit 50`
	}

	genZeroUpQuery(siteaddr) {
		return `select *,"${escapeSql(siteaddr)}" as siteaddr from file left join json using(json_id) where ${this.generateLikes("file.title", "file.file_name", "or")} order by ${this.generateOrderBys(["file.title", "file.file_name"])} Limit 50`
	}

	processWikiBody(body, addr) {
		return body.replace(/\[\[([A-Za-z0-9\-\s]+)\]\]/g, str => ` [${str.slice(2, -2)}](/${addr}/?Page:` + encodeURI(str.slice(2, -2)) + ") ")
	}


	Search(text) {
		let lastnow = Date.now()
		showProgress(10, "Parsing query")
		this.searchQuery = text.trim()
		this.parseQuery()
		this.searchResult = []
		this.carditems = []

		function allSearched() {
			page.processWikiRes(page.wikires, "138R53t3ZW7KDfSfxVpWUsMXgwUnsDNXLP")
			page.carditems = page.carditems.concat(page.wikires)
			page.displayCards()
			page.displayItems()
			let time = (Date.now() - lastnow) / 1000
			showProgress(100, "Done")
			page.showStat(page.searchResult.length, time)
		}

		showProgress(60, "Querying in main database")

		this.searchMain(() => {
			showProgress(95, "Rendering")
			page.searchResult.sort((a, b) => b.itemrank - a.itemrank)
			if (this.searchResult.length < 50) {
				this.fuzzysearch = true
				showProgress(75, "Collecting more infomation")
				page.searchResult = []
				this.searchMain(() => {
					this.searchCORS(() => {
						allSearched()
					})
				})
			} else
				this.searchCORS(() => {
					allSearched()
				})
		})
	}

	processWikiRes(res, siteAddr) {
		for (let wi in res) { // only process zerowiki
			res[wi].body = page.processWikiBody(res[wi].body, siteAddr)
			res[wi].datetime = timeagoinstance.format(res[wi].date_added)
			res[wi].title = res[wi].slug
			res[wi].type = "Wiki"
		}
	}

	parseQuery() {
		this.querySplited = this.searchQuery.split(/\s+/g).filter(filterblank)
		let lastEle = this.querySplited[this.querySplited.length - 1]
		let res = /^options?:(.*)$/gi.exec(lastEle)
		this.querySplited.sort((b, a) => a.length - b.length) // from long to short
		this.fuzzysearch = false
		if (res) {
			this.options = res[1].split(/,|\s+/g).filter(filterblank)
			this.options.map(o => o.toLowerCase())
			this.fuzzysearch = this.options.indexOf("fuzzy")
			delete this.querySplited[this.querySplited.length - 1]
		}
		this.excludeQueries = []
		for (let x in this.querySplited) {
			let res = /^(\+|-)(.*)$/.exec(this.querySplited[x])
			if (res) {
				this.excludeQueries.push(res[2])
				delete this.querySplited[x]
			}
		}
	}

	generateLikes(onlyExclude) {
		let qs = []
		let mode = "and"
		if (arguments[arguments.length - 1] === "or" || arguments[arguments.length - 1] === "and" || arguments[arguments.length - 1] === "exclude") {
			mode = arguments[arguments.length - 1]
			delete arguments[arguments.length - 1]
		}
		if (mode !== "exclude") {
			for (let f in arguments) { // fields
				for (let q in this.querySplited) {
					qs.push(`lower(${arguments[f]}) like "%${escapeSql(this.querySplited[q]).toLowerCase()}%" escape "\\"`)
				}
			}
			qs = qs.join(` ${mode} `)
		}
		else
			qs = ""
		let final = qs
		if (this.excludeQueries.length > 0) {
			let eq = []
			for (let f in arguments) {
				for (let q in this.excludeQueries)
					eq.push(`lower(${arguments[f]}) not like "%${escapeSql(this.excludeQueries[q]).toLowerCase()}%" escape "\\"`)
			}
			if (mode !== "exclude")
				final = `(${final}) and ${eq.join(" and ")}`
			else
				final = eq.join(" and ")
		}
		return final
	}

	searchMain(cb, type = "normal") {
		let query = ""
		let finalfilter = this.generateLikes("title", "keyw", "phrs", "exclude")
		switch (type) {
			case "normal":
				query = `select 
						url,main.id,keyw,phrs,itemrank,title,imgcount,state 
						from
						(
							select result.id,group_concat(keyw) as keyw,group_concat(phrs) as phrs,count(id) as itemrank
							from 
								(
									select * from (select id,NULL as keyw,NULL as phrs from main where ${this.generateLikes("url", "title", this.fuzzysearch ? "or" : "and")} limit 10000)
									union all
									select * from (select pageid as id,keyword as keyw,NULL as phrs from keywords where ${this.generateLikes("keywords.keyword", "or")} limit 10000)
									union all
									select * from (select pageid as id,NULL as keyw,phrase as phrs from phrases where ${this.generateLikes("phrases.phrase", this.fuzzysearch ? "or" : "and")} limit 10000)
								)
							as result group by id limit 10000
						) as firstres
						,main
						where firstres.id=main.id ${finalfilter.trim() ? `and ${finalfilter}` : ""}
						order by itemrank,state,imgcount,main.id desc
						limit 10000`
				break
		}
		console.log(query)
		this.cmd("dbQuery", [query], (res) => {
			this.searchResult = this.searchResult.concat(res)
			cb()
		})
	}

	showStat(rowc, time) {
		$("div.stat").show()
		$(".rowc").text(rowc)
		$(".sec").text(time)
		this.resetProgress()
	}

	resetProgress() {
		progressbox.hide()
		progressbar.hide()
		progressbar.progress("reset")
	}

	ellipsis(text, len) {
		if (typeof text === "undefined")
			return
		return text.length > len ? text.slice(0, len) + "..." : text
	}


	displayCards() {
		this.clearCards()
		if (document.body.clientWidth < 760)
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
		card.find(".cardtitle").text(item.title).attr("href", item.link ? item.link : "javascript:void 0")
		if (!markdown)
			item.card.find(".cardbody").text(item.body)
		else
			card.find(".cardbody").html(marked(item.body, {
				sanitize: true
			}))
		if (item.datetime)
			card.find(".date_added").text(item.datetime)
		if (item.user)
			card.find(".user").text(item.user)
		if (item.type)
			card.find(".cardtype").text(item.type)
		return card
	}

	generateItem(title, imgc, id, link, description) {
		let ele = $(".item.template").clone()

		let oringinal_link = beatifyUrl(link)
		link = this.processLink(oringinal_link)

		if (!title) title = link
		title = this.processTitle(title)

		title = this.ellipsis(title, 60)

		ele.find("a.ititle").html(this.highlightedText(title)).attr("href", link)

		let type = ele.find(".type")

		if (isSiteRoot(link))
			type.text("SiteRoot").addClass("green")

		if (type.text() === "")
			type.remove()
		link = this.ellipsis(link, 50)
		ele.find(".link").html(this.highlightedText(link))
		ele.data("id", id)

		if (imgc > 0) {
			ele.find("span.imgc").remove()
			ele.find("span.imgcc").remove()
		} else ele.find("span.imgcc").text(imgc)

		ele.find(".kwsphs").html(this.highlightedText(description))
		ele.removeClass("template")

		return ele
	}

	generateItem_addZerositesData(item, ele) {
		for (let index = 0; index < this.zerositesres.length; index++) {
			const element = this.zerositesres[index]
			if (!element)
				continue
			if (beatifyUrl(element.address) === beatifyUrl(item.url)) {
				ele.find(".zsinfo").addClass("visible")
				ele.find(".zsinfo .zstitle").text(element.title)
				ele.find(".zsinfo .zsdescription").text(element.description)
				ele.find(".zsinfo .zsdateadded").text(timeagoinstance.format(element.date_added * 1000))
				ele.find(".zsinfo .zsstar").text(element.star)
				if (element.peers)
					ele.find(".zsinfo .zspeer").text(element.peers)
			}
		}
	}

	generateItem_addZerotalkData(item, ele) {
		ele.find(".ztinfo").addClass("visible")
		ele.find(".ztvote").text(item.vote)
		ele.find(".ztcommentsnum").text(item.comments_num)
		ele.find(".ztcreator").text(item.topic_creator_user_name)
		ele.find(".ztlastaction").text(timeagoinstance.format(item.last_action * 1000))
	}

	generateItem_addZeroUpData(item, ele) {
		ele.find(".zuinfo").addClass("visible")
		ele.find(".zusize").text(humanFileSize(item.size))
		ele.find(".zudate").text(timeagoinstance.format(item.date_added * 1000))
		ele.find(".zuuser").text(item.cert_user_id)
	}


	generateItem_addZeroBlogData(item, ele) {
		ele.find(".zbinfo").addClass("visible")
		ele.find(".zbbody").text(this.ellipsis(item.body, 140))
		ele.find(".zbdate").text(timeagoinstance.format(item.date_published * 1000))
	}

	getKeywordsPositions(kws, str) {
		let poses = []
		str = str.toLowerCase()

		function getSingleKwPoses(keyw, str, offset = 0) {
			keyw = keyw.toLowerCase()
			let i = str.substr(offset).indexOf(keyw)
			if (i >= 0) {
				poses.push([offset + i, keyw.length])
				getSingleKwPoses(keyw, str, offset + i + keyw.length)
			}
		}

		for (let x in kws)
			getSingleKwPoses(kws[x], str)
		return poses
	}

	highligtRanges(text, arr) {
		arr.sort(function (a, b) {
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
		poses.sort(function (a, b) {
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
		if (typeof text == "undefined" || text === "")
			return ""
		return this.highligtRanges(text, this.getKeywordsPositions(this.querySplited, text))
	}

	emptyItem() {
		$(".container-left>.item:not(.template)").remove()
	}

	processLink(link) {
		return link.replace(/^\/*(.*)/g, "/$1")
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
		if (this.searchResult.length < 1) {
			cot.append(this.generateItem("Sorry,noting found", 0, null, "/", "Please type fewer keywords.And use whitespace to separate them"))
		}
		if (this.pagenum > 0) {
			$("div.stat").hide()
			page.clearCards()
		}
		let start = this.pagenum * this.perPageCount
		let items = this.searchResult.slice(start, start + this.perPageCount)
		for (let i of items) {
			let item = null
			if (typeof i.imgcount !== "undefined") { // normal search result row
				item = this.generateItem(i.title, i.imgcount, i.id, i.url, (i.keyw ? i.keyw : "") + (i.phrs ? i.phrs : ""))
				this.generateItem_addZerositesData(i, item)
			}
			else if (i.topic_creator_user_name) { // item of zerotalk result
				item = this.generateItem(i.title, 0, i.siteaddr + i.topic_id, i.siteaddr + "/?Topic:" + i.row_topic_uri, this.ellipsis(i.body, 150))
				this.generateItem_addZerotalkData(i, item)
			}
			else if (i.file_name) { // ZeroUp
				item = this.generateItem(i.title, 0, i.siteaddr + i.date_added + i.json_id + i.size, `${i.siteaddr}/${i.directory}/${i.file_name}`)
				this.generateItem_addZeroUpData(i, item)
			}
			else if (i.post_id) {
				item = this.generateItem(i.title, 0, i.siteaddr + i.post_id, `${i.siteaddr}/?Post:${i.post_id}`)
				this.generateItem_addZeroBlogData(i, item)
			}
			else {
				item = this.generateItem("Unknown", 0, null, "/", "Unknown result item")
			}
			cot.append(item)
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
			let notempty = false
			if (!notempty)
				$(".minfobox .nomoredata").show()
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
		let pagescount = Math.ceil(this.searchResult.length / this.perPageCount)
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
		this.cmd("dbQuery", [`select distinct site_address,site_type,replace(directory,'users/','') as directory,date_added,substr(header,0,40) as header from search_zite left join json using(json_id) where date_added < ${Date.now()} order by date_added desc`], function (res) {
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
                                        <span class="typename ui small label olive"></span>
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
		if (!page.settings || !page.settings.corszites)
			return
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
		page.corszitesForQuery = []
		if (!page.corszites_list || !page.settings.corszites)
			return
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
				page.initCORS()
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
	return String(string).replace(/[&<>"'`=\/]/g, s => entityMap[s])
}


function escapeSql(string) {
	return String(string).replace(/[%\\"'_]/g, function (char) {
		switch (char) {
			case "'":
				return "''"
			case "\"":
				return "\"\""
			default:
				return "\\" + char
		}
	})
}

function getSiteRootUrl(url) {
	try {
		return /(http:\/\/127\.0\.0\.1:4311.\/)?([A-Za-z0-9\.]+)/g.exec(url)[2]
	} catch {
	}
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

function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024
	if (Math.abs(bytes) < thresh) {
		return bytes + " B"
	}
	var units = si ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
	var u = -1
	do {
		bytes /= thresh
		++u
	} while (Math.abs(bytes) >= thresh && u < units.length - 1)
	return bytes.toFixed(1) + " " + units[u]
}

function showProgress(percent, label) {
	progressbox.show()
	progressbar.show()
	scrollTo(0, 0)
	if ($(".defaultpage").hasClass("hide"))
		progressbox.addClass("resultstate")
	else
		progressbox.removeClass("resultstate")
	progressbar.progress({
		percent
	})
	progressbar.progress("set label", label)
}