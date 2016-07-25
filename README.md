
# CIZE 是什么？
CIZE 是一个「持续集成」工具，希望能让开发人员更快捷的搭建一个完整、可靠、便捷的 CI 服务。
甚至可以像 Gulp 或 Grunt 一样，仅仅通过一个 ```cizefile.js``` 即可完成几乎所有的工作。

[![npm version](https://badge.fury.io/js/cize.svg)](http://badge.fury.io/js/cize)
[![Build Status](https://travis-ci.org/Houfeng/cize.svg?branch=master)](https://travis-ci.org/Houfeng/cize) 

<img src="https://raw.githubusercontent.com/houfeng/cize/master/screenshot/monitor.png" width="888"/>

# 快速搭建
### 全局安装 
```sh
$ [sudo] npm install cize -g
```

### 编写 Job

新建 cizefile.js
```
$ mkdir your_path
$ cd your_path
$ vim cizefile.js
```

输入如下内容
```js
//定义「项目」
const demo = cize.project('demo', {});

//定义一个 Job，这是一个最基础的 Job
demo.job('hello', function (self) {
  self.console.log('hello world');
  self.done();
});
```

然后，在「工作目录」中执行 ```cize``` 启动服务

```
$ cize
Strarting...
The server on "localhost:9000" started 
```
默认会启动和 CPU 核数相同的「工作进程」。

接下来，可以在浏览器中访问 ```http://localhost:9000``` , 
并可以在 UI 中手动触发这个名为 ```hello``` 的 Job

# 定义 Project
```js
const demo = cize.project('demo', {
  ...
  //可以在此添加针对项目的配置
  ...
});
```
注意，即便一个项目不需要任何配置，也不能省略第二个参数，
没有第二个参数时 ```cize.project(name)``` 为获取指定的项目

# 定义 Job
假定现在已经有一个定义好的名为 ```demo``` 的 ```project``` 

### 用 js 编写的 Job
```js
demo.job('test', function (self) {
  self.console.log('test');
  self.done();
});
```
这是最基础的 Job 类型，是其它 Job 类型或「扩展」的基础。

### 用 shell 编写的 Job
```js
demo.job('test', cize.shell(function () {
  /*
    echo "hello world"
  */
}));
```
 定义一个用 SHELL 编写的 Job，用到了 cize.shell，这是一个「内置扩展」

### 定时执行的 Job
```js
demo.job('test', cize.cron('* */2 * * * *', cize.shell(function () {
  /*
    echo "hello world"
  */
})));
```
如上定义了一个每两分种触发一次的 Job 并且，嵌套使用了 shell.

### 监听其它 Job 的 Job
```js
demo.job('test2', cize.by('test1', function(self){
  self.console.log('hello');
  self.done();
});
```
如下，在 test1 执行成功后，将会触发 test2

### 串行执行的 Job
```js
demo.job('test', cize.series([
  "test1",
  function(self){
    self.console.log('hello');
    self.done();
  },
  "test3"
]));
```
series 是一个内置扩展，可以定义一个「串行执行」多个步骤的任务列表，每个步骤可以是一个任意类型的 job，
也可以是指定要调用的其它 Job 的名称。

### 并行执行的 Job
```js
demo.job('test', cize.parallel([
  "test1",
  function(self){
    self.console.log('hello');
    self.done();
  },
  "test3"
]));
```
series 是一个内置扩展，可以定义一个「并行执行」多个步骤的任务列表，每个步骤可以是一个任意类型的 job，
也可以是指定要调用的其它 Job 的名称。

### 多步嵌套的 Job 
CIZE 所有的 Job 可以自由嵌套，例如：
```js
demo.job('test', cize.parallel([
  "test1",
  function(self){
    self.console.log('hello');
    self.done();
  },
  "test3",
  cize.series([
    "test4",
    cize.shell(function(){
      /*
        echo hello
      */
    })
  ])
]));
```
当你使用一个「外部扩展」时，也可以混合使用。

# 编写一个扩展
如上用到的 cize.shell、cize.series、cize。parallel、cize.cron、cize.by 是 cize 默契认包含的「内置扩展」。
编写一个「外部扩展」和「内置扩展」并无本质区别，如下:
```js
module.exports = function(options...){
  return function(self){
    //处理逻辑
  };
};
```
如查需要在 Job 定义时进行一些处理，可以使用 ```register``` ，如下
```js
module.exports = function(options...){
  return {
    register: function(Job){
      //Job 是你的「自定义 Job 类型」
      //注册时逻辑
    },
    runable: function(self){
      //执行时逻辑
    }
  };
};
```
可以将扩展发布为一个「npm 包」，让更多的人使用。

# 服务选项

可以通过一些选择去控制 CI 服务的端口、密钥等，有两种方式，如下

### 在 cizefile.js 中配置
```js
cize.config({
  port: 9000,
  secret: '12345'
});
```

### 通过命令行工具
```js
cize ./ -p=port -s=secret
```
通过 cize -h 可以查看完整的说明
```sh
Usage:
  cize [folder|file] [options]

Options:
  -w   set the number of workers
  -p   set the port
  -s   set the secret
  -h   display help information

Example:
  cize ./ -p=9000 -s=12345 -w=4
```

# 更多内容

请访问 wiki: [https://github.com/Houfeng/cize/wiki](https://github.com/Houfeng/cize/wiki)

# 路线图
- 所有 Job 都在单儿独立在一个进程中执行（现在可能会有 n 个 job 共用一个主进程）
- 集成 Docker 