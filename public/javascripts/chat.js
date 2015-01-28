var ChatPane = null;

(function() {


ChatPane = function(options) {
    this.$root = options.$root;
    this.socket = options.socket;
    this.user = options.user || "<unknown>";

    this.$table = $("<table>");
    this.$tbody = $("<tbody>");
    //this.$table.addClass('chat-pane');
    this.$root.append(this.$table.append(this.$tbody));

    this.alertCatMap = {
        danger: "text-danger",
        warning: "text-warning",
        info: "text-info",
        generic: ""
    };

    this.onUserMessage = function(msg) {
        this._renderMessage({
            authorClass: msg.author == this.user ? 'self' : 'user',
            timestamp: moment.unix(msg.timestamp),
            author: msg.author,
            messageHtml: msg.html
        });
    };

    this.onUserJoin = function(name, existing) {
        if(existing) {
            return;
        }

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

    this.onAlarmTriggered = function(alarm) {
        var alrtCls;
        if(alarm.category in this.alertCatMap) {
            alrtCls = this.alertCatMap[alarm.category];
        } else {
            alrtCls = this.alertCatMap.generic;
        }

        this._renderMessage({
            timestamp: moment(),
            messageHtml: $("<span class='badge'>").text(alarm.name).addClass(alrtCls).html(),
            authorClass: 'system'
        });
    };

    this._renderMessage = function(data) {
        var authorHtml, messageHtml = data.messageHtml;
        var timestampHtml  = "[" + data.timestamp.format("HH:mm:ss") + "]";

        if(data.authorClass == 'system') {
            authorHtml = "<span class='user-system'>System</span>";
            messageHtml = "<div class='message-system'>" +
                          "&gt;&gt;&gt;&gt;&gt;&gt; " +
                          data.messageHtml +
                          " &lt;&lt;&lt;&lt;&lt;&lt;" +
                          "</div>";
        } else if(data.authorClass == 'self') {
            authorHtml = $("<span class='user-self'>")
                .text(data.author);
        } else {
            authorHtml = $("<a class='user' href='#'>")
                .attr('data-user', data.author)
                .text(data.author);
        }

        this.$tbody.append(
            $("<tr>")
                .append($("<td class='timestamp'>").append(timestampHtml))
                .append($("<td class='author'>").append(authorHtml))
                .append($("<td class='message'>").append(messageHtml))
        );
    };

    _.bindAll(this, 'onUserMessage', 'onUserJoin', 'onUserLeave', 'onAlarmTriggered');

    this.socket.on('message', this.onUserMessage)
        .on('join', this.onUserJoin)
        .on('leave', this.onUserLeave)
        .on('alarmTriggered', this.onAlarmTriggered);
};

jQuery.fn.extend({
insertAtCaret: function(myValue){
  return this.each(function(i) {
    if (document.selection) {
      //For browsers like Internet Explorer
      this.focus();
      var sel = document.selection.createRange();
      sel.text = myValue;
      this.focus();
    }
    else if (this.selectionStart || this.selectionStart == '0') {
      //For browsers like Firefox and Webkit based
      var startPos = this.selectionStart;
      var endPos = this.selectionEnd;
      var scrollTop = this.scrollTop;
      this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
      this.focus();
      this.selectionStart = startPos + myValue.length;
      this.selectionEnd = startPos + myValue.length;
      this.scrollTop = scrollTop;
    } else {
      this.value += myValue;
      this.focus();
    }
  });
}
});

})();