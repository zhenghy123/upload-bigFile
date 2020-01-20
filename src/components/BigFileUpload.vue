<template>
  <div class="hello">
    <!-- <input type="file" @change="fileChange" /> -->
    <el-button type="primary" @click="uploadFile">上传</el-button>
    <br />
    {{ percetage }}
    无界面文件上传
    <br />
    <br />
    <br />
    {{ this.$data }}
    <br />
    <br />
    {{ this.data }}
    <slot></slot>
  </div>
</template>

<script>
/**
 * commit方法列表：
 * uploadSuccess 全部上传成功
 * uploadError 上传失败
 * fastUpload 文件秒传
 * uploadStart 开始上传
 * uploadStop 暂停上传
 */

// validator: function (value) {
//         // 这个值必须匹配下列字符串中的一个
//         return ['success', 'warning', 'danger'].indexOf(value) !== -1
//       }
export default {
  name: "BigFileUpload",
  props: {
    //文件,e.target.files
    file: {
      type: File,
      default: () => null
    },
    //切片大小，动态计算和切片个数不能同时存在,默认2M
    chunkSize: {
      type: Number,
      default: 1024 * 2
    },
    // 是否开启断点续传
    breakpointUpload: {
      type: Boolean,
      default: true
    },
    //最大失败次数，超过不进行接口调用，服务器或网络不稳定
    maxErrorCount: {
      type: Number,
      default: 3
    },
    //最大并发请求个数,切片连续上传请设置成1
    maxRequestCount: {
      type: Number,
      default: 1
    },
    xhrOptions: {
      type: Object,
      default: () => ({
        url:
          "http://192.168.1.3:3300/mock/39/api/v1/copyright-file/upload-file",
        method: "POST",
        header: null
      })
    }
  },
  data() {
    return {
      worker: null,
      hash: "", //文件md5
      status: "", //上传状态,Start:开始,Stop:暂停,Done:部分成功,Success:成功，Error:失败
      data: [],

      chunkLength: 0, //切片个数，动态计算
      percetage: 0, //上传进度
      hashPercentage: 0, //hash计算进度

      errorCount: 0, //失败次数，用于控制接口调用
      errorMsg: "", //失败信息
      successCount: 0, //成功次数，可用于判断是否上传完成
      currentRequestCount: 0 //当前正在进行请求数
    };
  },
  // 推荐有文件才v-if使用组件
  created() {
    this.initFile();
  },
  watch: {
    file(val) {
      console.log("file--", val);

      this.initFile();
    },
    currentRequestCount(val) {
      if (this.status !== "Start") return;

      //已全部请求成功
      if (val === this.chunkLength) return;

      //失败数达到最大
      if (val >= this.maxErrorCount) return;

      //剩余可上传个数
      let lessCount = this.maxRequestCount - this.currentRequestCount;
      if (lessCount <= 0) return;
      setTimeout(() => {
        console.log("开始下一个上传");
        for (let index = 0; index < this.data.length; index++) {
          const element = this.data[index];
          if (lessCount <= 0) return;
          let a = !element.isRequest && !element.done;
          if (a) {
            element.xhr.start();
            lessCount--;
          }
        }
        // this.data.map(item => {
        //   if (lessCount <= 0) return;
        //   let a = !item.isRequest && !item.done;
        //   if (a) {
        //     item.xhr.start();
        //     lessCount--;
        //   }
        // });
      }, 0);
    },
    successCount(val) {
      //请求数和成功数相等
      this.percetage = Number(
        Number((100 * val) / this.chunkLength).toFixed(2)
      );
      if (val === this.chunkLength) {
        this.status = "Success";
        //发送全部上传成功接口，告诉服务端进行合片
        console.warn(`uploadSuccess上传成功，共计${val}个切片`, this.$data);
        this.$emit("uploadSuccess", this.$data);
      }
    },
    //失败个数
    errorCount(val) {
      //大于最大失败次数终止上传
      if (val >= this.maxErrorCount) {
        this.status = "Error";
        this.abortAll();
        //发送数据告诉上传失败
        let msg = `上传失败次数大于设定最大可失败次数${this.maxErrorCount},请检查服务器或网络重新上传`;
        this.msg = msg;
        console.error("uploadError", this.$data);
        this.$emit("uploadError", this.$data);

        //是否重置数据
      }
    }
  },
  methods: {
    fileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      console.log("file", file);

      this.file = file;
    },
    initFile() {
      // 切片数据初始化
      if (this.file) {
        let chunkList = [];
        let index = 0;
        let startSize = 0;
        while (startSize < this.file.size) {
          let file = this.file.slice(startSize, startSize + this.chunkSize);
          let name = `${this.file.name}-${index}`;

          // let formData = new FormData();
          // formData.append("file", file);
          // formData.append("index", index);
          // formData.append("name", name);
          // formData.append("filename", this.file.name);

          // let xhrOptions = this.xhrOptions;
          // xhrOptions.formData = formData;
          // xhrOptions.index = index;

          chunkList.push({
            file: file,
            index: index,
            name: name,
            // formData: formData,
            isRequest: false,
            done: false
            // xhr: this.createXHR(xhrOptions)
          });
          index++;
          startSize += this.chunkSize;
        }

        // hash同步计算
        this.calculateHash(chunkList);

        //文件未上传成功过,
        chunkList.forEach(item => {
          let formData = new FormData();
          formData.append("file", item.file);
          formData.append("index", item.index);
          formData.append("name", item.name);
          formData.append("filename", this.file.name);
          formData.append("fileHash", this.hash);
          item.formData = formData;

          let xhrOptions = this.xhrOptions;
          xhrOptions.formData = formData;
          xhrOptions.index = item.index;
          item.xhr = this.createXHR(xhrOptions);
        });

        this.data = chunkList;
        this.chunkLength = index;

        console.log("切片数据封装数组完成", chunkList, chunkList.length);
        // this.copyData = JSON.parse(JSON.stringify(this.$data));
      }
    },
    // 文件上传
    uploadFile() {
      if (this.file) {
        this.abortAll();

        // 根据hash校验文件是否已经上传
        if (!this.verifyUpload(this.file.name, this.hash)) {
          this.status = "Success";
          this.successCount = this.chunkLength;
          this.percetage = 100;
          //文件秒传
          console.log("文件秒传了。。。");

          this.$emit("fastUpload", null);
          return;
        }

        // Object.assign(this.$data, this.copyData);
        this.data.forEach(item => {
          item.done = false;
        });

        this.percetage = 0;
        this.errorCount = 0;
        this.errorMsg = "";
        this.successCount = 0;
        this.currentRequestCount = 0;
        this.status = "Start";

        for (let index = 0; index < this.data.length; index++) {
          const element = this.data[index];
          if (!element.isRequest) {
            element.xhr.start();
            // 开始上传
            console.log("开始上传文件---");
            this.$emit("uploadStart", this.$data);
            return;
          }
        }
        // this.data.map(item => {
        //   if (!item.isRequest) {
        //     item.xhr.start();
        //     // 开始上传
        //     console.log("开始上传文件---");
        //     this.$emit("uploadStart", this.$data);
        //     return;
        //   }
        // });
      }
    },
    // 停止全部请求
    abortAll() {
      this.data.map(item => {
        if (item.isRequest) {
          item.xhr.abort();
        }
      });
    },
    // 暂停上传
    stopUpload() {
      this.status = "Stop";
      this.abortAll();
      //无断点续传
      if (!this.breakpointUpload) {
        //数据是否重置待验证
        Object.assign(this.$data, this.$options.data());
      }
      this.$emit("uploadStop", this.$data);
    },
    // 校验文件秒传
    async verifyUpload(name, hash) {
      return await new Promise(resolve => {
        console.log("校验文件秒传", name, hash);
        setTimeout(() => {
          resolve(false);
        }, 200);
      });
      //文件秒传接口校验
      // return false;
    },
    // 计算文件md5（web-worker）
    async calculateHash(chunkList) {
      let _this = this;
      return await new Promise(resolve => {
        console.log("worker 发送---");

        _this.worker = new Worker("/hash.js");
        _this.worker.postMessage({ chunkList });
        _this.worker.onmessage = e => {
          const { percentage, hash } = e.data;
          _this.hashPercentage = percentage;
          if (hash) {
            this.hash = hash;
            console.log("接收到hash", hash);

            resolve(hash);
          }
        };
      });
    },
    // 创建xhr对象
    createXHR({ url, method = "POST", formData, headers = null, index }) {
      // return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      if (headers) {
        //headers处理
      }
      // 请求成功回调函数
      xhr.onload = e => {
        console.log("request success", e);
        // this.data[index].isRequest=false
        //默认成功就是成功了，稍后再改
        this.data[index].done = true;
        this.successCount++;
      };
      // 请求结束,包含（成功，出错，超时，终止）
      xhr.onloadend = e => {
        console.log("request loadend", e);
        this.data[index].isRequest = false;
        this.currentRequestCount--;
      };
      // 请求出错
      xhr.onerror = e => {
        console.error("request error", e);
        //this.data[index].isRequest=false
        this.errorCount++;
        this.errorMsg = JSON.stringify(e); //记录出错信息
      };
      // 请求超时
      xhr.ontimeout = e => {
        console.error("request timeout", e);
        //this.data[index].isRequest=false
        this.errorCount++;
      };
      // 请求终止
      xhr.onabort = function() {
        console.log("请求终止");
      };
      // xhr.open(method, url);

      //自定义函数
      xhr.start = () => {
        console.log("formData", formData);

        xhr.open(method, url);
        this.data[index].isRequest = true;
        this.currentRequestCount++;
        xhr.send(formData);
      };
      xhr.onreadystatechange = e => {
        console.log("onreadystatechange", e);
      };
      //终止调用 xtr.abort()

      console.log("xhr对象", xhr);
      return xhr;
      // });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
