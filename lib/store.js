const Class = require('cify').Class;
const utils = require('./utils');
const mkdir = require('mkdir-p');
const Nedb = require('nedb');

/**
 * 存储模块
 **/
const Store = new Class({

  /**
   * Store 的构造函数
   * @param {server} server 实例 
   **/
  constructor: function (server) {
    this._records = new Nedb({
      filename: `${server.path.data}records.db`,
      autoload: true
    });
  },

  /**
   * 保存 Job 执行记录
   **/
  save: function (job, callback) {
    this._records.insert({
      _id: job.id,
      name: job.name,
      contextId: job.context.id,
      projectName: job.project.name,
      status: job.status,
      beginTime: job.beginTime,
      endTime: job.endTime
    }, callback);
  },

  getByProject: function (projectName) {

  },

});

module.exports = Store;