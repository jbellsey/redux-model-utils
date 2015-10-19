
var gulp = require('gulp');

var browserifier = function() {

    var source      = require('vinyl-source-stream'),
        streamify   = require('gulp-streamify'),
        babel       = require('gulp-babel'),
        browserify  = require('browserify'),

        inputFiles  = './src/index.js',
        outputFolder= './dist/',
        outputFile  = 'index.js';

    return browserify(inputFiles)
        .bundle()
        .pipe(source(outputFile))
        .pipe(streamify(babel({compact: false})))
        .pipe(gulp.dest(outputFolder))

};

gulp.task('default', () => browserifier());
