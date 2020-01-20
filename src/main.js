import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;

import "element-ui/lib/theme-chalk/index.css"; //导入样式
import ElementUI from "element-ui";
Vue.use(ElementUI, { size: "mini" });

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
