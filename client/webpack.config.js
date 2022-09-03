const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[ext]',
        },
      },
    ],
  },
  devServer: {
    port: 8080,
    open: true,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // favicon: './public/favicon.ico',
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
  ],
  devtool: 'eval-cheap-source-map',
};
