module.exports = {
  streamTweets: streamTweets
}

var Twit = require('twit');
var Tweet = require('./../../api/tweet/tweet.model.js');
var _ = require('lodash');

// should probably put this somewhere else..
var secrets = {
  consumerKey: 'JfQKz1Ep76YoHVuhkyt4MibUi',
  consumerSecret: 'UIE3V0zNM5LMdvReOzdM7dPu4hYYgHOsahUBwHUHtsmPD7xV0P',
  accessToken: '2861852891-KqG6wm7j7eAPNPUlBmGKTub1IoDTbThJGgWPBdN',
  accessTokenSecret: 'OXfDXXBfFKML4fBaQDb9ptujbEqTVS7yu7VP9LGJBGSUw'
}

var T = new Twit({
  consumer_key: secrets.consumerKey,
  consumer_secret: secrets.consumerSecret,
  access_token: secrets.accessToken,
  access_token_secret: secrets.accessTokenSecret
});

function streamTweets(topic) {

  topic = 'Giants';

  var stream = T.stream('statuses/filter', { track: topic });

  stream.on('tweet', function (tweet) {

    /* if you want to store more attributes from the tweet object, here is a great place to do it. Right now we're just storing
    the geolocation data, but */
    console.log(tweet.coordinates);
    // Create geodata object
    if (tweet.coordinates) {
      var geo = tweet.coordinates.coordinates;
      var newTweet = {
        latitude: geo[1],
        longitude: geo[0]
      };

      // Save to database
      Tweet.create(newTweet);
      console.log('added ' + newTweet + ' to database from', topic);
    }
  })

// or search directly

  // T.get('search/tweets', { q: tweetWords, count: 100 }, function(err, data, response) {
  //   for (var i = 0; i < data.statuses.length; i++) {

  //     // Add to database
  //     if (data.statuses[i].coordinants) {
  //       var geo = data.statuses[i].coordinants.coordinants;
  //       var tweetObj = {
  //         latitude: geo[1],
  //         longitude: geo[0]
  //       };
  //       console.log(tweetObj);
  //     }

  //   };

  // })

}
