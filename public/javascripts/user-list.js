
var UserListPane = null;

(function() {


/*
div.panel.panel-info
  div.panel-heading
    h3.panel-title Users
  ul#users.list-group
*/

UserListPane = function(options) {
    this.$root = options.$root;
    this.socket = options.socket;
    this.user = options.user || "<unknown>";
    this.userMap = {};

    this.$list = $("<ul class='list-group'>");
    this.$root.append(
        $("<div class='panel panel-info'>").append(
            $("<div class='panel-heading'>").append(
                $("<h3 class='panel-title'>Active Users</h3>")
            )
        ).append(
            this.$list
        )
    );

    this.onUserJoin = function(user, existing) {
        if(user in this.userMap) {
            return;
        }


        var $e = this.userMap[user] = $("<li class='list-group-item'>");
        if(user == this.user) {
            $e.append($("<span class='user-self'>").text(user));
        } else {
            $e.append($("<a href='#' class='user'>").attr('data-user', user).text(user));
        }

        this.$list.append($e);
    };

    this.onUserLeave = function(user) {
        if(user == this.user || !(user in this.userMap)) {
            return;
        }

        this.userMap[user].remove();
        delete this.userMap[user];
    };

    _.bindAll(this, 'onUserJoin', 'onUserLeave');

    this.socket.on('join', this.onUserJoin).on('leave', this.onUserLeave);

    var self = this;
    _.each(options.users, function(user) {
        self.onUserJoin(user);
    });
};

})();


