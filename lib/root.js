var path = require("path");

/*
 * The module root is the root directory that is using stealjs.
 * So in a project if you are require('stealjs'), it will use this
 * root path to resolve everything you steal.
 */
exports.moduleRoot = path.resolve(__dirname, "../../..");
