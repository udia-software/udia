/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  System.config({
    paths: {
      'ngdeps:': 'ngdeps/'
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: 'app',

      // angular bundles
      '@angular/core': 'ngdeps:@angular/core/bundles/core.umd.js',
      '@angular/common': 'ngdeps:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'ngdeps:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'ngdeps:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'ngdeps:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http': 'ngdeps:@angular/http/bundles/http.umd.js',
      '@angular/router': 'ngdeps:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'ngdeps:@angular/forms/bundles/forms.umd.js',

      // other libraries
      'rxjs': 'ngdeps:rxjs'
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        main: './main.js',
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      }
    }
  });
})(this);