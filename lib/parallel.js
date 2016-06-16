const async = require('async');
const Job = require('./job');
const utils = require('./utils');
const fs = require('fs');

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
          var ChildJob = project.defineJob(utils.id(), runable);
          self.invoke(ChildJob, function (err, job) {
            if (err) {
              self.console.error(err.toString());
              next(err, job);
            } else {
              fs.readFile(job.outFile, function (err, data) {
                if (err) {
                  self.console.error(err.toString());
                }
                if (data) {
                  self.console.log(data.toString());
                }
                next(err, job);
              });
            }
          });
        };
      }), done);
    }
  }
};