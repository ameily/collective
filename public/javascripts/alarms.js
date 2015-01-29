
var AlarmListPane = null;

(function() {

function pad(s) {
    return ('0'+s.toString()).slice(-2);
}

AlarmListPane = function(options) {
    this.$root = options.$root;
    this.socket = options.socket;
    this.alarms = { };

    this.categoryMap = {
        danger: "list-group-item-danger",
        info: "list-group-item-info",
        warning: 'list-group-item-warning',
        success: 'list-group-item-success',
        generic: ''
    };

    this.onAlarmTick = function() {
        var self = this;
        var now = moment.utc();
        _.each(this.alarms, function(alarm) {
            var str = self.getDiffString(now, alarm.target);
            if(str) {
                alarm.$diff.text(str);
            } else {
                alarm.$diff.text("0:00:00:00");
            }
        });
        setTimeout(this.onAlarmTick, 1000);
    };

    this.getDiffString = function(now, target) {
        var diff = target.diff(now);
        if(diff > 0) {
            var duration = moment.duration(diff);
            var str = duration.days().toString() + ":" +
                      pad(duration.hours()) + ":" + 
                      pad(duration.minutes()) + ":" +
                      pad(duration.seconds());
            return str;
        }
        return null;
    };

    this.onAlarmCreated = function(options) {
        var empty = _.isEmpty(this.alarms);
        var alarm = this.alarms[options.name] = {
            target: moment.unix(options.target),
            category: options.category || "info",
            $el: $("<li class='list-group-item'>"),
            $diff: $("<span class='badge monospace'>")
        };

        if(alarm.category in this.categoryMap) {
            alarm.$el.addClass(this.categoryMap[alarm.category]);
        } else {
            alarm.$el.addClass(this.categoryMap.generic);
        }

        alarm.$el.append(alarm.$diff).append($("<span>").text(options.name));
        this.$list.append(alarm.$el);

        var diff = this.getDiffString(moment.utc(), alarm.target);
        if(diff) {
            alarm.$diff.text(diff);
        } else {
            alarm.$diff.text("0:00:00:00");
        }

        if(empty) {
            setTimeout(this.onAlarmTick, 1000);
        }
    };

    this.onAlarmDelete = function(alarm) {
        if(alarm.name in this.alarms) {
            var alarm = this.alarms[alarm.name];
            alarm.$el.remove();
            delete this.alarms[name];
        }
    };

    this.$list = $("<ul class='list-group'>");
    this.$root.append(
        $("<div class='panel panel-default'>").append(
            $("<div class='panel-heading'>").append(
                $("<h3 class='panel-title'>Alarms</h3>")
            )
        ).append(
            this.$list
        )
    );

    _.bindAll(this, 'onAlarmCreated', 'onAlarmTick', 'onAlarmDelete');

    this.socket.on('alarmCreated', this.onAlarmCreated)
        .on('alarmDeleted', this.onAlarmDelete)
        .on('alarmTriggered', this.onAlarmDelete);
};

})();
