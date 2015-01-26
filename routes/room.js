var express = require('express');
var config = require('../config');
var _ = require('underscore');
var moment = require('moment');
var models = require('../models');
var md = require('../markdown')
var router = express.Router();

var slugMap = {};
var io = null;
var roomInfo = {};

function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
}


function shouldTriggerJoin(data) {
  /*
   * TODO
   *  - change data.name to data.user
   *  - track number of user instances
   */
  //var info = data.room in roomInfo ? roomInfo[data.room] : (roomInfo[data.room] = { users: [] });
  var info;
  if(data.room in roomInfo) {
    console.log("Found room");
    info = roomInfo[data.room];
  } else {
    info = roomInfo[data.room] = { users: {} };
    console.log("Room not found");
  }

  if(data.user in info.users) {
    info.users[data.user] += 1;
    return false;
  } else {
    info.users[data.user] = 1;
    return true;
  }
}

function shouldTriggerLeave(data) {
  if(data.room in roomInfo) {
    var info = roomInfo[data.room];
    if(data.user in info.users) {
      var count = (info.users[data.user] -= 1);
      if(count <= 0) {
        delete info.users[data.user];
        return true;
      }
    }
  }
  return false;
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
  });

  io.on('connection', function(socket) {
    console.log("New Connection");
    socket.on('subscribe', function(data) {
      console.log("sub: " + data.room + " :: " + data.user);
      socket.join(data.room);
      socket.user = data.user;

      if(!socket.roomNames) {
        socket.roomNames = [];
      }
      socket.roomNames.push(data.room);

      if(shouldTriggerJoin(data)) {
        io.sockets.in(data.room).emit('join', data.user);
      }
      /*
       * TODO
       *  - send current user list
       *  - send previous messages
       */
    }).on('disconnect', function() {
      if(!socket.roomNames) {
        return;
      }

      console.log("disconnect: " + socket.roomNames.join(', '));
        _.each(socket.roomNames, function(room) {
          if(shouldTriggerLeave({ room: room, user: socket.user })) {
            console.log(">>> leave");
            io.sockets.in(room).emit('leave', socket.user);
          }
        });
    });
  });
  return router;
};
