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
        tasks: ['concat'],
        options: {
          spawn: false,
        },
      },

      css: {
        files: ['app/assets/stylesheets/**/*.scss'],
        tasks: ['sass', 'concat'],
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
           'app/assets/javascripts/app/*.js',
           'app/assets/javascripts/app/frontend/*.js',
           'app/assets/javascripts/app/frontend/controllers/*.js',
           'app/assets/javascripts/app/frontend/models/*.js',
           'app/assets/javascripts/app/services/*.js',
           'app/assets/javascripts/app/services/directives/*.js',
           'app/assets/javascripts/app/services/helpers/*.js',
         ],
         dest: 'vendor/assets/javascripts/app.js',
       },

       lib: {
         src: [
           'vendor/assets/bower_components/angular/angular.js',
           'vendor/assets/bower_components/angular-ui-router/release/angular-ui-router.js',
           'vendor/assets/bower_components/ng-token-auth/dist/ng-token-auth.js',
           'vendor/assets/bower_components/angular-cookie/angular-cookie.js',
           'vendor/assets/bower_components/lodash/dist/lodash.js',
           'vendor/assets/bower_components/restangular/dist/restangular.js',
           'vendor/assets/bower_components/marked/lib/marked.js',
           'vendor/assets/bower_components/oclazyload/dist/ocLazyLoad.js',
           'vendor/assets/bower_components/angular-lazy-img/release/angular-lazy-img.js',
           'vendor/assets/bower_components/ng-dialog/js/ngDialog.min.js',
           'vendor/assets/javascripts/crypto/*.js'
         ],
         dest: 'vendor/assets/javascripts/lib.js',
       },

       dist: {
         src: ['vendor/assets/javascripts/lib.js', 'vendor/assets/javascripts/app.js', 'vendor/assets/javascripts/templates.js'],
         dest: 'vendor/assets/javascripts/compiled.js',
       },

       css: {
         src: [
           'vendor/assets/stylesheets/app.css',
           'vendor/assets/bower_components/ng-dialog/css/ngDialog.css',
           'vendor/assets/bower_components/ng-dialog/css/ngDialog-theme-default.css',
           'vendor/assets/bower_components/angular-typewrite/dist/angular-typewrite.css',
         ],
         dest: 'vendor/assets/stylesheets/app.css'
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

  grunt.registerTask('default', ['haml', 'ngtemplates', 'sass', 'concat', 'ngAnnotate', 'uglify']);
};
