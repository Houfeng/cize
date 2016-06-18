const TOKEN_MAX_AGE = 60 * 60 * 24;

/**
 * AuthController
 **/
const AuthController = nokit.define({

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
      var expires = Date.now() + (TOKEN_MAX_AGE * 1000);
      var token = self.server.ci.encode({
        ip: self.context.request.clientInfo.ip,
        expires: expires
      });
      self.context.cookie.set(self.context.tokenKey, token, {
        "expires": new Date(expires),
        "Max-Age": TOKEN_MAX_AGE
      });
      self.context.redirect('/');
    } else {
      //self.message = 'xxx';
      self.render('auth', self);
    }
  },

  /**
   * 登出
   **/
  logout: function () {
    var self = this;
    self.context.cookie.remove(self.context.tokenKey);
    self.context.redirect('/auth');
  }

});

module.exports = AuthController;