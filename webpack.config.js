'use strict';

const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    'entry': './src/index.js',
    'output': {
        'filename': 'free.min.js',
        'path': path.resolve(__dirname, 'dist')
    },
    'module': {
        'noParse': /jquery/,
        'rules': [
            {
                'test': /\.css$/,
                'use': ['style-loader', 'css-loader']
            }
        ]
    },
    'plugins': [
        new UglifyJSPlugin()
    ],
    // 'devServer': {
    //     'contentBase': path.join(__dirname, "dist"),
    //     'compress': true,
    //     'port': 9000,
    //     'disableHostCheck': true
    // }
};
