module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

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

        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: ['dist/*', 'package/*.zip']
                    }
                ]
            },
        },

        copy: {
            dist: {
                files: [
                    {
                        cwd: '.',
                        dot: false,
                        dest: 'dist/',
                        src: [
                            "src/manifest.json",
                            "src/scripts/*",
                            "src/styles/*",
                            "src/assets/*",
                            "src/views/*",
                            "src/bower_components/bootstrap/dist/css/bootstrap.min.css",
                            "src/bower_components/bootstrap/dist/js/bootstrap.min.js",
                            "src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.eot",
                            "src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.svg",
                            "src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf",
                            "src/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff",
                            "src/bower_components/bootstrap/dist/js/bootstrap.min.css",
                            "src/bower_components/jquery/jquery.min.js",
                            'src/bower_components/angular/angular.min.js'
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
        'build:dist',
    ]);

    grunt.registerTask('build:dist', [
        'clean:dist',
        'copy:dist',
        'compress:dist'
    ]);
}
