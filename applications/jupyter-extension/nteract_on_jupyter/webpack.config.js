// @flow
const configurator = require("@nteract/webpack-configurator");

const webpack = require("webpack");
const path = require("path");

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

module.exports = {
  mode: isProd ? "production" : "development",
  entry: "./app/index.js",
  target: "web",
  output: {
    path: path.join(__dirname, "lib"),
    filename: "[name].js"
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          enforce: true,
          chunks: "all"
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: configurator.exclude,
        loader: "babel-loader"
      }
    ]
  },
  resolve: {
    mainFields: ["nteractDesktop", "module", "main"],
    extensions: [".js", ".jsx"],
    alias: configurator.mergeDefaultAliases()
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    new webpack.IgnorePlugin(/\.(css|less)$/)
  ]
};
