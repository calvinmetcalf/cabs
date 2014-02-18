cabs
====

A [Content Addressable Blob Store](https://en.wikipedia.org/wiki/Content-addressable_storage) for Node.

[![NPM](https://nodei.co/npm/cabs.png)](https://nodei.co/npm/cabs/)

This implements something similar to the object store from `git` (the `.git/objects` folder). By default blobs stored by cabs are `sha256` hashed and stored in subdirectories to avoid putting too many files in a single directory. The hashing algorithm and depth of the directories are configurable.

write
====

```js
Cabs.write(path[, hashFunction, limit]);
```

Pipe in a blob stream (e.g. fs.createReadStream), get back objects for the various pieces stored. Each object has a hash of the block, as well as the starting and ending locations within the stream. You may optionally pass a string representing the hash function to use (default `sha256`) and number representing the block size (defaults to 5 MB).

To learn more about hashing algorithm tradeoffs read the comments on [this issue](https://github.com/calvinmetcalf/cabs/pull/4).

read
====

```js
Cabs.read(path);
```

Pipe in the objects from write, returns a readable stream of the blob.

example
====

```js
var fs = require('fs')
var Cabs = require('cabs')

/** stream a movie into cabs, store hashes in hashes.json **/
fs.createReadStream('movie.avi')
  .pipe(Cabs.write('./storage'))
  .pipe(fs.createWriteStream('hashes.json'));
  
/** later, to retrieve the movie, stream the hashes into cabs **/
fs.createReadStream('hashes.json')
  .pipe(Cabs.read('./storage))
  .pipe(fs.createWriteStream('movie-copy.avi'));
```

Low Level Class
=====

you also have access to the base Cabs class located at `cabs.Cabs`, initialize it with a location and optionally an options object wtih a string representing the hash function to use (Defaults to sha256), the block size limit (defaults to 5 MB) and the depth of folders to use.

```javascript
var store = new Cabs('./location');
// or
var store = new Cabs({
  path: './location',
  hashFunction: 'sha256',
  limit: 5 * 1024 *1024
  depth: 3
});

store.write(buffer, callback);
//stores buffer, callback is called with the hash

store.read(hash, callback);
//calls the callback with the blob

store.rm(hash, callback);
//removes the file with the given hash

store.destroy(callback);
//deletes all the files related to the store, just a shortcut to rimraf so beware.

store.readStream();
//same as Cabs.read

store.writeStream();
//same as Cabs.write

store.has(hash, callback);
//calls callback with true if it exists, otherwise false

store.check(hash, callback);
//similar to has but throws an error if the file doesn't exist
//or it's hash doesn't match it's address hash

store.writeFile();
//write to a single file on disc.  Will only ever emit a single string
//the hash for the combined file you streamed in.
//unlike writeStream which chunks a big file into multiple smaller ones
//which can be handled in memory, this method buffers to disk.
```
