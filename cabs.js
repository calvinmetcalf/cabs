var int = require('int-encoder');
var mkdirp = require('mkdirp');
var crypto = require("crypto");
var fs = require('fs');
var rimraf = require("rimraf");
var path = require('path');
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

function Cabs(basePath) {
  if(!(this instanceof Cabs)){
    return new Cabs(basePath);
  }
  if(!basePath){
    throw new Error('path required');
  }
  this.basePath = basePath;
}

Cabs.prototype.hashPaths = function(hash) {
  var pathParts = makePath(hash);
  var folderName = path.join(this.basePath, pathParts[0]);
  var fileName = pathParts.slice(1).join('');
  return {
    folder: folderName,
    file: fileName,
    full: path.join(folderName, fileName)
  }
}

Cabs.prototype.write = function(chunk, callback) {
  var self = this;
  var hash = makeHash(chunk);
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
  var self = this;
  var paths = this.hashPaths(hash);
  fs.unlink(paths.full, function (err) {
    if (err) {
      return callback(err);
    }
    // try and clean up empty folders
    fs.rmdir(paths.folder, function(err) {
      // ignore errors
      callback();
    });
  });
};
Cabs.prototype.destroy = function(callback) {
  rimraf(this.basePath, callback);
};
module.exports = Cabs;