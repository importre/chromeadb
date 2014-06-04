(function (chrome, window) {
  'use strict';
  var timeoutDelay = 500;

  if (typeof chrome != 'undefined' && typeof chrome != 'object') {
    window.chrome = {};
  }

  if (chrome.socket) {
    return;
  }

  chrome.runtime.getURL = function (url) {
      return url;
  };

  chrome.socket = {
    create: function (type, options, callback) {
//      console.log('=create=======');
//      console.log('type: ' + type);
//      console.log('options: ' + JSON.stringify(options));
//      console.log('==============');
      var createInfo = {
        'socketId': 10
      };

      window.setTimeout(function () {
        callback(createInfo);
      }, timeoutDelay);
    },
    destroy: function (socketId) {
//      console.log(socketId);
    },
    connect: function (socketId, hostname, port, callback) {
      var result = 1;
      window.setTimeout(function () {
        callback(result);
      }, timeoutDelay);
    },
    read: function (socketId, bufferSize, callback) {
//      console.log('=read======');
//      console.log('bufferSize: ' + bufferSize);
//      console.log('===========');
      window.setTimeout(function () {
        stringToArrayBuffer('OKAY', function (bytes) {
          var readInfo = {
            'resultCode': 1,
            'data': bytes
          };
          callback(readInfo);
        });
      }, timeoutDelay);
    },
    write: function (socketId, data, callback) {
//      console.log('=write=====');
//      console.log('data: ', data);
//      console.log('===========');
      var writeInfo = {
        bytesWritten: data.byteLength
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

  return chrome;

}(chrome, window));
