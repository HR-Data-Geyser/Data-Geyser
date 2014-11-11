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

function getTweets(topic){
  Tweet.find({keyword: topic}, function(err, tweets) {
    for (var i = 0; i < tweets.length; i++) {
      console.log(tweets[i].screenName);
      $('.display').append(tweets[i].screenName);
    }
  });
}

function getHistoric(){
  T.get('search/tweets', {q: 'ebola until:2014-11-01', count: 100}, function(err, data, response){
    console.log(data);
  })
}

function streamTweets(topic) {
  // console.log('started', topic);

  // T.get('followers/ids', { screen_name: tweets[i].screenName },  function (err, data, response) {
  //   console.log(data);
  // });
  
  var globe = ['-180', '-90', '180', '90'];

  var stream = T.stream('statuses/filter', { locations: globe });

  stream.on('tweet', function (tweet) {
    console.log(tweet);
    /* if you want to store more attributes from the tweet object, here is a great place to do it. Right now we're just storing
    the geolocation data, but */
    
    // Create geodata object
    if (tweet.coordinates || tweet.geo) {
      console.log(tweet);
      var geo = tweet.coordinates.coordinates;
      var newTweet = {
        tweetId: tweet.id,
        screenName: tweet.user.screen_name,
        latitude: geo[1],
        longitude: geo[0],
        location: tweet.user.location,
        keyword: topic
      };

      // Save to database
      Tweet.create(newTweet);
    }
  })

}
