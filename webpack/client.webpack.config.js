const withDefaults = require('./shared.webpack.config');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = withDefaults({
  context: path.join(__dirname, '../packages/extension'),
  entry: {
    extensionMain: './src/extensionMain.ts'
  },
  optimization: {
    splitChunks: {
      minSize: 0,
      cacheGroups: {
        'vscode-dependencies': {
          test: /node_modules\/(vscode|semver)/,
          chunks: 'all',
          name: 'vscode-dependencies'
        }
      }
    }
  },
  externals: {
    vscode: 'commonjs vscode',
    bufferutil: 'commonjs bufferutil',
    'utf-8-validate': 'commonjs utf-8-validate'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../dist', 'packages/extension/dist')
  }
  // plugins: [new BundleAnalyzerPlugin()],
});
