'use strict';

var express = require('express');
var controller = require('./tweet.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/getTweets/:topic', controller.getTweets);
router.post('/getTweets/:topic', controller.startTweets);
router.put('/getTweets/:topic', controller.stopTweets);
router.delete('/getTweets/:topic', controller.destroyTweets);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);

module.exports = router;