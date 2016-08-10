var fs = require('fs');
const utils = require('../common/utils');

/**
 * ApiController
 **/
const ApiController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function () {
    this.ci = this.server.ci;
    this.projectName = this.context.params.project;
    this.jobName = this.context.params.job;
    this.recordSn = this.context.params.sn;
    this.params = this.context.request.body || this.context.request.query;
    this.ready();
  },

  /**
   * 响应数据
   **/
  send: function (status, data) {
    this.context.status(status);
    this.context.json(data);
  },

  /**
   * 默认 action
   **/
  index: function () {
    this.send(200, {
      name: this.ci.pkg.name,
      version: this.ci.pkg.version,
      links: []
    });
  },

  /**
   * 生成 token
   **/
  token: function () {
    var token = this.ci.createToken(this.context.param('maxAge'));
    this.send(200, {
      token: token
    });
  },

  /**
   * 默认 action
   **/
  trigger: function (context, params) {
    var self = this;
    self.server.ci.externalInvoke(
      self.projectName,
      self.jobName,
      {
        params: params || self.params
      },
      null,
      function (started) {
        self.send(started ? 202 : 400, {
          message: started ? 'Job is triggered' : 'Trigger failed'
        });
      }
    );
  },

  /**
   * 查询所有项目
   **/
  projects: function () {
    this.send(200, this.ci.getProjects().map(function (item) {
      return {
        id: item.id,
        name: item.name
      };
    }));
  },

  /**
   * 查询一个项目
   **/
  project: function () {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    this.send(200, {
      id: project.id,
      name: project.name
    });
  },

  /**
   * 查询所有 jobs
   **/
  jobs: function () {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    var jobs = project.getJobs(!!this.context.query.shadow);
    this.send(200, jobs.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        isShadow: item.isShadow()
      };
    }));
  },

  /**
   * 查询一个 job
   **/
  job: function () {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    var job = project.job(this.jobName);
    if (!job) {
      return this.send(404, {
        message: 'Job not found'
      });
    }
    this.send(200, {
      id: job.id,
      name: job.name,
      isShadow: job.isShadow()
    });
  },

  /**
   * 查询所有记录
   **/
  records: function () {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    var job = project.job(this.jobName);
    if (!job) {
      return this.send(404, {
        message: 'Job not found'
      });
    }
    var limit = Number(this.context.query.limit || 100);
    var skip = Number(this.context.query.skip || 0);
    job.getRecords(limit, skip, function (err, records) {
      if (err) {
        return this.send(500, {
          message: err.message
        });
      }
      this.send(200, records);
    }.bind(this));
  },

  /**
   * 查询整个服务所有记录
   **/
  serverRecords: function () {
    var limit = Number(this.context.query.limit || 100);
    var skip = Number(this.context.query.skip || 0);
    this.ci.getRecords(limit, skip, function (err, records) {
      if (err) {
        return this.send(500, {
          message: err.message
        });
      }
      this.send(200, records);
    }.bind(this));
  },

  /**
   * 查询指定项目所有记录
   **/
  projectRecords: function () {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    var limit = Number(this.context.query.limit || 100);
    var skip = Number(this.context.query.skip || 0);
    project.getRecords(limit, skip, function (err, records) {
      if (err) {
        return this.send(500, {
          message: err.message
        });
      }
      this.send(200, records);
    }.bind(this));
  },

  /**
   * 查询一条记录
   **/
  record: function (context, callback) {
    var project = this.ci.project(this.projectName);
    if (!project) {
      return this.send(404, {
        message: 'Project not found'
      });
    }
    var job = project.job(this.jobName);
    if (!job) {
      return this.send(404, {
        message: 'Job not found'
      });
    }
    job.getRecordBySn(this.recordSn, function (err, record) {
      if (err) {
        return this.send(500, {
          message: err.message
        });
      }
      if (!record) {
        return this.send(404, {
          message: 'Record not found'
        });
      }
      if (callback) {
        return callback(err, record);
      }
      this.send(200, record);
    }.bind(this));
  },

  /**
   * 显示控制台输出
   **/
  console: function (context) {
    var self = this;
    self.record(context, function (err, record) {
      record.getOut(function (err, data) {
        if (err) {
          return this.send(500, {
            message: err.message
          });
        }
        self.send(200, {
          status: record.status,
          out: utils.ansiToHtml(data)
        });
      });
    });
  },

  /**
   * 重新运行一个 job
   **/
  rerun: function (context) {
    var self = this;
    self.record(context, function (err, record) {
      var paths = self.ci.getContextPaths(record.contextId);
      fs.readFile(paths.params, function (err, data) {
        if (err) {
          return self.send(400, {
            message: 'Trigger failed'
          });
        }
        self.trigger(context, JSON.parse((data || '{}').toString()));
      });
    });
  }

});

module.exports = ApiController;