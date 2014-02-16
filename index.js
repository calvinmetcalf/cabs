var util = require('util');
var Cabs = require('./cabs');
var ByteStream = require('byte-stream');
var Transform = require('readable-stream').Transform;
var pipeline = require('stream-combiner');

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
  var self = this;
  this.cabs.read(chunk.hash, function (err, data){
    if (err) {
      return callback(err);
    }
    self.push(data);
    callback();
  });
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
  return new ReadCabs(this.basePath);
};
module.exports = Cabs;
