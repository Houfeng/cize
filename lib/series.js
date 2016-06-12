var async = require('async');
var Job = require('./job');
var utils = require('real-utils');

module.exports = function (array) {
  var NewJob = null;
  var project = null;
  return {
    register: function (_project, _NewJob) {
      NewJob = _NewJob;
      project = _project;
    },
    runable: function (done) {
      var self = this;
      async.series(array.map(function (runable) {
        return function (next) {
          var jobName = utils.newGuid();
          project.job(jobName, runable, {
            virtual: true
          });
          self.invoke(jobName, function(err,job){
            
            next(err,job);
          });
        };
      }), done);
    }
  }
};