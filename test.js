var should = require('chai').should();
var cabs = require('./');
var fs = require('fs');
var through = require('through2');
var result = [ 
  {
    start: 0,
    end: 3,
    hash: 'a9993e364706816aba3e25717850c26c9cd0d89d' 
  } 
];
describe('cab', function(){
  it('should work', function(done){
    var tdata = through();
    tdata.write(new Buffer('abc'));
    tdata.end();
    var outstream = cabs.write('./testData');
    outstream.on('data',function(data){
      data.should.deep.equal(result[0]);
      done();
    });
    tdata.pipe(outstream);
  });
  it('should be readable', function(done){
    var times = 0;
    var thing = cabs.read('./testData');
    thing.write(result[0]);
    thing.end();
    thing.pipe(through(function(data, _, cb){
        data.should.deep.equal(new Buffer('abc'));
        done();
        cb();
    }));
  });
   it('should be removable', function(done){
    var obj = new cabs.Cabs('./testData');
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
    var obj = cabs.Cabs('./testData');
    obj.destroy(function(err){
      fs.existsSync('./testData').should.equal(false);
      done(err);
    });
  });
  it('should throw an error if no path is provided', function(){
    (function(){
      var obj = new cabs.Cabs();
    }).should.throw();
  });
  it('should work, with a limit', function(done){
    var tdata = through();
    tdata.write(new Buffer('abcdefghij'));
    tdata.end();
    var outstream = cabs.write('./testData2', 2);
    var results = [];
    outstream.on('data',function(data){
      results.push(data);
    });
    outstream.on('end', function(){
      results.should.deep.equal([ 
        {
          start: 0,
          end: 2,
          hash: 'da23614e02469a0d7c7bd1bdab5c9c474b1904dc'
        },
        {
          start: 2,
          end: 4,
          hash: '034778198a045c1ed80be271cdd029b76874f6fc'
        },
        {
          start: 4,
          end: 6,
          hash: 'f822051471957b7bbebb8ab088fe9bd6d14f4261'
        },
        {
          start: 6,
          end: 8,
          hash: '1041179cbdda366fd7b0347f09255f775170e103'
        },
        {
          start: 8,
          end: 10,
          hash: '4cfa380a7a05ae26270f5ea888009520ab54b677'
        }
     ]);
      cabs.Cabs('./testData2').destroy(done);
    });
    tdata.pipe(outstream);
  });
});