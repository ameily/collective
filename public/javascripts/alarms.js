
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
        va self = this;
        var now = moment.utc();
        var remove = [];
        _.each(this.alarms, function(alarm) {
            var str = self.getDiffString(now, alarm.target);
            if(str) {
                alarm.$diff.text(str);
            } else {
                //TODO alarm has been hit
                remove.push(alarm._id);
            }
        });

        _.each(remove, function(id) {
            //TODO
            var alarm = self.alarms[id];
            alarm.$el.remove();
            delete self.alarms[id];
        });

        if(this.alarms.length) {
            setTimeout(this.onAlarmTick, 1000);
        }
    };

    this.getDiffString = function(now, target) {
        var diff = alarm.target.diff(now);
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
        var alarm = this.alarms[options.id] = {
            target: options.target,
            category: options.category || "info",
            $el: $("<li class='list-group-item'>").text(options.name),
            $diff: $("<span class='timestamp'>")
        };

        alarm.$el.append('&nbsp;').append(alarm.$diff));
        this.$list.append(alarm.$el);

        if(this.alarms.length == 1) {
            setTimeout(this.onAlarmTick, 1000);
        }
    };

    this.onAlarmDelete = function(id) {
        if(id in this.alarms) {
            var alarm = this.alarms[id];
            delete this.alarms[id];
            alarm.$el.remove();
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
};

})();
