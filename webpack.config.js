const path = require("path");

module.exports = {
  entry: "./index.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"), // Thêm đường dẫn output để đảm bảo Webpack biết nơi xuất file
  },
  resolve: {
    extensions: [".ts", ".js"], // Sử dụng dấu chấm trước các phần mở rộng
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/, // Loại trừ node_modules để tăng tốc quá trình build
      },
    ],
  },
};
