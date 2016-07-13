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
    self.server.ci.invoke(
      self.context.params.project,
      self.context.params.job,
      {
        params: self.context.request.body || self.context.request.query
      },
      null,
      function (started) {
        self.context.send({
          status: started,
          time: new Date()
        });
      }
    );
  }

});

module.exports = TriggerController;