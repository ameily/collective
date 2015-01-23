
var md = require('markdown-it')({
    breaks: true,
    linkify: true
}).use(require('markdown-it-hashtag'), {
    hashtagRegExp: "\\d+"
}).use(require('./markdown-it-mention'));

md.renderer.rules.hashtag_open = function(tokens, idx) {
    return '<a href="#" class="issue" data-issue="' + tokens[idx].content + '">';
};

md.renderer.rules.hashtag_text = function(tokens, idx) {
    return '#' + tokens[idx].content;
};

md.renderer.rules.hashtag_close = function() {
    return "</a>";
};

module.exports = md;