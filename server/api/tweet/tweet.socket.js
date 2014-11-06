/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var tweet = require('./tweet.model');

exports.register = function(socket) {
  tweet.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  tweet.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc) {
  socket.emit('tweet:save', doc);
}

function onRemove(socket, doc) {
  socket.emit('tweet:remove', doc);
}