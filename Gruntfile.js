module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // Configure a mochaTest task
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false // Optionally suppress output to standard out (defaults to false)
                },
                src: ['test/**/*.js']
            }
        }
    });

    // Add the grunt-mocha-test tasks.
    grunt.loadNpmTasks('grunt-mocha-test');
    // Default task(s).
    grunt.registerTask('default', ['mochaTest']);
};