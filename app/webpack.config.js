/**
 * Created by Merlini on 2017/3/18.
 */
const path = require('path');

module.exports = {
    entry: {
        index: './src/js/index.js',
        color: './src/js/color.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'src/dist')
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [['es2015', {modules: false}]],
                    plugins: ['syntax-dynamic-import']
                }
            }]
        }]
    }
};