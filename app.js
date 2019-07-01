let restify = require('restify'),
    rp = require('request-promise'),
    corsMiddleware = require("restify-cors-middleware")
const cors = corsMiddleware({
    origins: ["*"],
    allowHeaders: ["Authorization"],
    exposeHeaders: ["Authorization"]
});
const server = restify.createServer({
    name: 'horizon',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.pre(cors.preflight);
server.use(cors.actual);

server.get('/q/:query', async function (req, res, next) {
    console.log(req.params.query)
    res.send(JSON.parse(await rp("http://127.0.0.1:9200/_search?" + encodeURI(req.params.query))));
    return next();
});
server.get('/get/:index/:id', async function (req, res, next) {
    console.log(req.params)
    res.send(JSON.parse(await rp(`http://127.0.0.1:9200/${req.params.index}/_doc/${req.params.id}`)));
    return next();
});

server.listen(8021, function () {
    console.log('%s listening at %s', server.name, server.url);
});