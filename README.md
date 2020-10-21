# 前端业务中监控 SDK 实现

❤️**此仓库设计目的**  
很多公司都是以业务快速开发为主，不注重后续的项目稳定性的监控，每当被提上Bug的时候，都需要重新打开项目运行一步步调试才能找到问题，经验丰富的开发也得找上一段时间。这样的时间就是被白白浪费了。但是如果我们在开发的时候就注入监控逻辑，就能让我们在后续的开发中比较快速的发现问题并解决问题。

💡**tips**  
(1)想要自研的同学可以参考后自行研究，下面会给出一些设计该项目时候的一些思考。  
(2)本仓库尚未提供后端处理数据的模板，同学上报完之后需要根据实际进行数据的处理
(3)项目是用rollup打包的，如果不太理解的话就去先自行了解一下

## 为什么要自研监控 SDK

(1) 社区活跃的 Sentry fundeg 等都是优秀的开源项目，但是并不能针对公司内部的项目进行深度的定制化，假如后续监控系统需要跟其他系统结合，自研系统更容易集成，但开源就可能需要大费周章了。  
(2) 自研可以根据实际情况进行一些调整，不需要完全照搬。自己可以针对性的进行数据的调整，整合以及优化等  
(3) 更多的监控系统都是要收费的

## 上报的数据有什么

1. 用户信息(用户 ID,用户名，唯一可以确定的用户信息，sessionId，cookie 等等)
2. 设备信息(什么浏览器 操作系统 App 版本号)
3. 行为数据(用户访问来源,用户访问路径,用户点击滑动区域等)
4. 性能数据(更好的做性能优化的，脚本加载时间，接口响应时间等)
5. 异常数据(前端脚本加载错误，脚本运行错误)
6. 后端 API 请求超时，返回数据异常，参数交互错误等
7. 定制的活动数据
8. ...自定义数据

## 项目中实现的功能有

[✔️]基于TypeScript的类型检查  
[✔️]PV,UV的简单记录  
[✔️]Error和Promise的拦截  
[✔️]ajax 和 fetch的拦截  
[✔️]自定义性能指标  
[✔️]自定义上报数据  
[✖️]强制上报  
[✖️]没有一个直观的可视化后台  
[✖️]架构方面可能需要进一步的完善  
[✖️]暂时只实现Web，还有小程序和Native需要集成  
[✖️]前端框架也没有集成(Vue,React,Angular等)  
[✖️]缺少单元测试

## 异常类型

| 异常类型           | 同步方法 | 异步方法 |      资源加载       | Promise | async/await |
| ------------------ | :------: | :------: | :-----------------: | :-----: | :---------: |
| try/catch          |    √     |          |                     |         |      √      |
| onError            |    √     |    √     |                     |         |
| Error 事件         |    √     |    √     | √(捕获阶段可以捕获) |         |
| unhandledrejection |          |          |                     |    √    |      √      |

主要是针对浏览器的特定事件(onerror 、onunhandledrejection)就可以捕获错误了。

## 整个监控SDK的架构

![SDK架构](https://github.com/Primroses/MonitorSDK/blob/master/images/image.png)

- 大前端中Web端，小程序和hybrid三端中植入SDK。
- SDK的Core里面的监控模块
  
  - Error：监听Error事件  

  - Fetch/Ajax，监听用户请求时候的url和参数，必要时复现请求过程

  - Track: 监听用户的路径，用户去过的页面，点过的按钮，记录用户的访问路径

  - Promise：catch用户没有catch的Promise(更多的是ajax请求回来的错误)

  - Event：记录一些事件(比如点击事件，滑动事件，滚动事件等，斟酌增加减少)

  - Performance：记录应用的性能，加载资源的时间等，更好的为后续的性能优化做准备

- 监控模块收集到数据就交给Adaptor这一层进行数据的转发
  - Track类型：记录后通过localStorage进行存储，在应用关闭前上报，并清空。记录一次完整的用户的访问路径  

  - Performance类型：记录用户进入应用时的性能，当页面应用空闲的时候进行上报，不阻碍主线程(requestIdelCallback api)

  - Error类型: 监听错误立马上报

- 最后就是上报的方法了
  
  - new Image的形式
  
  - ajax的形式

## 性能合适的指标

1. 页面加载时长:Page Load Time PLT
2. 首屏加载时长:Above the fold Time AFT
3. 首次渲染时长:First Paint
4. 首次内容渲染时长: First Contentful Paint
5. 首次有效内容渲染时长: First Meaningful Paint
6. 开始渲染 start Render

同学们可以针对需要调整性能指标

## 对于开发过程中的一些思考

- 使用localStorage还是IndexedDB
  使用IndexedDB场景中单独存放用户的路径和用户所点击的地方 这些数据假如使用localStorage 存 好像不太方便?  
  (1) 场景中存到本地只有track 还有 ajax请求的请求 场景没有覆盖广泛 大多需要及时上报  
  (2) IndexDB是异步的 假如是上报的时候需要同步发送的时候 就无法及时发送了  
  (3) localstroage 可以通过简单的处理实现该功能

- 定制什么类型的数据  
  (1) 环境数据(操作系统，浏览器UA，还有什么工程，等等)  
  (2) 用户数据(用户ID，场景，sessionId等)  
  (3) hybrid(网络状况，地理位置等)  
  (4) ... 自定义思考数据

- 上报的机制
  (1) Track类型可以做一个筛选操作，再进行上报，不然每次上报数据量大比较麻烦  
  (2) Track类型可以做一个LRU的操作，毕竟localStorage只有5m的容量，如果一次数据大于5m的话就得舍弃刚开始的数据(可能会使数据丢了一部分)，也可以先上报一部分，没有上报的存在localStorage中 下次再上报。  
  (3) performance类型数据在不妨碍用户的浏览器正常运行的情况下再进行上报

- performance.loadEventEnd的问题
  
  这个值需要等待一会才能有值，所以不能直接取。可以通过setInterval的手段进行获取。

- 上报后台以后需要对后台上传sourceMap
  
  报错的信息已经是混淆过后的代码了，所以需要sourcemap才能定位到原始的代码中

## 参考文章

- [监控平台前端SDK开发实践](https://tech.meituan.com/2017/09/07/hunt-sdk-practice.html)
- [从0到1，Vue大牛的前端搭建——异常监控系统（下篇来啦）](https://zhuanlan.zhihu.com/p/144041346)
- [来，跟我一起 ，自研多端错误监控平台（完整版）](https://juejin.im/post/5ec5dba8f265da76e81a2455)
- [如何进行 web 性能监控？](http://www.alloyteam.com/2020/01/14184/#prettyPhoto)