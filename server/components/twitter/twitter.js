module.exports = {
  streamTweets: streamTweets,
  stopTweets: stopTweets
};

var Twit = require('twit');
var Tweet = require('./../../api/tweet/tweet.model.js');
var _ = require('lodash');
var $ = require('jquery');
var filter = require('wordfilter');
var extractor = require('keyword-extractor');

var secrets = {
  consumerKey: process.env['TWITTER_CONSUMER_KEY'],
  consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
  accessToken: process.env['TWITTER_ACCESS_TOKEN'],
  accessTokenSecret: process.env['TWITTER_ACCESS_TOKEN_SECRET']
};

var T = new Twit({
  consumer_key: secrets.consumerKey,
  consumer_secret: secrets.consumerSecret,
  access_token: secrets.accessToken,
  access_token_secret: secrets.accessTokenSecret
});

var stream;

function stopTweets(topic, callback) {
  stream.stop();
  callback();
}

function streamTweets(topic, callback) {
  // console.log('started', topic);
  
  var globe = ['-180', '-90', '180', '90'];

  stream = T.stream('statuses/filter', { locations: globe }); // filter tweets with geo data only
  // var stream = T.stream('statuses/filter', { track: topic }); // filter tweets with keyword
  stream.on('tweet', function (tweet) {
    // Create tweet object with geo data
    if (tweet.coordinates || tweet.geo) {

      // keyword filter to extract and join keywords
      var extractedWords = extractor.extract(tweet.text, { language:"english", return_changed_case:true }).join(' ');

      var geo = tweet.coordinates.coordinates;

      // filter to check if offensive words are in tweet text
      var isBlacklisted = filter.blacklisted(tweet.text);

      var newTweet = {
        id: tweet.id,
        created_at: tweet.created_at,
        photo: tweet.user.profile_image_url,
        description: tweet.text,
        text_keywords: extractedWords,
        followers_count: tweet.user.followers_count,
        in_reply_to_status_id: tweet.in_reply_to_status_id,
        in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
        in_reply_to_user_id: tweet.in_reply_to_user_id,
        in_reply_to_user_id_str: tweet.in_reply_to_user_id_str,
        in_reply_to_screen_name: tweet.in_reply_to_screen_name,
        screenName: tweet.user.screen_name,
        latitude: geo[1],
        longitude: geo[0],
        location: tweet.user.location,
        isBlacklisted: isBlacklisted,
        keyword: topic
      };

      // Save to database
      Tweet.create(newTweet);
    }
  });
  callback(stream);
}
