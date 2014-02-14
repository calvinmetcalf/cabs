var int = require('int-encoder');
var mkdirp = require('mkdirp');
var crypto = require("crypto");
var util = require('util');
var fs = require('fs');
var Transform = require('stream').Transform;
int.alphabet('abcdefghijklmnopqrstuvwxyz0123456789');
function makePath(input) {
  var last;
  var out = [];
  var i = -1;
  var len = input.length;
  while (++i < len) {
    if (last) {
      out.push(last + input[i]);
      last = null;
    } else {
      last = input[i];
    }
  }
  return out;
}
function makeHash(input) {
  var hash = crypto.createHash('sha384');
  hash.write(input);
  hash.end();
  var buffer = hash.read();
  return int.encode(buffer.toString('hex'),16);
}

util.inherits(WriteCabs, Transform);

function WriteCabs(opts) {
  if (!(this instanceof WriteCabs)) {
    return new WriteCabs(opts);
  }
  if (typeof opts === 'string'){
    opts = {
      objectMode:true,
      basePath: opts
    };
  }
  Transform.call(this, opts);
  this.basePath = opts.basePath || './';
  if (this.basePath[-1] !== '/') {
    this.basePath = this.basePath + '/';
  }
  this.current = new Buffer(0);
  this.currentStart = 0;
  this.blockSize = 5 * 1024 * 1024;
}
WriteCabs.prototype._transform = function (chunk, _, callback) {
  this.current = Buffer.concat([this.current, chunk], this.current.length + chunk.length);
  if (this.current.length < this.blockSize) {
    return callback();
  }
  this._flush(callback);
};
WriteCabs.prototype._flush = function (callback) {
  var self = this;
  var hash = makeHash(this.current);
  var pathParts = makePath(hash);
  var fName = pathParts.pop();
  var path = this.basePath + pathParts.join('/');
  mkdirp(path, function (err) {
    if (err) {
      return callback(err);
    }
    var fullPath = path + '/' + fName;
    fs.writeFile(fullPath, self.current, function(err){
      if (err) {
        return callback(err);
      }
      var out = {};
      out.start = self.currentStart;
      out.end = out.start + self.current.length;
      self.currentStart = out.end;
      out.hash = hash;
      self.current = new Buffer(0);
      self.push(out);
      callback();
    });
  });
};
util.inherits(ReadCabs, Transform);

function ReadCabs(opts) {
  if (!(this instanceof ReadCabs)) {
    return new ReadCabs(opts);
  }
  if (typeof opts === 'string'){
    opts = {
      objectMode:true,
      basePath: opts
    };
  }
  Transform.call(this, opts);
  this.basePath = opts.basePath || './';
  if (this.basePath[-1] !== '/') {
    this.basePath = this.basePath + '/';
  }
}
ReadCabs.prototype._transform = function (chunk, _, callback) {
  var path = this.basePath + makePath(chunk.hash).join('/');
  var self = this;
  fs.readFile(path, function (err, data) {
    if (err) {
      return callback(err);
    }
    self.push(data);
    callback();
  });
};
exports.read = ReadCabs;
exports.write = WriteCabs;