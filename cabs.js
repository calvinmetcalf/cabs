var mkdirp = require('mkdirp');
var crypto = require("crypto");
var fs = require('fs');
var rimraf = require("rimraf");
var path = require('path');

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
}
Cabs.prototype.makeHash = function (input) {
  var hash = crypto.createHash(this.hashFunc);
  hash.write(input);
  hash.end();
  var buffer = hash.read();
  return buffer.toString('hex');
}

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
  var self = this;
  var hash = this.makeHash(chunk);
  var paths = this.hashPaths(hash);
  mkdirp(paths.folder, function (err) {
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
};
Cabs.prototype.read = function(hash, callback) {
  var paths = this.hashPaths(hash);
  fs.readFile(paths.full, callback);
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
module.exports = Cabs;