require('@babel/register')({
  only: ['can'],
  extensions: ['.js'],
  cache: true,
  presets: ['@babel/env'],
  plugins: [
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-class-properties',
  ],
});

module.exports = require('./can');
