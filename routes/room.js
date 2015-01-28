var express = require('express');
var config = require('../config');
var _ = require('underscore');
var moment = require('moment');
var models = require('../models');
var md = require('../markdown')
var router = express.Router();


var io = null;


var Rooms = {

};


function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
}


function shouldTriggerJoin(data) {
    if(!(data.room in Rooms)) {
        return false;
    }

    var room = Rooms[data.room];
    if(data.user in room.users) {
        room.users[data.user] += 1;
        return false;
    } else {
        room.users[data.user] = 1;
        return true;
    }
}

function shouldTriggerLeave(data) {
    if(!(data.room in Rooms)) {
        return false;
    }

    var room = Rooms[data.room];
    var trigger;
    if(data.user in room.users) {
        if(room.users[data.user] == 1) {
            delete room.users[data.user];
            trigger = true;
        } else {
            room.users[data.user] -= 1;
            trigger = false;
        }
    } else {
        trigger = false;
    }

    return trigger;
}


function setupRoom(config) {
    var slug = slugify(config.name);
    Rooms[slug] = {
        config: config,
        users: {}
    };
}


/* GET home page. */
router.get('/:slug', function(req, res, next) {
    var slug = req.params.slug;
    if(slug in Rooms) {
        res.render('room', {
            room: Rooms[slug].config,
            slug: slug
        });
    } else {
        next();
    }
}).post('/:slug/message', function(req, res, next) {
    var slug = req.params.slug;
    var msg = new models.Message({
        author: req.body.author,
        html: md.render(req.body.text),
        room: slug,
        timestamp: moment().unix()
    });

    io.sockets.in(slug).emit('message', msg.toJSON());

    msg.save();
    res.end();
});

module.exports = function(attrs) {
    io = attrs.io;
    _.each(config.rooms, setupRoom);

    io.on('connection', function(socket) {
        socket.on('subscribe', function(data) {
            // User joined room
            socket.user = data.user;
            socket.room = data.room;

            if(shouldTriggerJoin(data)) {
                io.sockets.in(data.room).emit('join', data.user);
            }

            // send current user list
            _.each(_.keys(Rooms[data.room].users), function(user) {
                console.log("Join: " + user);
                socket.emit('join', user, true);
            });

            // Send previous messages
            models.Message.find({ room: data.room }).sort({ _id: 1 }).exec(function(err, docs) {
                _.each(docs, function(doc) { 
                    socket.emit('message', doc.toJSON());
                });
                socket.join(data.room);
            });
        }).on('disconnect', function() {
            if(!socket.room) {
                return;
            }
            
            if(shouldTriggerLeave({ room: socket.room, user: socket.user })) {
                io.sockets.in(socket.room).emit('leave', socket.user);
            }
        });
    });

    return router;
};
