const GENERAL_TOKEN_KEY = 'token';

/**
 * AuthFilter
 **/
const AuthFilter = nokit.define({

  /**
   * 在处理 MVC 请求时
   **/
  onMvcHandle: function (context, next) {
    var ci = context.server.ci;
    //--
    context.tokenKey = `${ci.pkg.name}-token`;
    context.getToken = function (tokenKey) {
      tokenKey = tokenKey || this.tokenKey;
      return this.request.headers[tokenKey] ||
        this.param(tokenKey) ||
        this.cookie.get(tokenKey);
    };
    //--
    if (context.route.ignoreAuth || !ci.secret) {
      return next();
    }
    var token = context.getToken() || context.getToken(GENERAL_TOKEN_KEY);
    var payload = ci.verifyToken(token);
    if (payload && payload.expires > Date.now()) {
      context.user = payload;
      next();
    } else if (/^\/api/igm.test(context.request.url)) {
      context.status(401);
      return context.json({
        message: 'Authentication failed'
      });
    } else {
      return context.redirect('/auth');
    }
  }

});

//exports
module.exports = AuthFilter;