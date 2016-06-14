var Class = require('cify').Class;
var utils = require('real-utils');

/**
 * Job 执行记录
 **/
var Record = new Class({

  /**
   * Record 的构造函数
   * @param {Job} job 实例 
   **/
  constructor: function (job) {
    this.id = job.id;
    this.beginTime = item.beginTime;
    this.endTime = item.endTime;
    this.projectName = item.projectName;
    this.contextId = item.contextId;
    this.jobName = item.jobName;
    this.status = item.status;
  },

  /**
   * 保存记录
   **/
  save: function () {

  }

});

/**
 * 获取所有记录
 **/
Record.getList = function (status) {

};

