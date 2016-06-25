const Class = require('cify').Class;
const utils = require('./utils');
const mkdir = require('mkdir-p');
const orm = require("orm");

/**
 * 存储模块
 **/
const Store = new Class({

  /**
   * Store 的构造函数
   * @param {server} server 实例 
   **/
  constructor: function (server) {
    this.server = server;
  },

  /**
   * 建立连接
   * @param {Function} callback 执行完成时的回调
   **/
  connect: function (callback) {
    var self = this;
    callback = callback || utils.NOOP;
    var server = self.server, pkg = self.server.pkg;
    var connstr = `sqlite://${server.paths.data}${pkg.name}-${pkg.dbVersion}.db`;
    orm.connect(connstr, function (err, db) {
      if (err) return callback(err);
      self.db = db;
      self.Record = db.define('record', {
        _id: { type: 'text', key: true },
        sn: { type: 'number' },
        name: { type: 'text' },
        summary: { type: 'text' },
        projectName: { type: 'text' },
        contextId: { type: 'text' },
        beginTime: { type: 'number' },
        endTime: { type: 'number' },
        status: { type: 'number' },
        processId: { type: 'text' }
      });
      db.sync(function () {
        callback(null, self);
      });
    });
  },

  /**
   * 转换一个 job 为用于存储的记录
   * @param {Job} job job 实例
   **/
  _convertJob: function (job) {
    return {
      _id: job.id,
      sn: job.sn,
      name: job.name,
      summary: job.summary || job.context.summary,
      projectName: job.project.name,
      contextId: job.context.id,
      beginTime: job.beginTime,
      endTime: job.endTime,
      status: job.status,
      processId: process.pid
    };
  },

  /**
   * 更新 Job 执行记录
   * @param {Function} callback 执行完成时的回调
   **/
  update: function (job, callback) {
    var self = this;
    self.Record.find({ _id: job.id }, function (err, records) {
      if (err) return callback(err);
      if (records.length < 1) return callback();
      var record = records[0];
      var attrs = self._convertJob(job);
      utils.copy(attrs, record);
      record.save(callback);
    });
  },

  /**
   * 插入 job 执行记录 
   * @param {Job} job job 实例
   * @param {Function} callback 执行完成时的回调
   **/
  insert: function (job, callback) {
    var self = this;
    callback = callback || utils.NOOP;
    return self.Record.count({ name: job.name }, function (err, count) {
      if (err) return callback(err);
      job.sn = count + 1;
      self.Record.create(self._convertJob(job), callback);
    });
  },

  /**
   * 保存 Job （插入或更新)
   * @param {Job} job job 实例
   * @param {Function} callback 执行完成时的回调
   **/
  save: function (job, callback) {
    var self = this;
    callback = callback || utils.NOOP;
    return self.Record.exists({ _id: job.id }, function (err, exists) {
      if (err) return callback(err);
      if (exists) {
        self.update(job, callback);
      } else {
        self.insert(job, callback);
      }
    });
  },

  /**
   * 查找 job 执行记录
   * db.find(condition).sort(sort).skip(skip).limit(limit).exec(callback);
   **/
  find: function () {
    return this.Record.find.apply(this.Record, arguments);
  },

  /**
   * 查找一个 job 执行记录
   **/
  findOne: function (condition, callback) {
    callback = callback || utils.NOOP;
    return this.Record.find(condition, function (err, records) {
      if (err) return callback(err);
      records = records || [];
      callback(null, records[0]);
    });
  }

});

module.exports = Store;