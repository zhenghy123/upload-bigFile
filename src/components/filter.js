// 计算混入，减少单个文件量
export const filter = {
  filters: {
    bytesToSize(bytes) {
      if (!bytes || bytes === 0) {
        return "-";
      }
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      let i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toPrecision(4) + " " + sizes[i];
    }
  }
};
