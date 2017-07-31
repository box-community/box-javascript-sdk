var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var path = require('path');
var env = require('yargs').argv.mode;

var libraryName = 'BoxSdk';

var plugins = [], outputFile;

outputFile = libraryName + '.min.js';
plugins.push(new UglifyJsPlugin({
  sourceMap: true,
  uglifyOptions: {
    compress: { warnings: false },
    ecma: 5
  }
}));

var config = {
  entry: __dirname + '/src/sdk.js',
  devtool: '#source-map',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    sourceMapFilename: libraryName + '.map'
  },
  externals: {
    "whatwg-fetch": "fetch",
    "Promise": "Promise"
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        test: /(\.jsx|\.js)$/,
        exclude: /node_modules/,
        use: {
          loader: "eslint-loader"
        }
      }
    ]
  },
  resolve: {
    modules: [__dirname, 'node_modules'],
    extensions: ['.js']
  },
  plugins: plugins
};

module.exports = config;
