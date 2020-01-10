/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require('path');
const merge = require('merge-options');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = function withDefaults(/** @type WebpackConfig */ extConfig) {
  /** @type WebpackConfig */
  let defaultConfig = {
    mode: 'production',
    target: 'node',
    node: {
      __dirname: false
    },
    resolve: {
      mainFields: ['module', 'main'],
      extensions: ['.ts', '.js']
    },
    // optimization: {
    // minimize: false
    // },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  sourceMap: true
                }
              }
            }
          ]
        }
      ]
    },
    output: {
      filename: '[name].js',
      path: path.join(extConfig.context, 'dist'),
      libraryTarget: 'commonjs'
    },
    devtool: 'source-map'
    // plugins: [new BundleAnalyzerPlugin()],
  };

  return merge(defaultConfig, extConfig);
};
