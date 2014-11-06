'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  screenName: String,
  keyword: String,
  latitude: Number,
  longitude: Number,
  location: String
});

module.exports = mongoose.model('Tweet', TweetSchema);