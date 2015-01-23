// Process #hashtag

'use strict';

//////////////////////////////////////////////////////////////////////////
// Renderer partials

function mention_open(tokens, idx) {
  var name = tokens[idx].content.toLowerCase();
  return '<a href="#" data-mention="' + name + '" class="mention">';
}

function mention_close() { return '</a>'; }

function mention_text(tokens, idx) {
  return '@' + tokens[idx].content;
}

//////////////////////////////////////////////////////////////////////////

function isLinkOpen(str)  { return /^<a[>\s]/i.test(str); }
function isLinkClose(str) { return /^<\/a\s*>/i.test(str); }

module.exports = function mention_plugin(md, options) {

  var arrayReplaceAt = md.utils.arrayReplaceAt;
  var escapeHtml = md.utils.escapeHtml;

  function mention(state) {
    var i, j, l, m,
        userName,
        token,
        tokens,
        blockTokens = state.tokens,
        htmlLinkLevel,
        matches,
        text,
        nodes,
        pos,
        level,
        regex,
        preceding     = '^|\\s',
        mentionRegExp = '\\w+';

    if (options) {
      if (typeof options.preceding !== 'undefined') {
        preceding = options.preceding;
      }
      if (typeof options.mentionRegExp !== 'undefined') {
        mentionRegExp = options.mentionRegExp;
      }
    }

    regex = new RegExp('(' + preceding + ')@(' + mentionRegExp + ')', 'g');

    for (j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== 'inline') { continue; }
      tokens = blockTokens[j].children;
      htmlLinkLevel = 0;

      for (i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];

        // skip content of markdown links
        if (token.type === 'link_close') {
          i--;
          while (tokens[i].level !== token.level && tokens[i].type !== 'link_open') {
            i--;
          }
          continue;
        }

        // skip content of html links
        if (token.type === 'html_inline') {
          // we are going backwards, so isLinkOpen shows end of link
          if (isLinkOpen(token.content) && htmlLinkLevel > 0) {
            htmlLinkLevel--;
          }
          if (isLinkClose(token.content)) {
            htmlLinkLevel++;
          }
        }
        if (htmlLinkLevel > 0) { continue; }

        if (token.type !== 'text') { continue; }

        // find hashtags
        text = token.content;
        matches = text.match(regex);
        if (matches === null) { continue; }
        nodes = [];
        level = token.level;

        for (m = 0; m < matches.length; m++) {
          userName = matches[m].split('@', 2)[1];

          pos = text.indexOf('@' + userName);

          if (pos > 0) {
            nodes.push({
              type: 'text',
              // char at pos-1 is '#'
              content: text.slice(0, pos),
              level: level
            });
          }
          nodes.push({
            type: 'mention_open',
            content: userName,
            level: level++
          });
          nodes.push({
            type: 'mention_text',
            content: escapeHtml(userName),
            level: level
          });
          nodes.push({
            type: 'mention_close',
            level: --level
          });
          text = text.slice(pos + 1 + userName.length);
        }

        if (text.length > 0) {
          nodes.push({
            type: 'text',
            content: text,
            level: state.level
          });
        }

        // replace current node
        tokens = arrayReplaceAt(tokens, i, nodes);
        blockTokens[j].children = tokens;
      }
    }
  }

  md.core.ruler.after('inline', 'mention', mention);
  md.renderer.rules.mention_open  = mention_open;
  md.renderer.rules.mention_text  = mention_text;
  md.renderer.rules.mention_close = mention_close;
};
