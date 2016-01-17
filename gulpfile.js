
var gulp = require('gulp');

var packages = {
    code: {
        inputFiles:   './src/index.js',
        outputFolder: './dist/',
        outputFile:   'index.js'
    },
    test: {
        inputFiles:   './spec/_index.js',
        outputFolder: './dist/',
        outputFile:   'spec.js'
    },
    runOne: {
        inputFiles:   './spec/model.js',
        outputFolder: './spec/',
        outputFile:   'model-es5.js'
    }
};

var browserifier = pkg => {

    var source      = require('vinyl-source-stream'),
        streamify   = require('gulp-streamify'),
        babel       = require('gulp-babel'),
        browserify  = require('browserify'),

        // without this, the "clone" lib triggers an import of the "buffer" library (http://bit.ly/1OToi8K)
        opts        = {noParse: ['clone']},

        inputFiles  = packages[pkg].inputFiles,
        outputFolder= packages[pkg].outputFolder,
        outputFile  = packages[pkg].outputFile;

    return browserify(inputFiles, opts)
        .bundle()
        .pipe(source(outputFile))
        .pipe(streamify(babel({compact: false})))
        .pipe(gulp.dest(outputFolder))
};

gulp.task('browserify-runone', () => browserifier('runOne'));
gulp.task('browserify-tests', () => browserifier('test'));
gulp.task('browserify', () => browserifier('code'));
gulp.task('default', () => browserifier('code'));

gulp.task('spec', ['browserify-tests'], () => {

    var jasmine = require('gulp-jasmine'),
        testFiles = './dist/spec.js',
        opts = {
            verbose: true,
            includeStackTrace: true
        };

    return gulp.src(testFiles)
        .pipe(jasmine(opts));
});