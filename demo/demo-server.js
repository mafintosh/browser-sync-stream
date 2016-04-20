var send = require('../')
var ws = require('websocket-stream')

ws.createServer({port: 10000}, function (stream) {
  stream.pipe(send('demo-bundle.js', {bits: 9, min: 1024, max: 4096})).pipe(stream)
})
