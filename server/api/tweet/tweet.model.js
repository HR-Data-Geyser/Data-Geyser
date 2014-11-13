'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  id: Number,
  created_at: Date,
  description: String,
  followers_count: Number,
  in_reply_to_status_id: Number,
  in_reply_to_status_id_str: String,
  in_reply_to_user_id: Number,
  in_reply_to_user_id_str: String,
  in_reply_to_screen_name: String,
  screenName: String,
  keyword: String,
  latitude: Number,
  longitude: Number,
  location: String
});

module.exports = mongoose.model('Tweet', TweetSchema);