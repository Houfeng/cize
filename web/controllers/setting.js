/**
 * SettingController
 **/
var SettingController = nokit.define({

  /**
   * 初始化方法，每次请求都会先执行 init 方法
   **/
  init: function() {
    var self = this;
    self.ready();
  },

  /**
   * 默认 action
   **/
  index: function() {
    var self = this;
    self.render("view");
  }

});

module.exports = SettingController;