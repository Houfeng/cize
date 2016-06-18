/**
 * TriggerController
 **/
const TriggerController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function () {
    var self = this;
    self.ready();
  },

  /**
   * 默认 action
   **/
  index: function () {
    var self = this;
    if (self.context.param('secret') != self.server.ci.secret) {
      return self.context.forbidden();
    }
    self.server.ci.invoke(
      self.context.params.project,
      self.context.params.job,
      self.context.request.body || self.context.request.query
    );
    self.context.send({
      status: 'ok',
      time: new Date()
    });
  }

});

module.exports = TriggerController;