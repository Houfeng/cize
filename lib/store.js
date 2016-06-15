const Class = require('cify').Class;
const utils = require('./utils');
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
   
  },

  /**
   * 保存 Job 执行记录
   **/
  save: function (job) {
    
  },

  getByProject: function (projectName) {

  },

});

module.exports = Store;