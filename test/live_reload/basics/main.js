var reload = require("live-reload");
require("./dep");

var span = document.createElement("span");
span.className = "main";
span.appendChild(document.createTextNode("loaded"));

document.getElementById("app").appendChild(span);
