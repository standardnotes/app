module.exports = function(grunt) {

  grunt.initConfig({

  watch: {
    js: {
      files: ['src/**/*.js'],
      tasks: ['concat:app', 'babel', 'browserify', 'concat:lib', 'concat:dist'],
      options: {
        spawn: false,
      },
    },

    css: {
      files: ['src/**/*.scss'],
      tasks: ['sass', 'concat:css'],
      options: {
        spawn: false,
      },
    }
  },

  sass: {
    dist: {
      options: {
       style: 'expanded',
       sourcemap: 'none'
     },
      files: {
        'dist/app.css': 'src/main.scss'
      }
    }
  },

   babel: {
        app: {
            files: {
                'dist/app.js': ['dist/app.js']
            }
        }
    },

    browserify: {
      dist: {
        files: {
          'dist/app.js': 'dist/app.js'
        }
      }
    },

    concat: {
      options: {
        separator: ';',
      },

      app: {
        src: [
          'src/**/*.js',
        ],
        dest: 'dist/app.js',
      },

      lib: {
        src: [
          'src/upmath/**/*.js',
          "node_modules/draggabilly/dist/draggabilly.pkgd.js",
          "node_modules/markdown-it/dist/markdown-it.min.js",
          "node_modules/markdown-it-sub/dist/markdown-it-sub.min.js",
          "node_modules/markdown-it-sup/dist/markdown-it-sup.min.js",
          "node_modules/markdown-it-footnote/dist/markdown-it-footnote.min.js",
          "node_modules/markdown-it-task-lists/dist/markdown-it-task-lists.min.js",
          "node_modules/katex/dist/katex.min.js",
          "node_modules/sn-components-api/dist/dist.js"
        ],
        dest: 'dist/lib.js',
      },

      dist: {
        src: ['dist/lib.js', 'dist/app.js'],
        dest: 'dist/dist.js',
      },

      css: {
        options: {
          separator: '',
        },
        src: [
          'node_modules/sn-stylekit/dist/stylekit.css',
          'node_modules/katex/dist/katex.min.css',
          'dist/app.css'
        ],
        dest: 'dist/dist.css',
      }
    },

    copy: {
      katexFonts: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/katex/dist/fonts',
            src: ['**'],
            dest: 'dist/fonts/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', [
    'concat:app',
    'babel',
    'browserify',
    'concat:lib',
    'concat:dist',
    'sass',
    'concat:css',
    'copy',
  ]);
};
