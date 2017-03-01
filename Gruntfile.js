module.exports = function(grunt) {

  grunt.initConfig({

    watch: {
      haml: {
        files: ['app/assets/templates/**/*.haml'],
        tasks: ['newer:haml', 'ngtemplates', 'concat'],
        options: {
          spawn: false,
        },
      },

      js: {
        files: ['app/assets/javascripts/**/*.js'],
        tasks: [ 'concat:app', 'babel', 'browserify', 'concat:dist'],
        options: {
          spawn: false,
        },
      },

      css: {
        files: ['app/assets/stylesheets/**/*.scss'],
        tasks: ['sass', 'concat:css'],
        options: {
          spawn: false,
        },
      }
    },

    sass: {
      dist: {
        options: {
         style: 'expanded'
       },
        files: {
          'vendor/assets/stylesheets/app.css': 'app/assets/stylesheets/frontend.css.scss'
        }
      }
    },

    haml: {
      dist: {
        expand: true,
        ext: '.html',
        extDot: 'last',
        src: ['app/assets/templates/**/*.haml'],
        dest: 'app/assets/templates/generated/',
        rename: function (dest, src) {
          return dest + src.replace(".html", "");
        }
      },

    },

    ngtemplates:  {
      templates: {
        cwd: 'app/assets/templates/generated/app/assets/templates',
        src: ['**/*.html'],
        dest: 'vendor/assets/javascripts/templates.js',
        options: {
          module: 'app.frontend'
        }
      }
    },

     concat: {
       options: {
         separator: ';',
       },
       app: {
         src: [
           'app/assets/javascripts/app/services/helpers/*.js',
           'app/assets/javascripts/app/*.js',
           'app/assets/javascripts/app/frontend/*.js',
           'app/assets/javascripts/app/frontend/controllers/*.js',
           'app/assets/javascripts/app/frontend/models/**/*.js',
           'app/assets/javascripts/app/services/**/*.js'
         ],
         dest: 'vendor/assets/javascripts/app.js',
       },

       lib: {
         src: [
           'vendor/assets/bower_components/angular/angular.js',
           'vendor/assets/bower_components/angular-ui-router/release/angular-ui-router.js',
           'vendor/assets/bower_components/lodash/dist/lodash.min.js',
           'vendor/assets/bower_components/restangular/dist/restangular.js',
           'vendor/assets/javascripts/crypto/*.js'
         ],
         dest: 'vendor/assets/javascripts/lib.js',
       },

       dist: {
         src: ['vendor/assets/javascripts/lib.js', 'vendor/assets/javascripts/transpiled.js', 'vendor/assets/javascripts/templates.js'],
         dest: 'vendor/assets/javascripts/compiled.js',
       },

       css: {
         src: [
           'vendor/assets/stylesheets/app.css'
         ],
         dest: 'vendor/assets/stylesheets/app.css'
       }
     },

     babel: {
          options: {
              sourceMap: true,
              presets: ['es2016']
          },
          dist: {
              files: {
                  'vendor/assets/javascripts/transpiled.js': 'vendor/assets/javascripts/app.js'
              }
          }
      },

      browserify: {
        dist: {
          files: {
            'vendor/assets/javascripts/transpiled.js': 'vendor/assets/javascripts/transpiled.js'
          },
          options: {
          }
        }
      },

     ngAnnotate: {
       options: {
          singleQuotes: true,
        },

        neeto: {
          files: {
            'vendor/assets/javascripts/compiled.js': 'vendor/assets/javascripts/compiled.js',
          },
        }
      },

     uglify: {
       compiled: {
         src: ['vendor/assets/javascripts/compiled.js'],
         dest: 'vendor/assets/javascripts/compiled.min.js'
       }
    },

  });

  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-haml2html');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['haml', 'ngtemplates', 'sass', 'concat:app', 'babel', 'browserify',
  'concat:lib', 'concat:dist', 'ngAnnotate', 'concat:css', 'uglify']);
};
