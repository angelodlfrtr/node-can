module.exports = function(api) {
  api.cache(true);

  const presets = [
    '@babel/env',
  ];

  const plugins = [
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ];

  return {
    presets,
    plugins
  };
};
