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
   * 转换一个 job 为用于存储的记录
   **/
	_convertJob: function (job) {
		return {
			_id: job.id,
			sn: job.sn,
			name: job.name,
			contextId: job.context.id,
			projectName: job.project.name,
			status: job.status,
			beginTime: job.beginTime,
			endTime: job.endTime
		};
	},

	/**
   * 更新 Job 执行记录
   **/
	update: function (job, callback) {
		this._records.update({ _id: job.id }, this._convertJob(job), {}, callback);
	},

	/**
   * 插入 job 执行记录 
   **/
	insert: function (job, callback) {
		var self = this;
		self._records.count({ name: job.name }, function (err, count) {
			if (err) return callback(err);
			job.sn = count;
			self._records.insert(self._convertJob(job), callback);
		});
	},

  /**
   * 保存 Job （插入或更新)
   **/
	save: function (job, callback) {
		var self = this;
		self._records.find({ _id: job.id }, function (err, docs) {
			if (err) return callback(err);
			if (docs && docs.length > 0) {
				self.update(job, callback);
			} else {
				self.insert(job, callback);
			}
		});
	}

});

module.exports = Store;

