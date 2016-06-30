const os = require('os');
const pkg = require('./package.json');
const Server = require('./lib/server');

var exports = new Server();
exports.Server = Server;
exports.Project = require('./lib/project');
exports.Job = require('./lib/job');
exports.shell = require('./lib/shell');
exports.by = require('./lib/by');
exports.series = require('./lib/series');
exports.serial = require('./lib/series');
exports.parallel = require('./lib/parallel');
exports.cron = require('./lib/cron');
exports.crontab = require('./lib/cron');
exports.Store = require('./lib/store');
exports.pkg = require('./package.json');
exports.utils = require('./lib/utils');

Error.prototype.toString = function () {
  return this.message + os.EOL + this.stack;
};

global.__defineGetter__(pkg.name, function () {
  return exports;
});

module.exports = exports;