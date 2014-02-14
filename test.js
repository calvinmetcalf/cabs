var should = require('chai').should();
var cabs = require('./');
var fs = require('fs');
var through = require('through2');
var result = [ 
  {
    start: 0,
    end: 3,
    hash: 'ceyun6xbmmsfibs9ny4sr7w530v39cz1z2drmm2ww1otd414dfe72260gc1x1cqzlai3zyo2lg5' 
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
          hash: 'cdqix4qpfui6sadzipo67fq4tye8i42x7tysv6jstto47c8zapojdo58jy80p8mosf563kppr97'
        },
        {
          start: 2,
          end: 4,
          hash: 'byqtf6k10edx3qh4q2r2nextfs6ep0yjr5tddbt6bb9yuhp7mlzkytynnml1kt4px8nwhvh1h94'
        },
        {
          start: 4,
          end: 6,
          hash: '6jvohie1r1pv0g9fyboipw29fjn4tmxs5m42f41vfort5h66yutw0wkkbyl7e5h7w75rq05vjj'
        },
        {
          start: 6,
          end: 8,
          hash: 'bw3ufxxsb31dopmmuft05l9iqr15nok7g2rjbnxybrs7dbz7qa3sxd74y95ye9ow9p4wguzfndv'
        },
        {
          start: 8,
          end: 10,
          hash: 'n17b1ifyyx961ujs2ggo9w05glg6ffaw6v3gj8xiyk8gguvrhunjhxdxr23gdbu449qh305lrw'
        }
     ]);
      cabs.Cabs('./testData2').destroy(done);
    });
    tdata.pipe(outstream);
  });
});