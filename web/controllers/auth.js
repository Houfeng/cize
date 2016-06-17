/**
 * AuthController
 **/
var AuthController = nokit.define({

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
    self.render('auth', self);
  },

  /**
   * 登录
   **/
  login: function () {
    var self = this;
    if (self.context.form.secret == self.server.ci.secret) {
      self.context.session.set('user',
        self.context.form.secret,
        function () {
          self.context.redirect('/');
        });
    } else {
      self.message = 'xxx';
      self.render('auth', self);
    }
  },

  /**
   * 登出
   **/
  logout: function () {
    var self = this;
    self.context.session.remove('user',
      function () {
        self.context.redirect('/auth');
      });
  }

});

module.exports = AuthController;