var ci = require('../');
var server = new ci.Server({
  port: 8090
});

var demo1 = server.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', ci.parallel([
  function (context, done) {
    context.console.log('pull1');
    done();
  },
  function (context, done) {
    context.console.log('pull2');
    done();
  },
  ci.shell(function () {
    /*
    echo pull3
    ls
    */
  })
]));

demo1.job('build', ci.on('pull', function (context, done) {
  context.console.log('build');
  done();
}));

server.start(function () {
  // demo1.invoke('pull', function (err, context) {
  //   if (err) throw (err);
  //   console.log(context.path);
  // });
});