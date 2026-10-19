module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // Inlines Drizzle's .sql migration files into the bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
