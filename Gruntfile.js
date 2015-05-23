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
    watch :{
      scripts :{
        files : ['js/*.js', 'css/*.css'],
        tasks: ['browserify:shellfie'],
        options : {
          livereload : 9090
        }
      }
    },
    browserify: {
      shellfie: {
        src: 'js/shellfie.js',
        dest: 'dist/shellfie.bundle.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['browserify']);
  grunt.registerTask('server', [
    'connect:livereload',
    'watch'
  ]);

};
