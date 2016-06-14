var os = require('os');
var Server = require('./lib/server');

var exports = new Server();
exports.Server = Server;
exports.Project = require('./lib/project');
exports.Job = require('./lib/job');
exports.shell = require('./lib/shell');
exports.on = require('./lib/on');
exports.series = require('./lib/series');
exports.serial = require('./lib/series');
exports.parallel = require('./lib/parallel');
exports.cron = require('./lib/cron');
exports.crontab = require('./lib/cron');
exports.Store = require('./lib/store');

Error.prototype.toString = function () {
  return this.message + os.EOL + this.stack;
};

module.exports = exports;