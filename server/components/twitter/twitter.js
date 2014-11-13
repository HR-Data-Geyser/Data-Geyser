module.exports = {
  streamTweets: streamTweets,
  getHistoric: getHistoric
};

var Twit = require('twit');
var Tweet = require('./../../api/tweet/tweet.model.js');
var _ = require('lodash');
var $ = require('jquery');

// should probably put this somewhere else..
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

function getHistoric(){
  T.get('search/tweets', {q: 'ebola until:2014-11-01', count: 100}, function(err, data, response){
    console.log(data);
  })
}

function streamTweets(topic, locations) {
  console.log('started', topic);
  
  var globe = ['-180', '-90', '180', '90'];
  var stream = T.stream('statuses/filter', { track: topic });    
  var counter = 0;
  
  setInterval(function(){
    console.log((counter / 5) * 60, 'tweets per minute');
    counter = 0;
  }, 5000);

  stream.on('tweet', function (tweet) {
    /* if you want to store more attributes from the tweet object, here is a great place to do it. Right now we're just storing
    the geolocation data, but */
    counter++;
    // Create geodata object
    if (tweet.coordinates || tweet.geo) {
      var geo = tweet.coordinates.coordinates;
    } else {
      var geo = [0, 0];
    }
    var newTweet = {
      id: tweet.id,
      created_at: tweet.created_at,
      description: tweet.text,
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
      keyword: topic
    };
    
    // console.log(newTweet);
    // Save to database
    Tweet.create(newTweet);
  })

}
