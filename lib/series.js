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
      ChildJobs = array.map(function (runable) {
        return NewJob.defineJob(utils.id(), runable);
      });
    },
    runable: function (self) {
      async.series(ChildJobs.map(function (ChildJob) {
        return function (next) {
          self.invoke(ChildJob, function (err, job) {
            //在这里忽略 err，无论如何会将子步骤的 err 和 out 合并到父 Job
            fs.readFile(job.outFile, function (err, data) {
              if (err) {
                self.console.error(err.toString());
              }
              if (data) {
                self.console.log(data.toString());
              }
              //是否通过都继续向下，因为可能后续有「邮件通知」之类的 job
              next();
            });
          });
        };
      }), function (err, result) {
        if (self.context.hasFailed()) {
          err = err || new Error('QueueFailed');
        }
        self.done(err, result);
      });
    }
  }
};