var ci = require('../');

ci.config({
  workspace: __dirname,
  port: 8090,
  secret: '12345',
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/nokitjs/nokit.git'
});

demo1.job('test', ci.parallel(function () {
  this.done(new Error(1));
}, function () {
  this.done(new Error(2));
}));

demo1.job('shell', ci.shell(function () {
  /*
  ping www.baidu.com
  */
}));

/**
 * 定义一个用 SHELL 编写的 JOB
 * 如下用到了 cize.shell，这是多个「内置扩展」中的一个
 **/
demo1.job('hello-by-shell', cize.shell(function () {
  /*
    echo "hello world"
    npm test 
  */
}));

ci.start();