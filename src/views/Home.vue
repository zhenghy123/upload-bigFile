<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png" /> -->
    <input type="file" @change="fileChange" />
    <BigFileUpload :file="file" msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import BigFileUpload from "@/components/BigFileUpload.vue";

export default {
  name: "home",
  components: {
    BigFileUpload
  },
  data() {
    return {
      file: null
    };
  },
  methods: {
    fileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      console.log("file", file);

      this.file = file;
    }
  }
};
</script>
