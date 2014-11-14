'use strict';

var express = require('express');
var controller = require('./tweet.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/getTweets/:topic', controller.getTweets);
router.get('/getPhoto/', controller.getPhoto);
router.post('/', controller.create);
router.post('/getTweets/:topic', controller.startTweets);
router.delete('/getTweets/:topic', controller.destroyTweets);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;