// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var adb = angular.module("chromeADB");

adb.factory("socketService", ["$rootScope", "$q", function ($rootScope, $q) {
    function create() {
        var defer = $q.defer();

        chrome.socket.create("tcp", {}, function (createInfo) {
            if (createInfo.socketId >= 0) {
                $rootScope.$apply(function () {
                    defer.resolve(createInfo);
                });
            } else {
                // console.log("create error:", createInfo);
            }
        });

        return defer.promise;
    }

    function connect(createInfo, host, port) {
        var defer = $q.defer();

        if (typeof(port) != "number") {
            port = parseInt(port, 10);
        }

        chrome.socket.connect(createInfo.socketId, host, port, function (result) {
            if (result >= 0) {
                $rootScope.$apply(function () {
                    defer.resolve(createInfo);
                });
            } else {
                chrome.socket.destroy(createInfo.socketId);
                defer.reject(createInfo);
            }
        });

        return defer.promise;
    }

    function write(createInfo, str) {
        var defer = $q.defer();

        stringToArrayBuffer(str, function (bytes) {
            writeBytes(createInfo, bytes)
                .then(function (createInfo) {
                    defer.resolve(createInfo);
                });
        });

        return defer.promise;
    }
    
    function writeBytes(createInfo, bytes) {
        var defer = $q.defer();

        chrome.socket.write(createInfo.socketId, bytes, function (writeInfo) {
            // console.log("writeInfo:", writeInfo);
            if (writeInfo.bytesWritten > 0) {
                $rootScope.$apply(function () {
                    var param = {
                        createInfo: createInfo,
                        writeInfo: writeInfo
                    };
                    defer.resolve(param);
                });
            } else {
                // console.log("write error:", arrayBuffer);
                defer.reject(writeInfo);
            }
        });

        return defer.promise;
    }

    function read(createInfo, size) {
        var defer = $q.defer();

        chrome.socket.read(createInfo.socketId, size, function (readInfo) {
            if (readInfo.resultCode > 0) {
                // console.log(readInfo);
                arrayBufferToString(readInfo.data, function (str) {
                    $rootScope.$apply(function () {
                        var param = {
                            createInfo: createInfo,
                            data: str
                        };
                        defer.resolve(param);
                    });
                });
            } else {
                defer.reject(readInfo);
            }
        });

        return defer.promise;
    }

    function readAll(createInfo, stringConverter) {
        var defer = $q.defer();
        var data = "";

        (function readAllData() {
            chrome.socket.read(createInfo.socketId, 1024, function (readInfo) {
                if (readInfo.resultCode > 0) {
                    stringConverter(readInfo.data, function (str) {
                        data += str;
                        readAllData();
                    });
                } else {
                    $rootScope.$apply(function () {
                        var param = {
                            createInfo: createInfo,
                            data: data
                        }
                        defer.resolve(param);
                    });
                }
            });
        })();

        return defer.promise;
    }

    return {
        create: create,
        connect: connect,
        write: write,
        writeBytes: writeBytes,
        read: read,
        readAll: readAll
    }
}]);
