module.exports = function(grunt) {

  grunt.initConfig({

    watch: {
      haml: {
        files: ['app/assets/templates/**/*.haml'],
        tasks: ['newer:haml', 'ngtemplates', 'concat:app', 'babel', 'browserify', 'concat:dist', 'clean'],
        options: {
          spawn: false,
        },
      },

      js: {
        files: ['app/assets/javascripts/**/*.js'],
        tasks: [ 'concat:app', 'babel', 'browserify', 'concat:dist', 'clean'],
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
          'dist/stylesheets/app.css': 'app/assets/stylesheets/main.css.scss'
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
        dest: 'dist/javascripts/templates.js',
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
           'node_modules/snjs/dist/snjs.js',
           'app/assets/javascripts/app/*.js',
           'app/assets/javascripts/app/models/**/*.js',
           'app/assets/javascripts/app/controllers/**/*.js',
           'app/assets/javascripts/app/services/**/*.js',
           'app/assets/javascripts/app/filters/**/*.js',
           'app/assets/javascripts/app/directives/**/*.js',
         ],
         dest: 'dist/javascripts/app.js',
       },

       lib: {
         src: [
           'node_modules/standard-file-js/dist/regenerator.js',
           'node_modules/standard-file-js/dist/sfjs.js',
           'node_modules/angular/angular.js',
           'vendor/assets/javascripts/angular-sanitize.js',
           'vendor/assets/javascripts/lodash/lodash.custom.min.js'
         ],
         dest: 'dist/javascripts/lib.js',
       },

       dist: {
         src: ['dist/javascripts/lib.js', 'dist/javascripts/transpiled.js', 'dist/javascripts/templates.js'],
         dest: 'dist/javascripts/compiled.js',
       },

       css: {
         options: {
           separator: '',
         },
         src: [
           'dist/stylesheets/app.css',
           'node_modules/sn-stylekit/dist/stylekit.css'
         ],
         dest: 'dist/stylesheets/app.css'
       }
     },

     babel: {
          options: {
              sourceMap: true
          },
          dist: {
              files: {
                  'dist/javascripts/transpiled.js': 'dist/javascripts/app.js'
              }
          }
      },

      browserify: {
        dist: {
          files: {
            'dist/javascripts/transpiled.js': 'dist/javascripts/transpiled.js'
          },
          options: {
          }
        }
      },

     uglify: {
       compiled: {
         src: ['dist/javascripts/compiled.js'],
         dest: 'dist/javascripts/compiled.min.js'
       }
    },

    ngconstant: {
       options: {
         name: 'app',
         dest: 'app/assets/javascripts/app/constants.js',
         deps: false,
         constants: {
           appVersion: grunt.file.readJSON('package.json').version
         }
       },
       build: {
       }
     },

     clean: [
       'dist/javascripts/app.js',
       'dist/javascripts/lib.js',
       'dist/javascripts/templates.js',
       'dist/javascripts/transpiled.js',
       'dist/javascripts/transpiled.js.map',
     ]
  });

  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-haml2html');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-ng-constant');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['haml', 'ngtemplates', 'sass', 'concat:app', 'babel', 'browserify',
  'concat:lib', 'concat:dist', 'concat:css', 'uglify', 'ngconstant:build', 'clean']);

  grunt.registerTask('vendor', ['concat:app', 'sass', 'babel', 'browserify',
  'concat:lib', 'concat:dist', 'concat:css', 'uglify']);

  grunt.registerTask('constants', ['ngconstant:build'])
};
