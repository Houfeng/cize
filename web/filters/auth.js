/**
 * AuthFilter
 **/
const AuthFilter = nokit.define({

  /**
   * 在处理 MVC 请求时
   **/
  onMvcHandle: function (context, next) {
    var ci = context.server.ci;
    context.tokenKey = `${ci.pkg.name}-token`; //cize-token
    if (context.route.ignoreAuth || !ci.secret) {
      return next();
    }
    var token = context.request.headers[context.tokenKey] ||
      context.param(context.tokenKey) ||
      context.cookie.get(context.tokenKey);
    var payload = ci.verifyToken(token);
    if (payload && payload.expires > Date.now()) {
      context.user = payload;
      next();
    } else {
      return context.redirect('/auth');
    }
  }

});

//exports
module.exports = AuthFilter;