// error 可以 捕获 error 和 资源加载错误

import { Context } from "../index";
import { ErrorData } from "../data/index";
import { getPageInfo, deepClone } from "../utils/index";
import { useRequest, getRequsetUrl } from "../utils/request";

export default function patchError(context: Context) {
  // 应该不会内部都报错的吧???? 这么拉胯的吗?
  try {
    window.addEventListener(
      "error",
      function (e: any) {
        // 判断是否有资源加载错误的....
        let params;
        if (!e.cancelable) {
          var { localName, href, src } = e.target;
          let sourceUrl = "";
          if (localName === "link") {
            sourceUrl = href;
          } else {
            sourceUrl = src;
          }
          // 这些是记录 错误的文件名 文件类型
          params = {
            resourceType: localName,
            sourceUrl,
          };
        } else {
          // 就是脚本发生错误了
          const { lineno, filename, timeStamp, error } = e;
          const message = error ? error.message : e.message;
          const stack = error ? error.stack : "";
          // 第几行 文件名 时间 调用栈
          params = {
            lineno,
            filename,
            timeStamp,
            message,
            stack,
          };
        }
        // 整合一手 数据
        const data: ErrorData = Object.assign(deepClone(context.data), {
          timeStamp: new Date().toString(),
          mainType: params.resourceType ? "RESOURCE" : "ERROR",
          data: params,
          pageInfo: getPageInfo(),
          currentUrl: window.location.href,
          refererUrl: document.referrer, // 看下来源
        }); // 覆盖第一个参数
        // 操作数据库 (这种是不是应该马上上报呢?) 发生错误 应该直接上报
        const url = getRequsetUrl(data, context.baseUrl + "/error");
        useRequest(url);
      },
      true
    );
  } catch (error) {
    console.log(error);
  }
}
