# browser-sync-stream

Rsync between a server and the browser.
Useful if you want to sync larger assets than often change incrementally such as browserify builds.

```
npm install browser-sync-stream
```

## Usage

On a server

``` js
var send = require('browser-sync-stream')
var ws = require('websocket-stream')

ws.createServer({port: 10000}, function (stream) {
  // try to tune the rabin chunker towards smaller chunks / diffs. depends on the max size of your data
  var rabinOptions = {bits: 9, min: 1024, max: 4096} // see the rabin module for options
  stream.pipe(send('a-browserify-bundle-for-example.js', rabinOptions)).pipe(stream)
})
```

In the browser

``` js
var receive = require('browser-sync-stream')
var level = require('level-browserify')
var ws = require('websocket-stream')

var db = level('data.db') // we need a database to store the diff
var diff = 0

var stream = receive(db, function (err, data) {
  console.log('synced a file totaling', data.length, 'bytes')
  console.log('diff was', diff, 'bytes')
})

stream.on('download', function (data) {
  diff += data.length
})

stream.pipe(ws('ws://localhost:10000')).pipe(stream)
```

## Server API

#### `var stream = send(filename, [rabinOptions])`

Creates a send stream that syncs file the file provided by the filename. Options are forwarded to the [rabin](https://github.com/maxogden/rabin) module that is used to chunk the file. Pipe this stream to a browser sync stream running in the browser to sync the file

## Browser API

#### `var stream = receive(db, callback)`

Creates a receive stream that uses the data stored in the provided database (a levelup instance) to sync a file provided by the server.

The way it works is similar to rsync. It uses a simple one round trip protocol where the browser first sends all list of hashes of all the chunks it has locally in its database. This digest is usually pretty small (a few kb for large data). The server then simply chunks the file using the rabin chunker to get consistent chunks even though the file is modified, hashes each chunk and sends a diff to the client. After receiving the diff the client garbage collects old chunks that have been invalidated by the new diff and calls the callback with the total buffer.

## License

MIT
