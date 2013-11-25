// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var adb = angular.module("chromeADB", []);

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
        read: read,
        readAll: readAll
    }
}]);

adb.controller("controller", function ($scope, socketService) {
    $scope.host = "127.0.0.1";
    $scope.port = 5037;
    $scope.numOfXAxis = 15;

    $scope.initVariables = function () {
        $scope.devInfo = null;
        $scope.deviceInfoList = null;
        $scope.numOfDevices = null;
        $scope.initDeviceData();
    }

    $scope.clearIntervalOfHeapInfo = function () {
        var intervalId = $scope.intervalIdOfHeapInfo;
        if (intervalId) {
            window.clearInterval(intervalId);
            $scope.intervalIdOfHeapInfo = null;
        }

        if ($scope.heapChartList) {
            for (var i = 0; i < $scope.heapChartList.length; i++) {
                if ($scope.heapChartList[i]) {
                    $scope.heapChartList[i].destroy();
                }
            }
        }

        $scope.heapSize = [newZeroArray($scope.numOfXAxis), newZeroArray($scope.numOfXAxis)];
        $scope.heapAlloc = [newZeroArray($scope.numOfXAxis), newZeroArray($scope.numOfXAxis)];
    }

    $scope.initDeviceData = function () {
        $scope.packages = null;
        $scope.text = null;
        $scope.processList = null;
        $scope.memInfo = null;
        $scope.diskSpace = null;
        $scope.logMessage = null;
        $scope.clearIntervalOfHeapInfo();
    }

    $scope.initVariables();

    $scope.getNewCommandPromise = function (cmd) {
        return socketService.create()
            .then(function (createInfo) {
                return socketService.connect(createInfo, $scope.host, $scope.port);
            })
            .then(function (createInfo) {
                var cmdWidthLength = makeCommand(cmd);
                // console.log("command:", cmdWidthLength);
                return socketService.write(createInfo, cmdWidthLength);
            })
            .then(function (param) {
                return socketService.read(param.createInfo, 4);
            })
            .catch(function (param) {
                $scope.initVariables();
                $scope.logMessage = {
                    cmd: "Connection Error",
                    res: "run \"$ adb start-server\""
                };
            });
    }

    $scope.getCommandPromise = function (cmd, createInfo) {
        var cmdWidthLength = makeCommand(cmd);
        // console.log("command:", cmdWidthLength);
        return socketService.write(createInfo, cmdWidthLength)
            .then(function (param) {
                return socketService.read(param.createInfo, 4);
            });
    }

    $scope.getReadAllPromise = function (cmd1, cmd2) {
        return $scope.getNewCommandPromise(cmd1)
            .then(function (param) {
                // console.log(param);
                if (param.data == "OKAY") {
                    return $scope.getCommandPromise(cmd2, param.createInfo);
                }
            })
            .then(function (param) {
                // console.log(param);
                if (param.data == "OKAY") {
                    return socketService.readAll(param.createInfo, arrayBufferToString);
                }
            })
            .catch(function (param) {
                $scope.initVariables();
                $scope.logMessage = {
                    cmd: "Connection Error",
                    res: "Cannot find any devices"
                };
            });
    }

    /**
     * Sets connected devices, a number of devices to $scope.deviceInfoList, $scope.numOfDevices respectively.
     *
     * $ adb devices -l
     */
    $scope.loadDevices = function () {
        $scope.initVariables();

        $scope.getNewCommandPromise("host:devices-l")
            .then(function (param) {
                if (param.data == "OKAY") {
                    return socketService.read(param.createInfo, 4);
                }
            })
            .then(function (param) {
                var size = parseInt(param.data, 16);
                return socketService.read(param.createInfo, size);
            })
            .then(function (param) {
                chrome.socket.destroy(param.createInfo.socketId);

                if (!param.data || param.data.length == 0) {
                    return;
                }

                var res = parseDeviceInfoList(param.data);
                var firstSerial = res.firstSerial;
                $scope.deviceInfoList = res.deviceInfoList;
                $scope.numOfDevices = res.numOfDevices;

                if (firstSerial) {
                    $scope.loadDeviceInfo(firstSerial);
                }
            });
    }

    /**
     * Sets the device info to $scope.devInfo.
     * It'll be invoked if $scope.loadDevices is successful.
     *
     * @param serial A specific device.
     */
    $scope.loadDeviceInfo = function (serial) {
        $scope.initDeviceData();
        $scope.devInfo = $scope.deviceInfoList[serial];
        $scope.loadPackages(serial);
        $scope.loadProcessList(serial);
        $scope.loadMemInfo(serial, null);
        $scope.loadDiskSpace(serial);

        // show packages tab
        $(function () {
            $('#mytab a:first').tab('show');
        });
    }

    /**
     * Sets the package list to $scope.packages.
     *
     * $ adb shell pm list package
     *
     * @param serial A specific device.
     */
    $scope.loadPackages = function (serial) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:pm list package";

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.packages = parsePackageList(param.data);
            });
    }

    /**
     * Handles a click event.
     *
     * $ adb shell input keyevent <keyCode>
     *
     * @param serial A specific device.
     * @param keyCode See http://goo.gl/ANf7J
     */
    $scope.onClickButton = function (serial, keyCode) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:input keyevent " + keyCode;

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                // do nothing...
            });
    }

    /**
     * Removes all data of the package.
     *
     * $ adb shell pm clear <package>
     *
     * @param serial A specific device.
     * @param packageName The package that you're going to clear
     */
    $scope.clearData = function (serial, packageName) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:pm clear " + packageName;

        $scope.logMessage = {
            cmd: "Clear Data",
            res: null
        };

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.logMessage.res = param.data.trim();
            });
    }

    /**
     * Uninstalls a package.
     *
     * $ adb shell pm uninstall <package>
     *
     * @param serial
     * @param packageName
     */
    $scope.uninstallPackage = function (serial, packageName) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:pm uninstall " + packageName;

        $scope.logMessage = {
            cmd: "Uninstall",
            res: null
        };

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.logMessage.res = param.data.trim();
                if ($scope.logMessage.res.length == 0) {
                    $scope.logMessage.res = "Done";
                }
            });
    }

    $scope.stopPackage = function (serial, packageName) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:am force-stop " + packageName;

        $scope.logMessage = {
            cmd: "Force-stop",
            res: null
        };

        console.log(serial, packageName);
        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                console.log(serial, packageName);
            });
    }

    /**
     * Sends the text.
     *
     * $ adb shell input text <text>
     *
     * @param serial
     * @param text
     */
    $scope.sendText = function (serial, text) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:input text " + text;

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                // console.log(param);
                $scope.text = null;
            });
    }

    /**
     * Sets the process list to $scope.processList
     *
     * $ adb shell ps
     *
     * @param serial
     */
    $scope.loadProcessList = function (serial) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:ps";

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                var lines = parseProcessList(param.data);
                var body = lines.splice(1);
                var head = lines[0];
                $scope.processList = {
                    head: head,
                    processes: body
                }
            });
    }

    /**
     * Sets the meminfo to $scope.memInfo
     *
     * $ adb shell dumpsys meminfo
     *
     * @param serial
     * @param procName
     */
    $scope.loadMemInfo = function (serial, procName) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:dumpsys meminfo";

        if (procName) {
            cmd2 += (" " + procName);
        }

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                if (!procName) {
                    var data = parseMemInfo(param.data);
                    $scope.memInfo = data;
                } else {
                    var data = parsePackageMemInfo(param.data);
                    drawHeapGraph(data);
                }
            });
    }

    /**
     * Sets the disk space info to $scope.diskSpace
     *
     * $ adb shell cat /proc/meminfo
     *
     * @param serial
     */
    $scope.loadDiskSpace = function (serial) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:df";

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.diskSpace = parseDiskSpace(param.data);
            });
    }

    /**
     * Assigns temporary variables for clear data, uninstall or stop a package.
     *
     * @param cmd 0: clear data, 1: uninstall, 2: stop
     * @param serial
     * @param packageName
     */
    $scope.setPackageCommandInfo = function (cmd, serial, packageName) {
        var func = null;
        var msg = "";
        switch (cmd) {
            case 0:
                func = $scope.clearData;
                msg = "CLEAR DATA";
                break;
            case 1:
                func = $scope.uninstallPackage;
                msg = "UNINSTALL";
                break;
            case 2:
                func = $scope.stopPackage;
                msg = "FORCE-STOP";
                break;
        }

        if (func) {
            $scope.tempPkgCmd = {
                func: func,
                msg: msg,
                serial: serial,
                packageName: packageName
            }
        } else {
            $scope.tempPkgCmd = null;
        }
    }

    $scope.loadHeapInfoOfApp = function (serial, process) {
        $scope.clearIntervalOfHeapInfo();
        $scope.procName = process;
        $scope.heapChartList = new Array(2);
        for (var i = 0; i < 2; i++) {
            var name = getChartId(i);
            var data = [newZeroArray($scope.numOfXAxis)];
            $scope.heapChartList[i] = $.jqplot(name, data);
        }

        $scope.intervalIdOfHeapInfo = window.setInterval(function () {
            $scope.loadMemInfo(serial, process);
        }, 1000);

        $('#procMemInfoModal').on('hidden.bs.modal', function () {
            $scope.clearIntervalOfHeapInfo();
        });
    }

    function drawHeapGraph(data) {
        // console.log(JSON.stringify(data));
        for (var i = 0; i < data.length; i++) {
            $scope.heapChartList[i].destroy();
            var last = $scope.heapSize[i].length;
            for (var j = 0; j < last - 1; j++) {
                $scope.heapSize[i][j] = $scope.heapSize[i][j + 1];
                $scope.heapAlloc[i][j] = $scope.heapAlloc[i][j + 1];
            }

            $scope.heapSize[i][last - 1] = data[i].size / 1024;
            $scope.heapAlloc[i][last - 1] = data[i].alloc / 1024;
            $scope.heapChartList[i] = $.jqplot(getChartId(i), [
                $scope.heapSize[i],
                $scope.heapAlloc[i]
            ], {
                title: data[i].area,
                legend: {show: true, location: 'e', placement: 'insideGrid'},
                series: [
                    {label: "Heap Size (MB)"},
                    {label: "Heap Alloc (MB)"}
                ]
            });
        }
    }
});
