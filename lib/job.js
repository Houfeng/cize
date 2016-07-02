const Class = require('cify').Class;
const EventEmitter = require('events');
const utils = require('./utils');
const fs = require('fs');
const Console = require('console').Console;
const path = require('path');

const JOB_BEGIN_EVENT = 'job.begin';
const JOB_END_EVENT = 'job.end';

const Job = new Class({

  /**
   * 继承 EventEmitter
   **/
  _extends: EventEmitter,

  /**
   * Job 的构造函数
   * @runable {Function} 可以运行的 Function
   **/
  constructor: function (context) {
    if (!context) {
      throw new Error('Invalid parameter: context');
    }
    if (this.isAbstract) return;
    this.context = context;
    this.context.jobs.push(this);
    this.id = utils.id();
    this.server = context.server;
    this.project = context.project;
    this.params = context.params;
    this.paths = context.paths;
    this.outFile = path.normalize(`${this.paths.out}/${this.id}.txt`);
    this.stdout = fs.createWriteStream(this.outFile);
    this.console = new Console(this.stdout);
  },

  /**
   * 标识为抽象类
   **/
  isAbstract: true,

  /**
   * 调用其它 Job 
   * @param {String|Job} job Job 名称或类型
   * @param {Function} callback 完成时的回调
   **/
  invoke: function (job, callback) {
    if (!utils.isString(job)) {
      if (job.project == this.project) {
        return this.context.invoke(job, callback);
      } else {
        return job.project.invoke(job, callback);
      }
    }
    var jobInfo = job.split('.');
    if (jobInfo.length > 1) {
      return this.context.create(jobInfo[0]).invoke(jobInfo[1], callback);
    } else {
      return this.context.invoke(jobInfo[0], callback);
    }
  },

  /**
   * 运行 Job，启动成功返回 true ，失败返回 false
   * 启动成功，并不表达执行能通过
   * @param {Function} callback 执行回完成时的回调
   **/
  _run: function (callback) {
    var self = this;
    callback = callback || utils.NOOP;
    if (!self._canRun()) {
      callback(new Error('Refused to run'));
      return false;
    }
    if (!self.name) {
      callback(new Error('Required property: name'));
      return false;
    }
    if (!self._runable) {
      callback(new Error('Required property: runable'));
      return false;
    }
    //创建 done 方法
    self.done = function (err, result) {
      self._end(err, result, callback);
    };
    self.beginTime = Date.now();
    //设置状并尝试执行
    self._setStatus(Job.status.RUNING, function (err) {
      if (err) return callback(err, self);
      self._triggerBeginEvent();
      utils.try(function () {
        self._runable(self);
      }, function (err) {
        self._end(err, null, callback);
      });
    });
    return true;
  },

  /**
   * 结束运行
   **/
  _end: function (err, result, callback) {
    if (this._ended) {
      if (err) console.error(err.toString());
      return;
    }
    this._ended = true;
    callback = callback || NOOP_FUNCTION;
    this.error = err;
    this.result = result;
    this.endTime = Date.now();
    if (!err) {
      this._setStatus(Job.status.PASSED);
    } else {
      this._setStatus(Job.status.FAILED);
      this.console.error(err);
    }
    this._triggerEndEvent();
    this.stdout.end();
    return callback(err, this);
  },

  /**
   * 触发执行开始事件
   **/
  _triggerEndEvent: function () {
    var self = this;
    self.project.emit(`${JOB_END_EVENT}:${self.name}`, self);
    self.project.emit(JOB_END_EVENT, self);
    self.server.emit(`${JOB_END_EVENT}:${self.project.name}.${self.name}`, self);
    self.server.emit(JOB_END_EVENT, self);
  },

  /**
   * 触发执行结束事件
   **/
  _triggerBeginEvent: function () {
    var self = this;
    self.project.emit(`${JOB_BEGIN_EVENT}:${self.name}`, self);
    self.project.emit(JOB_BEGIN_EVENT, self);
    self.server.emit(`${JOB_BEGIN_EVENT}:${self.project.name}.${self.name}`, self);
    self.server.emit(JOB_BEGIN_EVENT, self);
  },

  /**
   * 是否是一个虚拟 job 实例
   **/
  isShadow: function () {
    return !(this.project.jobs[this.name]);
  },

  /**
   * 设置实例状态
   **/
  _setStatus: function (status, callback) {
    this.status = status;
    if (!this.isAbstract && !this.isShadow()) {
      this.server.store.save(this, callback);
    } else if (callback) {
      callback();
    }
  },

  /**
   * 是否可以执行
   **/
  _canRun: function () {
    var self = this;
    if (!self._beforeRunHooks) return true;
    return !self._beforeRunHooks.some(function (hook) {
      return utils.isFunction(hook) && hook.apply(self, self) === false;
    });
  },

  /**
   * 获取最顶层的 parent
   **/
  deepParent: function () {
    var _parent = this;
    while (_parent.parent) {
      _parent = _parent.parent;
    }
    return _parent;
  },

  /**
   * 清理 job 相关的记录和磁盘文件
   **/
  clean: function (callback) {
    var self = this;
    async.parallel([
      function (done) {
        fs.unlink(this.paths.root, done);
      },
      function (done) {
        self.server.store.remove({
          _id: self.id
        }, done);
      }
    ], callback);
  }

});

/**
 * 是否是一个虚拟 Job 类型
 **/
Job.isShadow = function () {
  return !(this.project.jobs[this.name]);
};

/**
 * Job 实例的状态
 **/
Job.status = {
  RUNING: 100,
  PASSED: 200,
  FAILED: 300
};

/**
 * 获取 job 记录
 * @param {Number} limit 指定记录条数
 * @param {Number} skip 跳过指定的条数
 * @param {Function} callback 完成时的回调函数
 **/
Job.getRecords = function (limit, skip, callback) {
  limit = limit || 100;
  skip = skip || 0;
  this.server.store.find({
    projectName: this.project.name,
    name: this.name
  }, { offset: skip }, 100, ['beginTime', 'Z'], callback);
};

/**
 * 查找一个执行记录
 **/
Job.getRecordBySn = function (sn, callback) {
  this.server.store.findOne({
    projectName: this.project.name,
    name: this.name,
    sn: sn
  }, callback);
};

/**
 * 添加执行前 hook
 **/
Job.beforeRun = function (hook) {
  var proto = this.prototype;
  proto._beforeRunHooks = proto._beforeRunHooks || [];
  proto._beforeRunHooks.push(hook);
};

/**
 * 定义子 Job
 **/
Job.defineJob = function (name, runable) {
  return this.project.defineJob(name, runable, this);
};

module.exports = Job;