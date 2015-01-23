var express = require('express');
var config = require('../config');
var _ = require('underscore');
var moment = require('moment');
var models = require('../models');
var md = require('../markdown')
var router = express.Router();

var slugMap = {};
var io = null;

function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
}

/* GET home page. */
router.get('/:slug', function(req, res, next) {
    var slug = req.params.slug;
  if(slug in slugMap) {
    res.render('room', { room: slugMap[slug], slug: slug });
  } else {
    next();
  }
}).post('/:slug/message', function(req, res, next) {
    console.log(">> New Message <<");
    console.log("   Author: " + req.body.author);
    console.log("   Text:   " + req.body.text);
    var msg = new models.Message({
        author: req.body.author,
        html: md.render(req.body.text),
        room: req.params.slug,
        timestamp: moment().unix()
    });

    console.log("   Html:  " + msg.html);
    //io.of('/' + slug).emit('message', msg);
    io.sockets.in(slug).emit('message', msg);

    msg.save();

    //TODO fire message
});

module.exports = function(attrs) {
  io = attrs.io;
  _.each(config.rooms, function(room) {
      slug = slugify(room.name);
      slugMap[slug] = room;
      //io.of('/' + slug).on('connection', function(socket) {
      //  console.log("New Connection: " + slug);
      //});
  });

  io.on('connection', function(socket) {
    console.log("New Connection");
    socket.on('subscribe', function(data) {
      socket.join(data.room);
      socket.name = data.name;
      io.sockets.in(data.room).emit('join', data.name);
    }).on('disconnect', function() {
      console.log('leave');
      _.each(socket.rooms, function(room) {
        console.log("left " + room);
        io.sockets.in(room).emit('leave', socket.name);
      });
    });
  });
  return router;
};
