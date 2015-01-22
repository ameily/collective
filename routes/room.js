var express = require('express');
var config = require('../config');
var _ = require('underscore');
var moment = require('moment');
var models = require('../models');

var router = express.Router();

var slugMap = {};

function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '');         // Trim - from end of text
}

_.each(config.rooms, function(room) {
    slugMap[slugify(room.name)] = room;
});

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
        html: req.body.text,
        room: req.params.slug,
        timestamp: moment().unix()
    });

    //msg.save();

    //TODO fire message
});

module.exports = router;
