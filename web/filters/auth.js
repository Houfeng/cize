/**
 * AuthFilter
 **/
var AuthFilter = nokit.define({

  /**
   * 在处理 MVC 请求时
   **/
  onMvcHandle: function (context, next) {
    if (!context.server.ci.secret) {
      return next();
    }
    context.session.get('user', function (user) {
      if (!context.route.ignoreAuth && !user) {
        return context.redirect('/auth');
      } else {
        context.user = user;
        next();
      }
    });
  }

});

//exports
module.exports = AuthFilter;