var ci = require('../');
var server = new ci.Server({
  workspace: '/Users/Houfeng/Desktop/cix-root',
  port: 8090
});

var demo1 = server.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', ci.series([function (done) {
  this.console.log('pull1');
  done();
}]));

demo1.job('build', ci.on(['pull'], function (done) {
  this.console.log('build');
  done();
}));

server.start(function () {
  demo1.invoke('pull', function (err, job) {
    if (err) throw (err);
    console.log(job.name);
  });
});