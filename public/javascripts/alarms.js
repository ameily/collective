
var AlarmListPane = null;

(function() {

function pad(s) {
    return ('0'+s.toString()).slice(-2);
}

AlarmListPane = function(options) {
    this.$root = options.$root;
    this.socket = options.socket;
    this.alarms = { };

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

    this.onAlarmCreate = function(options) {
        var empty = _.isEmpty(this.alarms);
        var alarm = this.alarms[options.name] = {
            target: moment.unix(options.target),
            category: options.category || "info",
            $el: $("<li class='list-group-item'>").text(options.name),
            $diff: $("<span class='timestamp'>")
        };

        alarm.$el.append('&nbsp;').append(alarm.$diff);
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

    this.onAlarmDelete = function(name) {
        if(name in this.alarms) {
            var alarm = this.alarms[name];
            alarm.$el.remove();
            delete this.alarms[name];
        }
    };

    this.$list = $("<ul class='list-group'>");
    this.$root.append(
        $("<div class='panel panel-danger'>").append(
            $("<div class='panel-heading'>").append(
                $("<h3 class='panel-title'>Alarms</h3>")
            )
        ).append(
            this.$list
        )
    );

    _.bindAll(this, 'onAlarmCreate', 'onAlarmTick', 'onAlarmDelete');

    this.socket.on('alarmCreate', this.onAlarmCreate)
        .on('alarmDelete', this.onAlarmDelete)
        .on('alarmReached', this.onAlarmDelete);
};

})();
