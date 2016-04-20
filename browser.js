var duplexify = require('duplexify')
var lpstream = require('length-prefixed-stream')

module.exports = receive

function receive (db, cb) {
  var decode = lpstream.decode()
  var encode = lpstream.encode()
  var old = {}
  var active = {}
  var result = []
  var batch = []
  var stream = duplexify.obj(decode, encode)

  decode.on('data', function (data) {
    var hash = data.slice(0, 32)
    var chunk = data.slice(32)
    var key = hash.toString('hex')
    if (!chunk.length) {
      active[key] = true
      chunk = old[key]
    } else {
      stream.emit('download', chunk)
      batch.push({type: 'put', key: key, value: data})
    }
    result.push(chunk)
  })

  decode.on('end', function () {
    var keys = Object.keys(old)

    for (var i = 0; i < keys.length; i++) {
      if (!active[keys[i]]) batch.push({type: 'del', key: keys[i]})
    }

    db.batch(batch, function (err) {
      if (err) return cb(err)
      cb(null, Buffer.concat(result))
    })
  })

  db.createValueStream({valueEncoding: 'binary'})
    .on('data', function (data) {
      data = Buffer(data)
      var hash = data.slice(0, 32)
      old[hash.toString('hex')] = data.slice(32)
      encode.write(hash)
    })
    .on('end', function () {
      encode.write(Buffer([0])) // end of stream
    })

  return stream
}
