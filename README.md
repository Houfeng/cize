# CIZE 是什么？
CIZE 是一个「持续集成」工具，希望能让开发人员更快捷的搭建一个完整、可靠、便捷的 CI 服务。
甚至可以像 Gulp 或 Grunt 一样，仅仅通过一个 cizefile.js 即可完成几乎所有的工作。

# 快速搭建
#### 安装 CIZE
```sh
$ sudo install cize -g
```

#### 添加 JOB

新建一个 cizefile.js
```
$ mkdir cize_workspace
$ cd cize_workspace
$ vim cizefile.js
```

输入如下内容
```js
module.exports = function (ci) {

  ci.config({
    port: 9000,
    secret: '12345',
  });

  const demo = ci.project('demo', {});

  demo.job('hello1', function (self) {
    self.console.log('hello world');
    self.done();
  });

  demo.job('hello2', ci.shell(function(){
    /*
      echo "hello world"
    */
  }));

};
```

在「工作目录」中执行
```sh
$ cize
```

即可启动 CI 服务
```
$ cize
Strarting...
The server on "localhost:9000" started #30180
The server on "localhost:9000" started #30183
The server on "localhost:9000" started #30182
The server on "localhost:9000" started #30181
```
默认会启动和 CPU 核数相同的「工作进程」。