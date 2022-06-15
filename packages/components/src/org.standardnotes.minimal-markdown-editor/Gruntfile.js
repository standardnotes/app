const path = require('path')

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
        src: ['src/**/*.js'],
        dest: 'dist/app.js',
      },

      lib: {
        src: [
          require.resolve('codemirror/lib/codemirror.js'),
          require.resolve('@standardnotes/component-relay/dist/dist.js'),
          'vendor/modes/markdown/markdown.js',
          'vendor/addon/modes/overlay.js',
          'vendor/modes/gfm/gfm.js',
          'vendor/mark-selection.js',
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
          require.resolve('codemirror/lib/codemirror.css'),
          require.resolve('sn-stylekit/dist/stylekit.css'),
          'dist/app.css',
        ],
        dest: 'dist/dist.css',
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: path.dirname(require.resolve('sn-codemirror-search')),
            src: ['**', '!package.json'],
            dest: 'dist/sn-codemirror-search',
          },
        ],
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

  grunt.registerTask('default', [
    'concat:app',
    'babel',
    'browserify',
    'concat:lib',
    'concat:dist',
    'sass',
    'concat:css',
    'copy',
  ])
}
