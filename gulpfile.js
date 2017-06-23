'use strict';

const gulp = require('gulp'),
	concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
	clean = require('gulp-clean'),
	gulpif = require('gulp-if'),
    cssmin = require('gulp-clean-css'),
    sass = require('gulp-sass');

const JS_FILE_NAME = 'free.min.js', CSS_FILE_NAME = 'free.min.css';

gulp.task('all', ['clean'], () => {
    // js
    gulp.src('./src/**/*.js')
        .pipe(concat(JS_FILE_NAME))
        .pipe(uglify({mangle: true, compress: true}).on('error', console.log))
        .pipe(gulp.dest('./dist'));
    // css
    gulp.src('./src/**/*.css')
		.pipe(concat(CSS_FILE_NAME))
		.pipe(cssmin())
		.pipe(gulp.dest('./dist'));
});

gulp.task('clean', () => {
    return gulp.src('./dist', {read: false}).pipe(clean());
});

gulp.task('default', ['all'], () => {
    console.log('job done');
});
