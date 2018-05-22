module.exports = function(grunt) {

  grunt.initConfig({

    watch: {
      haml: {
        files: ['app/assets/templates/**/*.haml'],
        tasks: ['newer:haml', 'ngtemplates', 'concat:app', 'babel', 'browserify', 'concat:dist'],
        options: {
          spawn: false,
        },
      },

      js: {
        files: ['app/assets/javascripts/**/*.js'],
        tasks: [ 'concat:app', 'babel', 'browserify', 'concat:dist', 'ngAnnotate'],
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
          'vendor/assets/stylesheets/app.css': 'app/assets/stylesheets/main.css.scss'
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
          module: 'app'
        }
      }
    },

     concat: {
       options: {
         separator: ';',
       },
       app: {
         src: [
           'app/assets/javascripts/app/*.js',
           'app/assets/javascripts/app/controllers/**/*.js',
           'app/assets/javascripts/app/models/**/*.js',
           'app/assets/javascripts/app/services/**/*.js',
           'app/assets/javascripts/app/filters/**/*.js',
           'app/assets/javascripts/app/directives/**/*.js',
         ],
         dest: 'vendor/assets/javascripts/app.js',
       },

       lib: {
         src: [
           'node_modules/standard-file-js/dist/regenerator.js',
           'node_modules/standard-file-js/dist/sfjs.js',
           'vendor/assets/bower_components/angular/angular.js',
           'vendor/assets/javascripts/lodash/lodash.custom.min.js'
         ],
         dest: 'vendor/assets/javascripts/lib.js',
       },

       dist: {
         src: ['vendor/assets/javascripts/lib.js', 'vendor/assets/javascripts/transpiled.js', 'vendor/assets/javascripts/templates.js'],
         dest: 'vendor/assets/javascripts/compiled.js',
       },

       css: {
         options: {
           separator: '',
         },
         src: [
           'vendor/assets/stylesheets/app.css',
           'node_modules/sn-stylekit/dist/stylekit.css'
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

  // grunt.registerTask('default', ['haml', 'ngtemplates', 'sass', 'concat:app',
  // 'concat:lib', 'concat:dist', 'concat:css', 'babel', 'browserify', 'uglify']);

  grunt.registerTask('default', ['haml', 'ngtemplates', 'sass', 'concat:app', 'babel', 'browserify',
  'concat:lib', 'concat:dist', 'ngAnnotate', 'concat:css', 'uglify']);
};
