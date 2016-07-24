const Class = require('cify').Class;
const utils = require('./utils');
const mkdir = require('mkdir-p');
const orm = require('orm');
const exitHook = require('exit-hook2');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
    this._exitPidPath = `${server.paths.data}.exit.pid`
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
      self._defineRecord();
      db.sync(function (err) {
        if (err) return callback(err);
        self._bindExitHandler();
        self._handleRecordForExit(callback);
      });
    });
  },

  /**
   * 定义 Record
   **/
  _defineRecord: function () {
    var self = this;
    var options = {
      methods: {
        getOut: function (callback) {
          var record = this;
          var paths = self.server.getContextPaths(record.contextId);
          var outFile = path.normalize(`${paths.out}/${record.projectName}.${record.name}.txt`);
          fs.exists(outFile, function (exists) {
            if (!exists) {
              return callback(null, 'not found');
            }
            fs.readFile(outFile, callback);
          });
        }
      }
    };
    self.Record = self.db.define('record', {
      _id: { type: 'text', key: true },
      sn: { type: 'number' },
      name: { type: 'text' },
      summary: { type: 'text' },
      projectName: { type: 'text' },
      contextId: { type: 'text' },
      beginTime: { type: 'number' },
      endTime: { type: 'number' },
      status: { type: 'number' },
      isShadow: { type: 'boolean' },
      refused: { type: 'boolean' },
      processId: { type: 'number' }
    }, options);
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
      isShadow: job.isShadow(),
      refused: job.refused,
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
    return self.Record.find({
      projectName: job.project ? job.project.name : job.projectName,
      name: job.name
    }, { offset: 0 }, 1,
      ['sn', 'Z'], function (err, records) {
        if (err) return callback(err);
        if (job.refused) {
          // refused 的 Job 的 sn 固定为 0;
          job.sn = 0;
        } else {
          job.sn = records && records[0] ? records[0].sn + 1 : 1;
        }
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
    return this.Record.find(condition, { offset: 0 }, 1, ['beginTime', 'Z'],
      function (err, records) {
        if (err) return callback(err);
        records = records || [];
        callback(null, records[0]);
      });
  },

  /**
   * 删除符合条件的记录
   **/
  remove: function (condition, callback) {
    callback = callback || utils.NOOP;
    return this.Record.find(condition).remove(callback);
  },

  /**
   * 绑定进程退出事件 
   **/
  _bindExitHandler: function () {
    var self = this;
    if (self._exitHandlerBound) return;
    exitHook(function () {
      if (!fs.existsSync(self.server.paths.data)) {
        return;
      }
      var pid = `${process.pid}${os.EOL}`;
      fs.appendFileSync(self._exitPidPath, pid);
    });
    self._exitHandlerBound = true;
  },

  /**
   * 处理退出时还在运行的任务记录
   **/
  _handleRecordForExit: function (callback) {
    var self = this;
    callback = callback || utils.NOOP;
    fs.exists(self._exitPidPath, function (exists) {
      if (!exists) return callback();
      fs.readFile(self._exitPidPath, function (err, data) {
        if (err || !data) return callback(err);
        fs.writeFile(self._exitPidPath, '');
        var pids = data.toString().split(os.EOL).filter(function (pid) {
          return !!pid;
        });
        if (pids.length < 1) return callback();
        var status = require('./job').status;
        self.db.driver.execQuery(
          `UPDATE record SET status=? WHERE status=? AND processId IN (${pids})`,
          [status.FAILED, status.RUNING],
          callback
        );
      });
    });
  }

});

module.exports = Store;