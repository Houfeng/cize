/**
 * AuthFilter
 **/
const AuthFilter = nokit.define({

  /**
   * 在处理 MVC 请求时
   **/
  onMvcHandle: function (context, next) {
    var ci = context.server.ci;
    context.tokenKey = `${ci.pkg.name}-${ci.id}`;
    if (context.route.ignoreAuth || !ci.secret) {
      return next();
    }
    var payload = ci.decode(context.cookie.get(context.tokenKey));
    if (payload &&
      payload.ip == context.request.clientInfo.ip &&
      payload.expires > Date.now()) {
      context.user = payload;
      next();
    } else {

      return context.redirect('/auth');
    }
  }

});

//exports
module.exports = AuthFilter;