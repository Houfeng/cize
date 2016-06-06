var ci = require('../');
var server = new ci.Server({
  port: 8090
});

var demo1 = server.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', function (context, done) {
  console.log('pull');
  done();
});

demo1.job('build', ci.on('pull', function (context, done) {
  console.log('build');
  done();
}));

//demo1.invoke('pull');

server.start();