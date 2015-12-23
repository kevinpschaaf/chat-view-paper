var gulp = require('gulp'),
  connect = require('gulp-connect'),
  less = require('gulp-less');
 
gulp.task('server', function() {
  connect.server({
    livereload: true
  });
});
 
gulp.task('less', function() {
  gulp.src('styles/main.less')
    .pipe(less())
    .pipe(gulp.dest('styles'))
    .pipe(connect.reload());
});
 
gulp.task('watch', function() {
    gulp.watch('styles/*.less', ['less']);
})
 
gulp.task('default', ['less', 'server', 'watch']);
