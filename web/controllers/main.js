/**
 * 定义 MainController
 **/
const MainController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function () {
    var self = this;
    //CI
    self.ci = self.server.ci;
    //项目
    self.projects = self.ci.projects;
    self.projectName = self.context.params.project || Object.getOwnPropertyNames(self.projects)[0];
    if (!self.projectName) {
      return self.render('alert');
    }
    self.project = self.ci.project(self.projectName);
    if (!self.project) {
      return self.context.notFound();
    }
    //job
    self.jobs = self.project.jobs;
    self.jobName = self.context.params.job || Object.getOwnPropertyNames(self.jobs)[0];
    if (!self.jobName) {
      return self.render('alert');
    }
    self.job = self.project.job(self.jobName);
    if (!self.job) {
      return self.context.notFound();
    }
    //记录
    self.sn = self.context.params.sn;
    self.job.getRecords(100, 0, function (err, records) {
      if (err) return self.context.error(err);
      self.records = records;
      self.ready();
    });
  },

  /**
   * 默认 action
   **/
  index: function () {
    var self = this;
    self.render("main", self);
  },

  /**
   * 触发一个 Job 
   **/
  trigger: function () {
    var self = this;
    self.render("main", self);
  }

});

module.exports = MainController;