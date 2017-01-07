/**
 * 配置服务，可以指定「端口」、「密钥」、「工作目录」等
 * port：端口，默认为 9000
 * secret：密且，默认没启用，启用后登录「WEB 版监视界面」需要提供
 * workspace：工作目录，默认为 cizefile.js 所在目录
 **/
cize.config({
  secret: '12345',
  //mode: 'new-process'
});

/**
 * 定义「项目」，项目用于为 JOB 分组，第二个参数为「项目配置」
 * {} 不能省略，省略时为获取指定名称的项目
 **/
const demo = cize.project('demo', {});

/**  
 * 定义一个 JOB，这是一个最基本的 JOB，
 * 其它各类，都是在此基础之上的「扩展」   
 **/
demo.job('job1', function (self) {
  self.console.log('hello job1');
  self.done();
});

/**
 * 定义一个用 SHELL 编写的 JOB
 * 如下用到了 cize.shell，这是多个「内置扩展」中的一个
 **/
demo.job('job2', cize.shell(function () {
  /*
    echo "hello job2"
  */
}));