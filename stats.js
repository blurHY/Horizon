function getDomain(url) {
	if (!url)
		return url
	let index = url.indexOf("/")
	return index >= 0 ? url.substr(0, index) : url
}

function maininfoitem(url, title) {
	return {
		url: url,
		title: (title ? title : "") + " " + getDomain(url)
	}
}


function showPageRelationShip(element, pageid) {
	let chart = echarts.init($("div"))
	let catagories = [
		{name: "Page"}
	]
	page.cmd("dbQuery", [`select sub as target,parent as source,main1.url as target_url,main1.title as target_title,main2.url as source_url,main2.title as source_title from relationship left join main as main1 on target = main1.id left join main as main2 on source = main2.id where target=${pageid} or source=${pageid} limit 1000`], res => {
		let links = res
		let idset = new Set()
		let pageidid = {}
		let maininfo = {}
		for (let i = 0; i < links.length; i++) {
			links[i].id = i
			links[i].name = null
			idset.add(links[i].target)
			idset.add(links[i].source)
			maininfo[links[i].target] = maininfoitem(links[i].target_url, links[i].target_title)
			maininfo[links[i].source] = maininfoitem(links[i].source_url, links[i].source_title)
		}
		let nodes = [...idset]
		for (let i = 0; i < nodes.length; i++) {
			pageidid[nodes[i]] = i
			nodes[i] = {pageid: nodes[i], id: i}
			nodes[i].name = maininfo[nodes[i].pageid].title
			nodes[i].itemStyle = null
			nodes[i].symbolSize = 10
			nodes[i].value = 10
			nodes[i].catagory = 0
			nodes[i].x = nodes[i].y = null
			nodes[i].draggable = true
		}
		for (let i = 0; i < links.length; i++) {
			links[i].target = pageidid[links[i].target]
			links[i].source = pageidid[links[i].source]
		}

		let option = {
			title: {
				text: "Map of Zeronet",
				top: "bottom",
				left: "right"
			},
			tooltip: {
				formatter: function (params) {
					if (params.dataType === "node")
						return params.data.pageid + " " + maininfo[params.data.pageid].url
				},
				position: {
					right: 10,
					bottom: 10
				}
			},
			legend: [{
				data: catagories.map(function (a) {
					return a.name
				})
			}],
			series: [
				{
					name: "Relationship",
					type: "graph",
					layout: "force",
					data: nodes,
					links: links,
					catagories: catagories,
					roam: true,
					force: {
						repulsion: 100,
						layoutAnimation: false
					},
					label: {
						normal: {
							position: "right"
						}
					}
				}
			],
			grid: {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			},
			animation: false
		}
		chart.setOption(option)
		window.onresize = chart.resize
	})
}
