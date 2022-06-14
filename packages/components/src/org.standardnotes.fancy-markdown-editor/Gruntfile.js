module.exports = function (grunt) {
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
        files: ['src/main.scss'],
        tasks: ['sass', 'concat:css'],
        options: {
          spawn: false,
        },
      },
    },

    sass: {
      dist: {
        options: {
          style: 'expanded',
          sourceMap: false,
        },
        files: {
          'dist/app.css': 'src/main.scss',
        },
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env'],
      },
      app: {
        files: {
          'dist/app.js': ['dist/app.js'],
        },
      },
    },

    browserify: {
      dist: {
        files: {
          'dist/app.js': 'dist/app.js',
        },
      },
    },

    concat: {
      options: {
        separator: ';',
      },

      app: {
        src: ['src/main.js'],
        dest: 'dist/app.js',
      },

      lib: {
        src: [
          'vendor/upmath/**/*.js',
          require.resolve('draggabilly/dist/draggabilly.pkgd.min.js'),
          require.resolve('markdown-it/dist/markdown-it.js'),
          require.resolve('markdown-it-sub/dist/markdown-it-sub.min.js'),
          require.resolve('markdown-it-sup/dist/markdown-it-sup.min.js'),
          require.resolve('markdown-it-footnote/dist/markdown-it-footnote.min.js'),
          require.resolve('markdown-it-task-lists/dist/markdown-it-task-lists.min.js'),
          'node_modules/katex/dist/katex.min.js',
          require.resolve('@standardnotes/component-relay/dist/dist.js'),
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
          require.resolve('sn-stylekit/dist/stylekit.css'),
          'node_modules/katex/dist/katex.min.css',
          'dist/app.css',
        ],
        dest: 'dist/dist.css',
      },
    },

    copy: {
      katexFonts: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/katex/dist/fonts',
            src: ['**'],
            dest: 'dist/fonts/',
          },
        ],
      },
    },

    remove_comments: {
      app: {
        src: 'dist/app.js',
        dest: 'dist/app.js',
      },

      lib: {
        src: 'dist/lib.js',
        dest: 'dist/lib.js',
      },
    },

    uglify: {
      dist: {
        files: {
          'dist/dist.js': 'dist/dist.js',
        },
      },
    },
  })

  grunt.loadNpmTasks('grunt-newer')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-babel')
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-sass')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-remove-comments')
  grunt.loadNpmTasks('grunt-contrib-uglify')

  grunt.registerTask('default', [
    'concat:app',
    'babel',
    'browserify',
    'concat:lib',
    'remove_comments',
    'concat:dist',
    'sass',
    'concat:css',
    'copy',
    'uglify',
  ])
}
