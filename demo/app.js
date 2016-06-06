var ci = require('../');
var server = new ci.Server();

var demo1 = server.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('build', ci.shell(function () {
  /*
  ls
  */
}));

demo1.invoke('build');

server.start();