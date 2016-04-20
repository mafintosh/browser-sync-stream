var receive = require('../')
var level = require('level-browserify')
var ws = require('websocket-stream')

var db = level('sync.db')
var downloaded = 0

var stream = receive(db, function (err, data) {
  console.log('downloaded buffer:', data.length, '(transferred ' + downloaded + ' bytes)')
})

stream.on('download', function (chunk) {
  downloaded += chunk.length
  console.log('downloading', chunk.length, 'bytes')
})

stream.pipe(ws('ws://localhost:10000')).pipe(stream)
