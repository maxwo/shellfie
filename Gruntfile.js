module.exports = function(grunt) {

  grunt.initConfig({
    connect: {
      options: {
        port: 9000,
        hostname: '*',
        livereload: 9090
      },
      livereload: {
        options: {
          open: true,
          base: '.'
        }
      }
    },
    watch: {
      scripts: {
        files: [
          'js/*.js', 'css/*.css'
        ],
        tasks: ['browserify:shellfie'],
        options: {
          livereload: 9090
        }
      }
    },
    browserify: {
      shellfie: {
        src: 'js/shellfie.js',
        dest: 'dist/shellfie.bundle.js'
      }
    },
    copy: {
      html: {
        expand: true,
        src: '*',
        cwd: 'html',
        dest: 'dist'
      },
      styles: {
        expand: true,
        src: 'css/**',
        dest: 'dist'
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      main: {
        files: {
          'dist/shellfie.min.js': ['dist/shellfie.bundle.js']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['browserify', 'copy', 'uglify']);
  grunt.registerTask('server', ['connect:livereload', 'watch']);

};
