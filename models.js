
var mongoose = require('mongoose');


exports.Message = mongoose.model('Message', {
    room: String,
    author: String,
    html: String,
    timestamp: Number
});


exports.Upload = mongoose.model('Upload', {
    room: String,
    author: String,
    timestamp: Number,
    name: String,
    description: String,
    file_id: mongoose.Schema.ObjectId
});

exports.Alarm = mongoose.model('Alarm', {
    room: String,
    target: Number,
    name: String,
    category: String
});




