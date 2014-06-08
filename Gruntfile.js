'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    compress: {
      dist: {
        options: {
          archive: 'package/<%= pkg.name %>_<%= pkg.version %>.zip'
        },
        files: [
          {
            expand: true,
            cwd: 'dist/src/',
            src: ['**'],
            dest: ''
          }
        ]
      }
    },

    watch: {
      js: {
        files: ['Gruntfile.js', 'src/scripts/{,*/}*.js'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      views: {
        files: ['src/index.html', 'src/views/{,*/}*.html'],
        options: {
          livereload: true
        }
      },
      styles: {
        files: ['src/styles/{,*/}*.css'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'src/views/**/*.html',
          'src/assets/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          'src/manifest.json'
        ]
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'karma.conf.js',
        'src/scripts/**/*.js',
        'test/**/*.js'
      ]
    },

    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        hostname: 'localhost',
        open: true
      },
      chrome: {
        options: {
          base: ['src']
        }
      }
    },

    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: ['dist/*', 'package/*.zip']
          }
        ]
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      }
    },

    copy: {
      dist: {
        files: [
          {
            cwd: '.',
            dot: false,
            dest: 'dist/',
            src: [
              'src/manifest.json',
              'src/index.html',
              'src/scripts/*',
              'src/styles/*',
              'src/assets/*',
              'src/views/*',
              'src/bower_components/bootstrap/dist/css/bootstrap.min.css',
              'src/bower_components/bootstrap/dist/js/bootstrap.min.js',
              'src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.eot',
              'src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.svg',
              'src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf',
              'src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
              'src/bower_components/bootstrap/dist/js/bootstrap.min.css',
              'src/bower_components/jquery/dist/jquery.min.js',
              'src/bower_components/angular/angular.min.js',
              'src/bower_components/angular-route/angular-route.min.js',
              'src/bower_components/angular-sanitize/angular-sanitize.min.js',
              'src/bower_components/jqplot/jquery.jqplot.min.css',
              'src/bower_components/jqplot/jquery.jqplot.min.js',
              'src/bower_components/jqplot/plugins/jqplot.canvasTextRenderer.min.js',
              'src/bower_components/jqplot/plugins/jqplot.canvasAxisLabelRenderer.min.js'
            ]
          }
        ]
      }
    }
  });

  grunt.registerTask('default', [
    'build'
  ]);

  grunt.registerTask('build', [
    'build:dist'
  ]);

  grunt.registerTask('debug', function (platform) {
    var watch = grunt.config('watch');
    platform = platform || 'chrome';

    // Configure updated watch task
    grunt.config('watch', watch);
    grunt.task.run(['connect:' + platform, 'watch']);
  });

  grunt.registerTask('build:dist', [
    'clean:dist',
    'copy:dist',
    'compress:dist'
  ]);

  grunt.registerTask('test', [
    'jshint',
    'karma'
  ]);
};
