var $ = require("jquery");
var reload = require("live-reload");
require("./dep");

var span = $("<span class='main'>loaded</span>");
$("#app").append(span);
