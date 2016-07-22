const async = require('async');
const Job = require('./job');
const utils = require('./utils');
const fs = require('fs');

/**
 * 串行步骤的任务
 **/
module.exports = function (array) {
  if (!utils.isArray(array)) {
    array = [].slice.call(arguments);
  }
  var NewJob, project, ChildJobs;
  return {
    register: function (_NewJob) {
      NewJob = _NewJob;
      project = _NewJob.project;
      var index = 0;
      ChildJobs = array.map(function (runable) {
        return NewJob.defineJob(`${NewJob.name}-${++index}`, runable);
      });
    },
    runable: function (self) {
      async.series(ChildJobs.map(function (ChildJob) {
        return function (next) {
          self.invoke(ChildJob, next);
        };
      }), function (err, result) {
        if (self.context.hasFailed()) {
          err = new Error(`QueueFailed: ${err && err.message}`);
        }
        self.done(err, result);
      });
    }
  }
};