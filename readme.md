cabs
====

A [Content Addressable Blob Store](https://en.wikipedia.org/wiki/Content-addressable_storage) for Node.

[![NPM](https://nodei.co/npm/cabs.png)](https://nodei.co/npm/cabs/)

By default this implements the object store (`.git/objects` folder) from `git`, where blobs are `sha1` hashed and stored in subdirectories to avoid putting too many files in a single directory.

write
====

```javascript
cabs.write(path, limit);
```

Pipe in a blob stream (e.g. fs.createReadStream), get back objects for the various pieces stored. Each object has a hash of the block, as well as the starting and ending locations within the stream.
```

read
====

```javascript
cabs.read(path);
```

Pipe in the objects from write, returns a readable stream of the blob.

example
====

```js
var fs = require('fs')
var cabs = require('cabs')

// stream a movie into cabs, store hashes in hashes.json
fs.createReadStream('movie.avi')
  .pipe(cabs.write('./storage))
  .pipe(fs.createWriteStream('hashes.json'))
  
// later, to retrieve the movie, stream the hashes into cabs
fs.createReadStream('hashes.json')
  .pipe(cabs.read('./storage))
  .pipe(fs.createWriteStream('movie-copy.avi'))
```

Low Level Class
=====

you also have access to the base Cabs class located at `cabs.Cabs`, initialize it with a location and it has the following methods.

```javascript
var store = new cabs.Cabs('./location');

store.write(buffer, callback);
//stores buffer, callback is called with the hash

store.read(hash, callback);
//calls the callback with the blob

store.rm(hash, callback);
//removes the file with the given hash

store.destroy(callback);
//deletes all the files related to the store, just a shortcut to rimraf so beaware.
```