var ChatPane = null;

(function() {

ChatPane = function(options) {
    this.$root = options.$root;
    this.socket = options.socket;
    this.userName = options.userName || "<unknown>";

    this.$table = $("<table>");
    this.$tbody = $("<tbody>");
    this.$table.addClass('chat-pane');
    this.$root.append(this.$table.append(this.$tbody));

    this.onUserMessage = function(msg) {
        this._renderMessage({
            authorClass: msg.author == this.userName ? 'self' : 'user',
            timestamp: moment.unix(msg.timestamp),
            author: msg.author,
            messageHtml: msg.html
        });
    };

    this.onUserJoin = function(name) {
        this._renderMessage({
            timestamp: moment(),
            //TODO change to author link
            messageHtml: $("<span>").text(name).html() + " has joined the Collective ",
            authorClass: 'system'
        });
    };

    this.onUserLeave = function(name) {
        this._renderMessage({
            authorClass: 'system',
            timestamp: moment(),
            messageHtml: $("<span>").text(name).html() + " has left the Collective"
        });
    };

    this._renderMessage = function(data) {
        var authorHtml, messageHtml = data.messageHtml;

        if(data.authorClass == 'system') {
            authorHtml = "<span class='author author-system'>System</span>";
            messageHtml = "&gt;&gt;&gt;&gt;&gt;&gt; " +
                          data.messageHtml +
                          " &lt;&lt;&lt;&lt;&lt;&lt;";
        } else if(data.authorClass == 'self') {
            authorHtml = $("<a class='author author-user' href='#'>")
                .attr('data-user', data.author)
                .text(data.author)
                .html();
        } else {
            authorHtml = $("<span class='author author-self'>")
                .text(msg.author)
                .html();
        }

        this.$tbody.append(
        );
    };

    _.bindAll(this, 'onUserMessage', 'onUserJoin', 'onUserLeave');

    this.socket.on('message', this.onUserMessage)
        .on('join', this.onUserJoin)
        .on('leave', this.onUserLeave);
};

})();