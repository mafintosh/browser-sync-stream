var fs = require('fs')
var rabin = require('rabin')
var crypto = require('crypto')
var lpstream = require('length-prefixed-stream')
var duplexify = require('duplexify')

module.exports = send

function send (filename, opts) {
  var chunks = {}
  var decode = lpstream.decode()
  var encode = lpstream.encode()
  var stream = duplexify.obj(decode, encode)
  var incoming = {}
  var order = []

  fs.createReadStream(filename).pipe(rabin(opts))
    .on('data', function (data) {
      stream.emit('indexing', data.length)
      var hash = crypto.createHash('sha256').update(data).digest()
      var key = hash.toString('hex')
      chunks[key] = data
      order.push(key)
    })
    .on('end', function () {
      decode.on('data', function (hash) {
        if (hash.length === 1 && hash[0] === 0) return end()
        incoming[hash.toString('hex')] = true
      })

      function end () {
        for (var i = 0; i < order.length; i++) {
          var key = order[i]
          var hash = Buffer(key, 'hex')
          if (incoming[key]) {
            encode.write(hash)
          } else {
            stream.emit('upload', chunks[key])
            encode.write(Buffer.concat([hash, chunks[key]]))
          }
        }
        encode.end()
      }
    })

  return stream
}
