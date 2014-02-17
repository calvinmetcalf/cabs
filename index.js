var util = require('util');
var Cabs = require('./cabs');
var ByteStream = require('byte-stream');
var streams = require('readable-stream');
var Transform = streams.Transform;
var PassThrough = streams.PassThrough;
var pipeline = require('stream-combiner');
var duplexer = require('duplexer');
var through = require('through2');

function flatten(){
  var out = new PassThrough({
    objectMode: true,
    decodeStrings: false
  });
  var thing = through({
    objectMode: true,
    decodeStrings: false
  },function (chunk, _, next){
    chunk.pipe(out, {end: false});
    chunk.on('end',function () {
      next();
    });
  }, function (next) {
    out.emit('end');
    next();
  });
  return duplexer(thing, out);
}

util.inherits(WriteCabs, Transform);

function WriteCabs(basePath, hash) {
  if (!(this instanceof WriteCabs)) {
    return new WriteCabs(basePath);
  }
  Transform.call(this, {
    objectMode:true
  });
  this.cabs = new Cabs(basePath, hash);
  this.written = 0;
}
WriteCabs.prototype._transform = function (chunk, _, callback) {
 var out = {};
 var self = this;
 out.start = this.written;
 this.written += chunk.length;
 out.end = this.written;
 this.cabs.write(chunk, function(err, hash){
  if(err){
    return callback(err);
  }
  out.hash = hash;
  self.push(out);
  callback();
 });
};
util.inherits(ReadCabs, Transform);

function ReadCabs(basePath) {
  if (!(this instanceof ReadCabs)) {
    return new ReadCabs(basePath);
  }
  Transform.call(this, {
    objectMode:true
  });
  this.cabs = new Cabs(basePath);
}
ReadCabs.prototype._transform = function (chunk, _, callback) {
  this.push(this.cabs.read(chunk.hash));
  callback();
};
Cabs.read  = function (path, hash, limit){
  var cabs = new Cabs({
    path: path,
    hashFunc: hash,
    limit: limit
  });
  return cabs.readStream();
};
Cabs.write = function (path, hash, limit){
  var cabs = new Cabs({
    path: path,
    hashFunc: hash,
    limit: limit
  });
  return cabs.writeStream();
};
Cabs.prototype.writeStream = function() {
  var chunker = new ByteStream(this.limit);
  var writer = new WriteCabs(this.basePath, this.hashFunc);
  return pipeline(chunker, writer);
};
Cabs.prototype.readStream = function() {
  var read = new ReadCabs(this.basePath);
  return pipeline(read, flatten());
};
module.exports = Cabs;
