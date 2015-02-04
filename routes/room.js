var express = require('express');
var config = require('../config');
var _ = require('underscore');
var moment = require('moment');
var models = require('../models');
var md = require('../markdown')
var router = express.Router();


var io = null;
var db = null;


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
    var room = Rooms[slug] = {
        config: config,
        users: {},
        alarms: []
    };

    var now = moment.utc();
    models.Alarm.find({ room: slug, target: { $gt: now.unix() } }).exec(function(err, docs) {
        room.alarms = docs || [];
        now = moment.utc().unix();
        _.each(docs, function(doc) {
            setTimeout(function() {
                io.sockets.in(slug).emit('alarmTriggered', doc.toJSON());
                room.alarms = _.without(room.alarms, doc);
            }, (doc.target - now) * 1000);
        });
    });
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

router.get('/:room/upload', function(req, res, next) {
    res.render('upload', {
        slug: req.params.room
    });
}).post('/:room/upload', function(req, res, next) {
    var room = req.params.slug;
    var fileId = new ObjectID();
    var store = new GridStore(db, fileId, 'w', { root: 'fs' });
    store.writeFile(req.files.upload.path, function(err, fileInfo) {
        var upload = new models.Upload({
            author: req.body.author || null,
            room: room,
            description: req.body.description || null,
            name: req.files.upload.originalname,
            timestamp: moment().unix(),
            file_id: fileId
        });

        upload.save(function() {
            io.sockets.in(room).emit('upload', this.toJSON());
        });
    });

    res.end();
});


module.exports = function(attrs) {
    io = attrs.io;
    gridfs = attrs.gridfs;
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

            _.each(Rooms[data.room].alarms, function(alarm) {
                socket.emit('alarmCreated', alarm.toJSON(), true);
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
