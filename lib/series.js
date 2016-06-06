var async = require('async');
var Job = require('./job');
var utils = require('real-utils');

module.exports = function (array) {
  return function (context, done) {
    async.series(array.map(function (runable) {
      return function (next) {
        var tempJob = new Job(context.project, utils.newGuid(), runable);
        tempJob.temp = true;
        tempJob.run(context, next);
      };
    }), done);
  }
};