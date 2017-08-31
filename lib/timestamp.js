var Int53 = require('int53')
var julian = require('julian')

// implements parquet timestamp, as per
// which 8 bytes of little endian nano seconds since start of julian day
// then 4 bytes of little endian julian day. https://en.wikipedia.org/wiki/Julian_day
// https://github.com/prestodb/presto/blob/c73359fe2173e01140b7d5f102b286e81c1ae4a8/presto-hive/src/main/java/com/facebook/presto/hive/parquet/ParquetTimestampUtils.java#L52-L54

var M = 1000000 //multiply milli by 1 million to get nano

exports.encode = function (timestamp, buffer, offset) {
  //parquet-tools cat --json outputs as a base64 string...
  if('string' == typeof timestamp) {
    var b = new Buffer(timestamp, 'base64')
    if(!buffer) return b
    b.copy(buffer, offset||0)
    return b
  }
  if(!buffer) {
    buffer = new Buffer(12)
    offset = 0
  }

  if(isNaN(+timestamp)) throw new Error('expected timestamp, got NaN')

  Int53.writeUInt64LE(
    julian.toMillisecondsInJulianDay(timestamp)*M,
    buffer, offset
  )

  buffer.writeInt32LE(+julian.toJulianDay(timestamp), offset+8)
  return buffer
}
exports.decode = function (buffer, offset) {
  offset = offset || 0
  return julian.fromJulianDayAndMilliseconds(
    buffer.readInt32LE(offset+8),
    Int53.readUInt64LE(buffer, offset)/M
  )
}

