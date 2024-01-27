const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const webpack = require("webpack");

require("dotenv").config({ path: ".env" });

module.exports = {
  mode: "development",
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "../../dist"),
    filename: "bundle.js",
    clean: true,
  },
  resolve: {
    extensions: ["", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: "babel-loader",
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name].[ext]",
        },
      },
    ],
  },
  devServer: {
    // host: '192.168.8.146',
    // host: "local-ipv4",
    host: "localhost",
    port: 8080,
    open: true,
    historyApiFallback: true,
    hot: true,
    proxy: {
      "/api": `http://${process.env.HOST}:3000`,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      // favicon: './public/favicon.ico',
    }),
    new MiniCssExtractPlugin({
      filename: "style.css",
    }),
    new webpack.DefinePlugin({
      "process.env.GOOGLE_CLIENT_ID": JSON.stringify(
        process.env.GOOGLE_CLIENT_ID
      ),
      "process.env.HOST": JSON.stringify(process.env.HOST),
    }),
  ],
  devtool: "eval-cheap-source-map",
};
