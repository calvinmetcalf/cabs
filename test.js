var should = require('chai').should();
var Cabs = require('./');
var fs = require('fs');
var through = require('through2');
var ByteStream = require('byte-stream');
var rimraf = require("rimraf");
var result = [ 
  {
    start: 0,
    end: 3,
    hash: "a9993e364706816aba3e25717850c26c9cd0d89d" 
  } 
];
describe('cab', function(){
  it('should work', function(done){
    var tdata = through();
    tdata.write(new Buffer('abc'));
    tdata.end();
    var outstream = Cabs.write('./testData', 'sha1');
    outstream.on('data',function(data){
      data.should.deep.equal(result[0]);
      done();
    });
    tdata.pipe(outstream);
  });
  it('should be readable', function(done){
    var times = 0;
    var thing = Cabs.read('./testData');
    thing.write(result[0]);
    thing.end();
    thing.pipe(through(function(data, _, cb){
        data.should.deep.equal(new Buffer('abc'));
        done();
        cb();
    }));
  });
  it('has should work to find something', function(done){
    var thing = new Cabs('./testData');
    thing.has(result[0].hash, function(err, answer) {
      answer.should.equal(true);
      done(err);
    });
  });
  it('check should work to find something', function(done){
    var thing = new Cabs({
      path: './testData',
      hashFunc: "sha1"
    });
    thing.check(result[0].hash, function(err, answer) {
      answer.should.equal(true);
      done(err);
    });
  });
  it("has should not work to find something that isn't there", function(done){
    var thing = new Cabs('./testData');
    thing.has('aaaa' + result[0].hash, function(err, answer) {
      answer.should.equal(false);
      done(err);
    });
  });
  it('check should not work to find something if the hash does not match', function(done){
    var thing = new Cabs({
      path: './testData'
    });
    thing.check(result[0].hash, function(err) {
      should.exist(err);
      done();
    });
  });
   it('should be removable', function(done){
    var obj = new Cabs('./testData');
    fs.readdir('./testData', function(err,data){
      if(err){
        return done(err);
      }
      data.should.have.length(1);
      obj.rm(result[0].hash, function(err){
        if(err){
          return done(err);
        }
        fs.readdir('./testData', function(err,data){
          if(err){
            return done(err);
          }
          data.should.have.length(0);
          done();
        });
      });
    });
  });
  it('should be destroyable', function (done) {
    fs.existsSync('./testData').should.equal(true);
    var obj = Cabs('./testData');
    obj.destroy(function(err){
      fs.existsSync('./testData').should.equal(false);
      done(err);
    });
  });
  it('should throw an error if no path is provided', function(){
    (function(){
      var obj = new Cabs();
    }).should.throw();
  });
  it('should work, with a limit', function(done){
    var tdata = through();
    tdata.write(new Buffer('abcdefghij'));
    tdata.end();
    var outstream = Cabs.write('./testData2', 'sha1', 2);
    var results = [];
    outstream.on('data',function(data){
      results.push(data);
    });
    outstream.on('end', function(){
      results.should.deep.equal([ { start: 0,
    end: 2,
    hash: 'da23614e02469a0d7c7bd1bdab5c9c474b1904dc' },
  { start: 2,
    end: 4,
    hash: '034778198a045c1ed80be271cdd029b76874f6fc' },
  { start: 4,
    end: 6,
    hash: 'f822051471957b7bbebb8ab088fe9bd6d14f4261' },
  { start: 6,
    end: 8,
    hash: '1041179cbdda366fd7b0347f09255f775170e103' },
  { start: 8,
    end: 10,
    hash: '4cfa380a7a05ae26270f5ea888009520ab54b677' } ]);
      Cabs('./testData2').destroy(done);
    });
    tdata.pipe(outstream);
  });
  it('should work with writeFile', function(done){
    var cabs = new Cabs('./testData3');
    var wf = cabs.writeFile();
    var chunker = new ByteStream(2);
    chunker.pipe(wf);
    var hashes = [];
    wf.on('data', function (data){
      hashes.push(data);
    });
    wf.on('end', function (){
      hashes.should.deep.equal(['72399361da6a7754fec986dca5b7cbaf1c810a28ded4abaf56b2106d06cb78b0'])
      fs.readFile('./testData3/72/39/93/61da6a7754fec986dca5b7cbaf1c810a28ded4abaf56b2106d06cb78b0', {
        encoding:"utf8"
      }, function (err, data) {
        data.should.equal('abcdefghij');
        rimraf('./testData3', done);
      });
    });
    chunker.write(new Buffer('abcdefghij'));
    chunker.end();
  });
});