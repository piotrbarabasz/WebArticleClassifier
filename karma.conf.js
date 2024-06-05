module.exports = function (config) {
  config.set({
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' },
      ],
    },
  });
};
