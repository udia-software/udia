/**
 * Created by alexander on 2016-12-09.
 */
let gulp = require("gulp");
let nodemon = require("gulp-nodemon");
let tslint = require("gulp-tslint");
let ts = require("gulp-typescript");
let watch = require("gulp-watch");
let del = require("del");

/*
 --- Client files that the application developer controls directly ---
 */

gulp.task("client:html", function () {
  return gulp.src("src/client/**/*.html")
    .pipe(gulp.dest("dist/client"));
});

gulp.task("client:css", function () {
  return gulp.src("src/client/**/*.css")
    .pipe(gulp.dest("dist/client"));
});

gulp.task("client:ico", function () {
  return gulp.src("src/client/favicon.ico")
    .pipe(gulp.dest("dist/client"));
});

/*
 --- Client files that the application developer does not control directly --
 */

// Relative paths for all angular 2 client dependencies from the repository source, after npm install
let ngPaths = {
  corejs: ["node_modules/core-js/client/shim.min.js", "node_modules/core-js/client/shim.min.js.map"],
  zonejs: ["node_modules/zone.js/dist/zone.js"],
  systemjs: ["node_modules/systemjs/dist/system.src.js"],
  rxjs: ["node_modules/rxjs/**/*"],
  reflectMetadata: ["node_modules/reflect-metadata/Reflect.js", "node_modules/reflect-metadata/Reflect.js.map"],
  angular: ["node_modules/@angular/**/*"],
  jquery: ["node_modules/jquery/dist/jquery.min.js", "node_modules/jquery/dist/jquery.min.map"],
};

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

gulp.task("client:reflectMetadata", function () {
  return gulp.src(ngPaths.reflectMetadata)
    .pipe(gulp.dest("dist/client/ngdeps/reflectmetadata"));
});

gulp.task("client:angular", function () {
  return gulp.src(ngPaths.angular)
    .pipe(gulp.dest("dist/client/ngdeps/@angular"));
});

gulp.task("client:jquery", function () {
  return gulp.src(ngPaths.jquery)
    .pipe(gulp.dest("dist/client/jquery"))
});

/*
 --- TypeScript Build Step. Compile all client and server typescript files to the `dist` directory ---
 */

let tsProject = ts.createProject("tsconfig.json");

gulp.task("typescript", function () {
  return gulp.src("src/**/*.ts")
    .pipe(tsProject())
    .pipe(gulp.dest("dist"))
});

/*
 --- Clean by deleting the `dist` directory and all *.js and *.map files in `src` and `test` ---
 */

gulp.task("clean", ["clean:dist", "clean:dev"]);

gulp.task("clean:dist", function () {
  return del(["dist"]);
});

gulp.task("clean:dev", function () {
  return del.sync([
    "src/**/*.js", "src/**/*.map", "!src",
    "test/**/*.js", "test/**/*.map", "!test"
  ]);
});

/*
 --- TypeScript Linter
 */
gulp.task("tslint", () => {
  return gulp.src("src/**/*.ts")
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report())
});

gulp.task("watch", () => {
  watch(["src/client/**/*.html"], function () {
    gulp.run(["client:html"]);
  });
  watch(["src/client/**/*.css"], function () {
    gulp.run(["client:css"]);
  });
  watch(["src/**/*.ts"], function () {
    gulp.run(["typescript"]);
  })
});

gulp.task("serve", () => {
  return nodemon({
    "script": "./bin/www",
    "ignore": [
      ".git",
      "node_modules"
    ],
    "ext": "html js css",
    "env": {
      "NODE_ENV": "development"
    }
  });
});

gulp.task("start", ["serve", "watch"]);

gulp.task("default",
  [
    // Client files
    "client:html", "client:css", "client:ico",
    // Angular Dependencies on Client
    "client:corejs", "client:zonejs", "client:systemjs", "client:rxjs", "client:reflectMetadata", "client:angular",
    // jQuery and Bootstrap, Bootstrap Dependencies
    "client:jquery",
    // All typescript compilation
    "typescript",
  ]
);
