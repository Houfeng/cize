const Class = require('cify').Class;
const EventEmitter = require('events');
const utils = require('./utils');
const fs = require('fs');
const Console = require('console3').Console;
const path = require('path');
const async = require('async');

const JOB_BEGIN_EVENT = 'job.begin';
const JOB_END_EVENT = 'job.end';

const Job = new Class({

  /**
   * 继承 EventEmitter
   **/
  $extends: EventEmitter,

  /**
   * Job 的构造函数
   * @runable {Function} 可以运行的 Function
   **/
  constructor: function (context, options) {
    EventEmitter.call(this);
    if (!context) {
      throw new Error('Invalid parameter: context');
    }
    options = options || {};
    if (this.isAbstract) return;
    this.context = context;
    this.context.jobs.push(this);
    this.parent = options.parent;
    this.target = options.target;
    this.id = utils.id();
    this.server = context.server;
    this.project = context.project;
    this.params = context.params;
    this.paths = context.paths;
    //确定是否继承 stdout
    this._inheritStdout = (this.isShadow() &&
      this.parent &&
      this.parent.project == this.project &&
      this.parent.stdout &&
      !this.parent.stdout._writableState.finished &&
      options.stdout != 'new');
    //创建 stdout
    if (this._inheritStdout) {
      this.outFile = this.parent.outFile;
      this.stdout = this.parent.stdout;
    } else {
      this.outFile = path.normalize(`${this.paths.out}/${this.project.name}.${this.name}.txt`);
      this.stdout = fs.createWriteStream(this.outFile);
    }
    this.console = new Console(this.stdout, this.stdout);
    this.refused = false;
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
  invoke: function (job, options, callback) {
    if (!callback && utils.isFunction(options)) {
      callback = options;
      options = null;
    }
    callback = callback || utils.NOOP;
    options = options || {};
    if (!options.root) {
      options.parent = this;
    }
    if (!utils.isString(job)) {
      if (job.project == this.project) {
        return this.context.invoke(job, options, callback);
      } else {
        return job.project.invoke(job, options, callback);
      }
    }
    var jobInfo = job.split('.');
    if (jobInfo.length > 1) {
      var childContext = this.context.create(jobInfo[0], options.params || this.params);
      return childContext.ready(function (err) {
        if (err) return callback(err);
        return childContext.invoke(jobInfo[1], options, callback);
      });
    } else {
      return this.context.invoke(jobInfo[0], options, callback);
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
    if (!self.name) {
      callback(new Error('Required property: name'));
      return false;
    }
    if (!self._runable) {
      callback(new Error('Required property: runable'));
      return false;
    }
    self.beginTime = Date.now();
    self._checkBeforeRun(function (err) {
      //检查是允许继续执行
      self.refused = !!err;
      if (self.refused) {
        return self._end(err, null, callback);
      }
      //创建 done 方法
      self.done = function (err, result) {
        self._end(err, result, callback);
      };
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
      //--
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
    callback = callback || utils.NOOP;
    this.error = err;
    this.result = result;
    this.endTime = Date.now();
    if (!err) {
      this._setStatus(Job.status.PASSED);
    } else {
      this._setStatus(Job.status.FAILED);
      this.console.error(err);
    }
    if (!this.refused) {
      this._execAfterRun();
    }
    //虽然 refused 但是还将出发 end 事件，因为无论是否执行，但它结束了
    this._triggerEndEvent();
    //如果不是继承的父实例的 stdout, 则进行关闭
    if (!this.parent || this.parent.stdio != this.stdio) {
      this.stdout.end();
    }
    return this._outAppendToParent(callback);
  },

  /**
   * 合并输出到父 job
   **/
  _outAppendToParent: function (callback) {
    var self = this;
    //如已继承 stdout 或者没有 parent，则不执行合并
    if (self._inheritStdout ||
      !self.parent ||
      self.parent.stdout._writableState.finished) {
      return callback(self.error, self);
    }
    fs.exists(self.outFile, function (exists) {
      if (!exists) return callback(self.error, self);
      fs.readFile(self.outFile, function (err, data) {
        try {
          self.parent.stdout.write((err || data).toString());
        } catch (err) { }
        callback(self.error, self);
      });
    });
  },

  /**
   * 触发执行开始事件
   **/
  _triggerEndEvent: function () {
    var self = this;
    self.$class.emit(JOB_END_EVENT, self);
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
    self.$class.emit(JOB_BEGIN_EVENT, self);
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
    if (!this.isAbstract) {
      this.server.store.save(this, callback);
    } else if (callback) {
      callback();
    }
  },

  /**
   * 是否可以执行
   **/
  _checkBeforeRun: function (callback) {
    var self = this;
    if (!self._beforeRunHooks || self._beforeRunHooks.length < 1) {
      return callback();
    }
    async.parallel(self._beforeRunHooks.map(function (hook) {
      return function (done) {
        var refusedErr = Error('Refused to run');
        var hookArgumentNames = utils.getFunctionArgumentNames(hook);
        if (hookArgumentNames.length > 1) {
          hook.call(self, self, function (_state) {
            done(_state === false ? refusedErr : null);
          });
        } else {
          var _state = hook.call(self, self);
          done(_state === false ? refusedErr : null);
        }
      };
    }), callback);
  },

  /**
   * 执行 run 后 hook
   **/
  _execAfterRun: function () {
    var self = this;
    if (!self._afterRunHooks) return;
    self._afterRunHooks.forEach(function (hook) {
      if (!utils.isFunction(hook)) return;
      hook.call(self, self);
    });
  },

  /**
   * 清理 job 相关的记录和磁盘文件
   **/
  clean: function (callback) {
    var self = this;
    async.parallel([
      function (done) {
        fs.unlink(self.outFile, done);
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
    name: this.name,
    refused: false,
    isShadow: false
  }, { offset: skip }, limit, ['beginTime', 'Z'], callback);
};

/**
 * 清理记录和磁盘文件
 **/
Job.clean = function (condition, callback) {
  condition = condition || {};
  condition.projectName = this.project.name;
  condition.name = this.name;
  return this.server.clean(condition, callback);
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
  if (!utils.isFunction(hook)) {
    throw new Error('Invalid parameter: hook');
  }
  var proto = this.prototype;
  proto._beforeRunHooks = proto._beforeRunHooks || [];
  proto._beforeRunHooks.push(hook);
};

/**
 * 添加执行后 hook
 **/
Job.afterRun = function (hook) {
  if (!utils.isFunction(hook)) {
    throw new Error('Invalid parameter: hook');
  }
  var proto = this.prototype;
  proto._afterRunHooks = proto._afterRunHooks || [];
  proto._afterRunHooks.push(hook);
};

/**
 * 定义子 Job
 **/
Job.defineJob = function (name, runable) {
  return this.project.defineJob(name, runable, this);
};

/**
 * 获取最顶层的 parent
 **/
Job.deepParent = function () {
  var _parent = this;
  while (_parent.parent) {
    _parent = _parent.parent;
  }
  return _parent;
};

/**
 * 初始化需特殊处理的静态成员
 **/
Job._initSpecialDefine = function () {
  //添加处理处理能力开始
  this._eventEimter = this._eventEimter || new EventEmitter();
  utils.each(this._eventEimter, function (name, method) {
    if (!utils.isFunction(method)) return;
    this[name] = function () {
      return this._eventEimter[name].apply(this._eventEimter, arguments);
    };
  }.bind(this));
  //添加处理处理能力结束
};

module.exports = Job;