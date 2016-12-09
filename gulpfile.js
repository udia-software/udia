let gulp = require("gulp");
let ts = require("gulp-typescript");
let del = require("del");

let ngPaths = {
  corejs: ["node_modules/core-js/client/shim.min.js", "node_modules/core-js/client/shim.min.js.map"],
  zonejs: ["node_modules/zone.js/dist/zone.js"],
  systemjs: ["node_modules/systemjs/dist/system.src.js"],
  rxjs: ["node_modules/rxjs/**/*"],
  reflectMetadata: ["node_modules/reflect-metadata/Reflect.js", "node_modules/reflect-metadata/Reflect.js.map"],
  angular: ["node_modules/@angular/**/*"]
};

gulp.task("client:index", function () {
  return gulp.src("src/client/index.html")
    .pipe(gulp.dest("dist/client"));
});

gulp.task("client:systemjsConfig", function() {
  return gulp.src("src/client/systemjs.config.js")
    .pipe(gulp.dest("dist/client"));
});

gulp.task("client:corejs", function () {
  return gulp.src(ngPaths.corejs)
    .pipe(gulp.dest("dist/client/ngdeps/corejs"));
});

gulp.task("client:zonejs", function () {
  return gulp.src(ngPaths.zonejs)
    .pipe(gulp.dest("dist/client/ngdeps/zonejs"));
});

gulp.task("client:systemjs", function () {
  return gulp.src(ngPaths.systemjs)
    .pipe(gulp.dest("dist/client/ngdeps/systemjs"));
});

gulp.task("client:rxjs", function () {
  return gulp.src(ngPaths.rxjs)
    .pipe(gulp.dest("dist/client/ngdeps/rxjs"));
});

gulp.task("client:reflectMetadata", function() {
  return gulp.src(ngPaths.reflectMetadata)
    .pipe(gulp.dest("dist/client/ngdeps/reflectmetadata"));
});

gulp.task("client:angular", function () {
  return gulp.src(ngPaths.angular)
    .pipe(gulp.dest("dist/client/ngdeps/@angular"));
});

let tsProject = ts.createProject("tsconfig.json");

gulp.task("typescript", function () {
  return gulp.src("src/**/*.ts")
    .pipe(tsProject())
    .pipe(gulp.dest("dist"));
});

gulp.task("clean", function() {
  return del(["dist"])
});

gulp.task("default",
  [
    // Client files
    "client:index", "client:systemjsConfig",
    // Angular Dependencies on Client
    "client:corejs", "client:zonejs", "client:systemjs", "client:rxjs", "client:reflectMetadata", "client:angular",
    // All typescript compilation
    "typescript"
  ]
);