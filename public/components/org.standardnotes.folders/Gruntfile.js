module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      js: {
        files: ["./app/js/**/*.js"],
        tasks: [
          "concat:app",
          "babel",
          "browserify",
          "concat:lib",
          "concat:dist",
          "ngAnnotate",
          "uglify",
        ],
        options: {
          spawn: false,
        },
      },

      haml: {
        files: ["./app/templates/**/*.haml"],
        tasks: [
          "haml",
          "ngtemplates",
          "concat:app",
          "babel",
          "browserify",
          "concat:lib",
          "concat:dist",
          "ngAnnotate",
          "uglify",
        ],
        options: {
          spawn: false,
        },
      },

      css: {
        files: ["./app/style/**/*.scss"],
        tasks: ["sass", "concat:css"],
        options: {
          spawn: false,
        },
      },
    },

    sass: {
      dist: {
        options: {
          style: "expanded",
        },
        files: {
          "dist/app.css": "./app/style/index.scss",
        },
      },
    },

    haml: {
      dist: {
        expand: true,
        ext: ".html",
        extDot: "last",
        src: ["app/templates/**/*.haml"],
        dest: "app/templates/generated/",
        rename: function (dest, src) {
          return dest + src.replace(".html", "");
        },
      },
    },

    concat: {
      options: {
        separator: ";",
      },

      app: {
        src: ["node_modules/sn-models/dist/sn-models.js", "app/js/**/*.js"],
        dest: "dist/app.js",
      },

      lib: {
        src: [
          "node_modules/standard-file-js/dist/regenerator.js",
          "node_modules/standard-file-js/dist/sfjs.js",
          "node_modules/standard-file-js/vendor/lodash/lodash.custom.min.js",
          "node_modules/angular/angular.js",
        ],
        dest: "dist/lib.js",
      },

      "component-relay": {
        src: ["node_modules/@standardnotes/component-relay/dist/dist.js"],
        dest: "dist/component-relay.js",
      },

      dist: {
        src: ["dist/lib.js", "dist/app.js", "dist/templates.js"],
        dest: "dist/compiled.js",
      },

      css: {
        options: {
          separator: "",
        },
        src: ["dist/app.css", "node_modules/sn-stylekit/dist/stylekit.css"],
        dest: "dist/app.css",
      },
    },

    ngtemplates: {
      templates: {
        cwd: "app/templates/generated/app/templates",
        src: ["**/*.html"],
        dest: "dist/templates.js",
        options: {
          module: "app",
        },
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ["es2016"],
        sourceType: "module",
      },
      dist: {
        files: {
          "dist/app.js": "dist/app.js",
        },
      },
    },

    browserify: {
      dist: {
        files: {
          "dist/app.js": "dist/app.js",
        },
      },
    },

    ngAnnotate: {
      options: {
        singleQuotes: true,
      },

      app: {
        files: {
          "dist/compiled.js": "dist/compiled.js",
        },
      },
    },

    uglify: {
      compiled: {
        src: ["dist/compiled.js"],
        dest: "dist/compiled.min.js",
      },
    },
  });

  grunt.loadNpmTasks("grunt-newer");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-haml2html");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-ng-annotate");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-angular-templates");

  grunt.registerTask("default", [
    "haml",
    "sass",
    "ngtemplates",
    "concat:app",
    "babel",
    "browserify",
    "concat:lib",
    "concat:dist",
    "concat:css",
    "concat:component-relay",
    "ngAnnotate",
    "uglify",
  ]);
};
