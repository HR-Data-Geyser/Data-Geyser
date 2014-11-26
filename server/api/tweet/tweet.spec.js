'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var Tweet = require('../tweet/tweet.model.js');
var utils = require('../tweet/utils.js');

describe('GET /api/tweets', function() {

  it('should respond with JSON array', function(done) {
   request(app)
     .get('/api/tweets')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.be.instanceof(Array);
      done();
    });
  });
});

describe('GET /api/tweets/getTweets/:topic', function(){
  
  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/tweets/getTweets/ebola')
     .expect(200)
     .expect('Content-Type', /json/)
     .end(function(err, res) {
       if (err) return done(err);
       res.body.should.be.instanceof(Array);
       done();
     });
  });
});

describe('POST /api/tweets/getTweets/:topic', function() {
  
  it('should respond with stream object', function(done) {
    request(app)
      .post('/api/tweets/getTweets/ebola')
     .expect(200)
     .expect('Content-Type', /json/)
     .end(function(err, res) {
       if (err) return done(err);
       res.body.should.be.instanceof(Object);
       done();
     });
  });
});

// describe('PUT /api/tweets/getTweets/:topic', function() {
//
//   it('should respond with 200', function(done) {
//     request(app)
//       .put('/api/tweets/getTweets/ebola')
//      .expect(200)
//      .end(function(err, res) {
//        if (err) return done(err);
//        done();
//      });
//   });
// });

describe('DELETE /api/tweets/getTweets/:topic', function() {
  
  it('should respond with 200', function(done) {
    request(app)
      .delete('/api/tweets/getTweets/ebola')
     .expect(200)
     .end(function(err, res) {
       if (err) return done(err);
       done();
     });
  });
});

describe('Create()', function() {
  
  it('should create a new tweet', function(done) {
    var newTweet = {
      description: 'testing',
    };
    
    Tweet.create(newTweet, function(err, createdTweet) {
      should.not.exist(err);
      createdTweet.description.should.equal('testing');
      done();
    })
  })
})