'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  latitute: Number,
  longitude: Number
});

module.exports = mongoose.model('Tweet', TweetSchema);