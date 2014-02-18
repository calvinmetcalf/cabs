var mkdirp = require('mkdirp');
var crypto = require("crypto");
var fs = require('fs');
var rimraf = require("rimraf");
var path = require('path');
var duplexer = require('duplexer');
var through = require('through2');
var Chunker = require('./chunker');
var PassThrough = require('readable-stream').PassThrough;
var pipeline = require('stream-combiner');

function readCabs(cabs) {
  return through({
    objectMode:true
  }, function (chunk, _, callback) {
  this.push(cabs.read(typeof chunk === 'string'? chunk : chunk.hash));
  callback();
});
}
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
function psudoRandomish(){
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}
Cabs.prototype.makePath = function (input) {
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
};
Cabs.prototype.makeHash = function (input) {
  var hash = crypto.createHash(this.hashFunc);
  hash.write(input);
  hash.end();
  var buffer = hash.read();
  return buffer.toString('hex');
};

function Cabs(opts, hash, limit) {
  if(!(this instanceof Cabs)){
    return new Cabs(opts, hash, limit);
  }
  if (typeof opts === 'string') {
    opts = {
      path: opts,
      hashFunc: hash,
      limit: limit
    };
  }
  if (typeof opts.hashFunc === 'number') {
    opts.limit = opts.hashFunc;
    opts.hashFunc = undefined;
  }
  if(!opts.path){
    throw new Error('path required');
  }
  this.limit = opts.limit || 5 * 1024 * 1024;
  this.hashFunc = opts.hashFunc || 'sha256';
  this.basePath = opts.path;
  this.depth = opts.depth || 3;
}

Cabs.prototype.hashPaths = function(hash) {
  var pathParts = this.makePath(hash);
  var folders = [this.basePath];
  var i = -1;
  if (this.depth >= pathParts.length) {
    folders.push(pathParts.shift());
  } else {
    while (++i < this.depth) {
      folders.push(pathParts.shift());
    }
  }
  var folderName = path.join.apply(null, folders);
  var fileName = pathParts.join('');
  return {
    folder: folderName,
    file: fileName,
    full: path.join(folderName, fileName)
  };
};

Cabs.prototype.write = function(chunk, callback) {
  var hash, paths;
  var self = this;
  if (chunk && callback) {
    hash = this.makeHash(chunk);
    paths = this.hashPaths(hash);
    return mkdirp(paths.folder, function (err) {
      if (err) {
        return callback(err);
      }
      fs.writeFile(paths.full, chunk, function(err){
        if (err) {
          return callback(err);
        }
        callback(null, hash);
      });
    });
  }
  hash = crypto.createHash(this.hashFunc);
  var tempPath = path.join(this.basePath, 'tmp');
  var tempFile = path.join(tempPath, psudoRandomish());
  var psopts = {
    objectMode: true,
    decodeStrings: false
  };
  var output = new PassThrough(psopts);
  var input = new PassThrough(psopts);
  mkdirp(tempPath, function (err){
    if (err) {
      output.emit('error', err);
      return;
    }
    var fstream = fs.createWriteStream(tempFile);
    input.pipe(hash);
    input.pipe(fstream);
    input.on('end', function (){
      var fileHash = hash.read().toString('hex');
      var hashPath = self.hashPaths(fileHash);
      mkdirp(hashPath.folder, function (err){
        if (err) {
          output.emit('error', err);
          return;
        }
        var outStream = fs.createWriteStream(hashPath.full);
        var fromTemp = fs.createReadStream(tempFile);
        fromTemp.pipe(outStream);
        fromTemp.on('end', function (){
          fs.unlink(tempFile, function (err) {
            if (err) {
              output.emit('error', err);
            } else {
              fs.rmdir(tempPath, function () {
                output.write(fileHash);
                output.end();
              });
            }
          });
        });
      });
    });
  });
  return duplexer(input, output);
};
Cabs.prototype.read = function(hash, callback) {
  var paths = this.hashPaths(hash);
  if (callback) {
    fs.readFile(paths.full, callback);
  } else {
    return fs.createReadStream(paths.full);
  }
};
Cabs.prototype.rm = function(hash, callback) {
  var pathParts = this.hashPaths(hash).full.split(path.sep);
  pathParts.shift();
  var self = this;
  var ourPath = path.join(self.basePath,path.join.apply(undefined, pathParts));
  function checkEmpty(){
    pathParts.pop();
    if(!pathParts.length){
      return callback();
    }
    var dirPath = path.join(self.basePath,path.join.apply(undefined, pathParts));
    fs.rmdir(dirPath, function (err){
      if(err){
        return callback();
      } else {
        process.nextTick(checkEmpty);
      }
    });
  }
  fs.unlink(ourPath, function (err) {
    if (err) {
      return callback(err);
    }
    checkEmpty();
  });
};
Cabs.prototype.destroy = function(callback) {
  rimraf(this.basePath, callback);
};
Cabs.prototype.check = function (hash, callback) {
  var self = this;
  fs.readFile(this.hashPaths(hash).full, function (err, file) {
    if (err) {
      return callback(err);
    }
    if (self.makeHash(file) === hash) {
      return callback(null, true);
    } else {
      return callback(new Error("hash doesn't match"));
    }
  });
};
Cabs.prototype.has = function (hash, callback) {
  fs.exists(this.hashPaths(hash).full, function(answer) {
    callback(null, answer);
  });
};
Cabs.prototype.writeStream = function() {
  return new Chunker(this, this.limit);
};
Cabs.prototype.readStream = function() {
  return pipeline(readCabs(this), flatten());
};
module.exports = Cabs;