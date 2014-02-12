// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var adb = angular.module("chromeADB");

adb.controller("controller", ["$scope", "$q", "socketService", "$sce", function ($scope, $q, socketService, $sce) {
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
        $scope.mousepadEnabled = false;
        $scope.notInstalledApk = false;
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

    $scope.getByteCommandPromise = function (cmd, createInfo) {
        return socketService.writeBytes(createInfo, cmd)
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
                if (param && param.data == "OKAY") {
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
            $("#mytab a:first").tab("show");
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
                if (param) {
                    $scope.packages = parsePackageList(param.data);
                }
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

    $scope.pushFile = function (serial, fileEntry, filePath) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onerror = function (e) {
                $scope.logMessage = {
                    cmd: "File Error",
                    res: e.target.error.message
                };
                $scope.$apply();
            };
            reader.onloadend = function (e) {
                if (!e.target.error) {
                    $scope.pushFileCommands(e, serial, filePath);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    $scope.pushFileCommands = function (e, serial, filePath) {
        var fileName = filePath.replace(/^.*[\\\/]/, '');
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "sync:";
        var sendCmd1 = "SEND";
        var packagePath = "/data/local/tmp/" + fileName;
        var sendCmd3 = packagePath + ",33206";
        var sendCmd2 = integerToArrayBuffer(sendCmd3.length);
        var dataCmd1 = "DATA";
        var doneCmd = "DONE";

        $scope.logMessage = {
            cmd: "Install Package",
            res: "Installing..."
        };

        $scope.getNewCommandPromise(cmd1)
            .then(function (param) {
                if (param.data == "OKAY") {
                    return $scope.getCommandPromise(cmd2, param.createInfo);
                }
            })
            .then(function (param) {
                if (param.data == "OKAY") {
                    return socketService.write(param.createInfo, sendCmd1);
                }
            })
            .then(function (param) {
                return socketService.writeBytes(param.createInfo, sendCmd2.buffer);
            })
            .then(function (param) {
                return socketService.write(param.createInfo, sendCmd3);
            })
            .then(function (param) {
                var defer = $q.defer();
                var promise = defer.promise;
                var file = e.target.result;
                var maxChunkSize = 64 * 1024;
                for (var i = 0; i < file.byteLength; i += maxChunkSize) {
                    var chunkSize = maxChunkSize;
                    //check if on last chunk
                    if (i + maxChunkSize > file.byteLength) {
                        chunkSize = file.byteLength - i;
                    }

                    var chunkFunc = function (i, chunkSize) {
                        var fileSlice = file.slice(i, i + chunkSize);
                        promise = promise.then(function (param) {
                            return socketService.write(param.createInfo, dataCmd1);
                        })
                        .then(function (param) {
                            var chunkSizeInBytes = integerToArrayBuffer(chunkSize);
                            return socketService.writeBytes(param.createInfo, chunkSizeInBytes.buffer);
                        })
                        .then(function (param) {
                            return socketService.writeBytes(param.createInfo, fileSlice);
                        });
                    };
                    chunkFunc(i, chunkSize);
                }

                promise.then(function (param) {
                    return socketService.write(param.createInfo, doneCmd);
                })
                .then(function (param) {
                    return socketService.write(param.createInfo, integerToArrayBuffer(0));
                })
                .then(function (param) {
                    $scope.installPackage(serial, packagePath);
                });

                defer.resolve(param);

                return promise;
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
     * Installs a package.
     *
     * $ adb shell pm install <package>
     *
     * @param serial
     * @param packageName
     */
    $scope.installPackage = function (serial, packagePath) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:pm install -r " + packagePath;

        $scope.logMessage = {
            cmd: "Install Package",
            res: "Installing..."
        };

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.logMessage.res = param.data.trim();
                if ($scope.logMessage.res.length == 0) {
                    $scope.logMessage.res = "Done";
                }
                $scope.loadPackages(serial);
                $scope.removeApkFile(serial, packagePath);
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
            res: "Uninstalling..."
        };

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.logMessage.res = param.data.trim();
                if ($scope.logMessage.res.length == 0) {
                    $scope.logMessage.res = "Done";
                }
                $scope.loadPackages(serial);
            });
    }

    $scope.removeApkFile = function (serial, packagePath) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:rm -rf " + packagePath;

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
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
                if (param) {
                    var lines = parseProcessList(param.data);
                    var body = lines.splice(1);
                    var head = lines[0];
                    $scope.processList = {
                        head: head,
                        processes: body
                    }
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
                if (param) {
                    if (!procName) {
                        var data = parseMemInfo(param.data);
                        $scope.memInfo = data;
                    } else {
                        var data = parsePackageMemInfo(param.data);
                        drawHeapGraph(data);
                    }
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
                if (param) {
                    $scope.diskSpace = parseDiskSpace(param.data);
                }
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

    $scope.chooseAndInstallPackage = function () {
        chrome.fileSystem.chooseEntry({'type': 'openFile'}, function (entry, fileEntries) {
            chrome.fileSystem.getDisplayPath(entry, function (displayPath) {
                $scope.pushFile($scope.devInfo.serial, entry, displayPath);
            });
        });
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

        $("#procMemInfoModal").on("hidden.bs.modal", function () {
            $scope.clearIntervalOfHeapInfo();
        });
    }

    function drawHeapGraph(data) {
        // console.log(JSON.stringify(data));
        for (var i = 0; i < data.length; i++) {
            $scope.heapChartList[i].destroy();
            $scope.heapSize[i].splice(0, 1);
            $scope.heapAlloc[i].splice(0, 1);
            $scope.heapSize[i].push(data[i].size / 1024);
            $scope.heapAlloc[i].push(data[i].alloc / 1024);

            $scope.heapChartList[i].replot({
                data: [$scope.heapSize[i], $scope.heapAlloc[i]],
                title: data[i].area,
                legend: {show: true, location: "e", placement: "insideGrid"},
                series: [
                    {label: "Heap Size (MB)"},
                    {label: "Heap Alloc (MB)"}
                ]
            });
        }
    }

    $scope.scaleOfMousePad = 2;
    $scope.mouseDownX = -1;
    $scope.mouseDownY = -1;
    $scope.swipeDuration = 100;
    $scope.packageName = "io.github.importre.android.chromeadb";
    $scope.eventFilePath = "/sdcard/chromeadb.event";

    /**
     * Sets mouse pad size.
     *
     * Shows mousepad if parsed window size and chromeadb apk is installed.
     *
     * @param serial
     */
    $scope.initMousePad = function (serial) {
        var cmd1 = "host:transport:" + serial;
        $scope.logMessage = null;
        $scope.mousepadEnabled = false;
        $scope.notInstalledApk = false;
        $scope.mousepadMsg = "Checking...";

        $scope.getReadAllPromise(cmd1, "shell:pm list packages")
            .then(function (param) {
                if (!param) {
                    // not connected
                    $scope.mousepadMsg = "";
                } else if (param.data.indexOf($scope.packageName) >= 0) {
                    // connected
                    var cmd2 = "shell:dumpsys window";
                    $scope.getReadAllPromise(cmd1, cmd2)
                        .then(function (param) {
                            var size = parseResolution(param.data);
                            if (size != null) {
                                $scope.mousepadEnabled = true;
                                $scope.notInstalledApk = true;
                                $scope.devResolution = {
                                    width: (size.width / $scope.scaleOfMousePad) + "px",
                                    height: (size.height / $scope.scaleOfMousePad) + "px"
                                };

                                if ($scope.scaleOfMousePad >= 4) {
                                    $("#mousepad-size-group label:last").click();
                                } else {
                                    $("#mousepad-size-group label:first").click();
                                }
                            } else {
                                // failed to parse `dumpsys windows`
                                $scope.mousepadEnabled = false;
                                var title = "feedback mousepad";

                                $scope.getReadAllPromise(cmd1, "shell:input")
                                    .then(function(param) {
                                        body += "\n\n\n" + param.data;
                                        $scope.mousepadMsg = "Error: " + $scope.getFeedbackTag(title, body);
                                    });
                            }
                        });
                } else {
                    // apk is not installed.
                    $scope.notInstalledApk = true;
                    $scope.mousepadMsg = "Install ChromeADB for Android";
                }
            });
    }

    /**
     * TODO: Sends Intent
     *
     * @param serial
     */
    $scope.sendIntentApk = function (serial) {
        var act = "android.intent.action.VIEW";
        // var uri = "http://play.google.com/store/apps/details?id=io.github.importre.android.chromeadb";
        var uri = "market://details?id=io.github.importre.android.chromeadb";
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:am start -a " + act + " -d " + uri;
        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                $scope.logMessage = {
                    cmd: "PlayStore",
                    res: "See your device and Install ChromeADB for Android"
                };
            });
    }

    $scope.mouseDown = function (event) {
        $scope.mouseDownX = event.offsetX * $scope.scaleOfMousePad;
        $scope.mouseDownY = event.offsetY * $scope.scaleOfMousePad;
    }

    $scope.mouseUp = function (serial, event) {
        var x = event.offsetX * $scope.scaleOfMousePad;
        var y = event.offsetY * $scope.scaleOfMousePad;

        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:input touchscreen tap " + x + " " + y;

        var x1 = $scope.mouseDownX;
        var y1 = $scope.mouseDownY;

        if (x1 >= 0 && y1 >= 0) {
            var dist = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
            // console.log("dist : " + dist);
            if (dist > 30) {
                cmd2 = "shell:input touchscreen swipe " + [x1, y1, x, y].join(" ")
                console.log(cmd2);
            }
        }

        $scope.mouseDownX = -1;
        $scope.mouseDownY = -1;

        var getLogMessage = function (data) {
            return {
                cmd: "MousePad",
                res: data.split("\n")[0]
            };
        }

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                if (param && param.data) {
                    var errMsg = param.data.split("\n")[0].toLowerCase();
                    if (errMsg.indexOf("error") >= 0 || errMsg.indexOf("unknown command") >= 0) {
                        // remove touchscreen command and retry tab or swipe command
                        cmd2 = cmd2.replace("touchscreen ", "");
                        $scope.getReadAllPromise(cmd1, cmd2)
                            .then(function (param) {
                                if (param && param.data)  {
                                    $scope.logMessage = getLogMessage(param.data);
                                }
                            });
                    } else {
                        $scope.logMessage = getLogMessage(param.data);
                    }
                }
            });
    }

    $scope.mouseMove = function (serial, event) {
        var x = event.offsetX * $scope.scaleOfMousePad;
        var y = event.offsetY * $scope.scaleOfMousePad;

        $scope.mouseMoveLog = "coord: (" + x + ", " + y + ")";

        if ($scope.coords == null) {
            $scope.coords = [];
        }

        $scope.coords.push(x);
        $scope.coords.push(y);

        if ($scope.coords.length > 2) {
            var cmd1 = "host:transport:" + serial;
            var cmd2 = "shell: echo move " + $scope.coords.join(",") + " >> " + $scope.eventFilePath;

            $scope.getReadAllPromise(cmd1, cmd2)
                .then(function (param) {
                });
            $scope.coords = [];
        }
    }

    $scope.mouseEnter = function (serial) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:am startservice --user 0 -n " + $scope.packageName + "/.ChromeAdbService";

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                if (param && param.data) {
                    if (param.data.indexOf("--user") >= 0) {
                        cmd2 = cmd2.replace("--user 0 ", "");
                        $scope.getReadAllPromise(cmd1, cmd2)
                            .then(function (param) {
                            });
                    }
                }
            });
    }

    $scope.mouseLeave = function (serial) {
        var cmd1 = "host:transport:" + serial;
        var cmd2 = "shell:rm -r " + $scope.eventFilePath;

        $scope.getReadAllPromise(cmd1, cmd2)
            .then(function (param) {
                cmd2 = "shell:am stopservice -n " + $scope.packageName + "/.ChromeAdbService";

                $scope.getReadAllPromise(cmd1, cmd2)
                    .then(function (param) {
                    });
            });
    }

    $scope.rotateMousePad = function () {
        $scope.devResolution = {
            width: $scope.devResolution.height,
            height: $scope.devResolution.width
        };
    }

    $scope.setMousePadSize = function (serial, scale) {
        $scope.scaleOfMousePad = scale;
        $scope.initMousePad(serial);
    }

    $scope.getFeedbackTag = function (title, body) {
        title = "[ChromeADB] " + title;
        body = encodeURIComponent(body);

        var to = "chromeadb@gmail.com";
        var mailto = $sce.trustAsHtml("mailto:" + to + "?subject=" + title + "&body=" + body);
        return "<a href='" + mailto + "' target='_blank'>Send feedback</a>";
    }
}]);

