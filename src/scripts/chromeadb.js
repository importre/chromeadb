// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

'use strict';

var adb = angular.module('chromeADB', ['ngRoute', 'ngSanitize']);

adb.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      redirectTo: '/packages'
    })
    .when('/packages', {
      templateUrl: chrome.runtime.getURL('../views/packages.html')
    })
    .when('/pushfile', {
      templateUrl: chrome.runtime.getURL('../views/pushfile.html')
    })
    .when('/controller', {
      templateUrl: chrome.runtime.getURL('../views/controller.html')
    })
    .when('/processes', {
      templateUrl: chrome.runtime.getURL('../views/processes.html')
    })
    .when('/meminfo', {
      templateUrl: chrome.runtime.getURL('../views/meminfo.html')
    })
    .when('/diskspace', {
      templateUrl: chrome.runtime.getURL('../views/diskspace.html')
    });
});
