'use strict';

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    autoWatch : true,
    files : [
      'src/bower_components/angular/angular.js',
      'src/bower_components/angular-mocks/angular-mocks.js',
      'src/scripts/**/*.js',
      'test/**/*.js'
    ],
    exclude: [
      'src/scripts/background.js'
    ]
  });
};
