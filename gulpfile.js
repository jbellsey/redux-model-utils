
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
    // used just to peek at a single file's compiled output
    runOne: {
        inputFiles:   './spec/waitable.js',
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

// build the main code base (as a bundle for testing, not for distribution)
gulp.task('browserify-codebundle', () => browserifier('code'));

// build the spec files
gulp.task('browserify-tests',      () => browserifier('test'));

// for internal testing only
gulp.task('browserify-runone',     () => browserifier('runOne'));

// this runs the test suite
gulp.task('spec', ['browserify-codebundle', 'browserify-tests'], () => {

    var jasmine = require('gulp-jasmine'),
        testFiles = './dist/spec.js',
        opts = {
            verbose: true,
            includeStackTrace: true
        };

    return gulp.src(testFiles)
        .pipe(jasmine(opts));
});

// build the files in the dist folder for distribution
gulp.task('build', () => {
    var babel = require('gulp-babel');
    return gulp.src('src/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));
});