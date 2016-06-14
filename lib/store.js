const Class = require('cify').Class;
const utils = require('./utils');
const low = require('lowdb');
const mkdir = require('mkdir-p');

const RECORDS = 'records';

/**
 * 存储模块
 **/
const Store = new Class({

  /**
   * Store 的构造函数
   * @param {server} server 实例 
   **/
  constructor: function (server) {
    this.db = low(`${server.path.data}${RECORDS}.json`);
    this.db.set(RECORDS, []).value();
  },

  /**
   * 保存 Job 执行记录
   **/
  save: function (job) {
    return this.db.get(RECORDS)
      .find({ id: job.id })
      .assign({
        id: job.id
      }).value();
  },

  getByProject: function (projectName) {

  },

});

module.exports = Store;