// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

'use strict';

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('../index.html', {
    minWidth: 800,
    minHeight: 600,
    width: 1280,
    height: 800
  });
});

