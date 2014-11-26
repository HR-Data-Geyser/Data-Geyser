'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

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
  it('should respond with 200', function(done) {
    request(app)
      .post('/api/tweets/getTweets/ebola')
     .expect(200)
     .expect('Content-Type', /json/)
     .end(function(err, res) {
       if (err) return done(err);
       res.body.should.be.instanceof(Array);
       done();
     });
  });
});