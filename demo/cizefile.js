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

  demo1.job('test',ci.series([
    function(done){
      this.console.log('step1');
      done(new Error('step1 Error'));
    },
    function(done){
      this.console.log('step2');
      done();
    }
  ]));
  //demo1.job('cron', ci.cron('*/10 * * * * *', 'pull'));

};
