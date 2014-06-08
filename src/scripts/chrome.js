'use strict';
/* jshint unused:false */

var timeoutDelay = 10;
var curCmd;
var cmdToResp;

function initCmdToResp() {
  cmdToResp = {
    '000ehost:devices-l': ['OKAY', '005B',
        '048233d1d151e3cc device usb:1A120000 product:aosp_mako ' +
        'model:AOSP_on_Mako device:mako'],
    '001fhost:transport:048233d1d151e3cc': ['OKAY'],
    '0016shell:pm list packages': ['OKAY',
      'package:com.android.settings\npackage:com.android.musicfx'],
    '0015shell:dumpsys meminfo': ['OKAY', 'OKAY',
        'Applications Memory Usage (kB):\n' +
        'Uptime: 95848872 Realtime: 211090246\n\nTotal PSS by process:\n' +
        '71959 kB: com.google.android.googlequicksearchbox (pid 892 / activities)\n' +
        '71580 kB: com.android.chrome (pid 7876 / activities)']
  };
}

function initChromeSocket(chrome) {
  if (chrome.socket) {
    return;
  }

  chrome.socket = {
    create: function (type, options, callback) {
      var createInfo = {
        'socketId': 10
      };

      window.setTimeout(function () {
        callback(createInfo);
      }, timeoutDelay);
    },

    destroy: function (socketId) {
    },

    connect: function (socketId, hostname, port, callback) {
      var result = 1;
      window.setTimeout(function () {
        callback(result);
      }, timeoutDelay);
    },

    read: function (socketId, bufferSize, callback) {
      window.setTimeout(function () {
        var resp = cmdToResp[curCmd];
        if (resp) {
          resp = cmdToResp[curCmd].splice(0, 1)[0];
        }
        if (typeof resp === 'undefined') {
          initCmdToResp();
        }
        stringToArrayBuffer(resp, function (bytes) {
          var readInfo = {
            'resultCode': resp ? 1 : 0,
            'data': bytes
          };
          callback(readInfo);
        });
      }, timeoutDelay);
    },

    write: function (socketId, data, callback) {
      curCmd = data;
      var writeInfo = {
        bytesWritten: data.length
      };
      window.setTimeout(function () {
        callback(writeInfo);
      }, timeoutDelay);
    }
  };

  window.arrayBufferToString = function (buf, callback) {
    callback(buf);
  };

  window.stringToArrayBuffer = function (str, callback) {
    callback(str);
  };
}

function initChromeRuntime(chrome) {
  if (!chrome.runtime) {
    return;
  }

  if (!chrome.runtime.getURL) {
    chrome.runtime.getURL = function (url) {
      return url;
    };
  }
}

(function (window) {
  var chrome = window.chrome;
  if (typeof chrome === 'undefined' || typeof chrome !== 'object') {
    chrome = window.chrome = {};
  }

  initCmdToResp();
  initChromeSocket(chrome);
  initChromeRuntime(chrome);

  return chrome;
}(window));
