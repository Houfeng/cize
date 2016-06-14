const async = require('async');
const Job = require('./job');
const utils = require('./utils');

/**
 * 并行步骤的任务
 **/
module.exports = function (array) {
  if (!utils.isArray(array)) {
    array = [].slice.call(arguments);
  }
  var NewJob = null;
  var project = null;
  return {
    register: function (project, NewJob) {
      NewJob = NewJob;
      project = project;
    },
    runable: function (done) {
      var self = this;
      async.parallel(array.map(function (runable) {
        return function (next) {
          var ChildJob = project.defineJob(utils.newGuid(), runable);
          self.invoke(ChildJob, next);
        };
      }), done);
    }
  }
};