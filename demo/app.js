var ci = require('../');
var server = new ci.Server({
  port: 8090
});

var demo1 = server.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', ci.series([ci.parallel([
  function (context, done) {
    console.log('pull1');
    done();
  },
  function (context, done) {
    console.log('pull2');
    done();
  }
])]));

demo1.job('build', ci.on('demo1.pull', function (context, done) {
  console.log('build');
  done();
}));

server.start(function () {
  demo1.invoke('pull', function (err) {
    if (err) console.log(err);
  });
});