module.exports = function (ci) {

  ci.config({
    port: 8090,
    secret: '12345',
  });

  var demo1 = ci.project('demo1', {
    repertory: 'https://github.com/nokitjs/nokit.git'
  });

  demo1.job('pull', ci.shell(function () {
    /*
    echo pull     
    */
  }));

  demo1.job('build', ci.by(['pull'], ci.shell(function () {
    /*
    echo build
    ping www.baidu.com
    */
  })));

  //demo1.job('cron', ci.cron('*/10 * * * * *', 'pull'));

};