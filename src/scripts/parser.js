// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/**
 * Parses the result of $scope.loadDevices().
 *
 * @param data
 * @returns {{firstSerial: null, deviceInfoList: Object, numOfDevices: Number}}
 */
function parseDeviceInfoList(data) {
    var lines = data.trim().split("\n");
    var deviceInfoList = new Object();
    var firstSerial = null;

    for (var i in lines) {
        lines[i] = lines[i].trim().split(/\s+/g);
        var serial = lines[i][0];

        if (0 == i) {
            firstSerial = serial;
        }

        deviceInfoList[serial] = {
            serial: serial,
            state: lines[i][1],
            usb: null,
            product: null,
            model: null,
            device: null
        }
        for (var j = 2; j < lines[i].length; j++) {
            if (lines[i][j].match(/^usb:/)) {
                deviceInfoList[serial].usb = lines[i][j].substr(4);
            } else if (lines[i][j].match(/^product:/)) {
                deviceInfoList[serial].product = lines[i][j].substr(8);
            } else if (lines[i][j].match(/^model:/)) {
                deviceInfoList[serial].model = lines[i][j].substr(6);
            } else if (lines[i][j].match(/^device:/)) {
                deviceInfoList[serial].device = lines[i][j].substr(7);
            }
        }
    }

    var keys = Object.keys(deviceInfoList);
    if (keys.length > 0) {
        firstSerial = keys.sort()[0];
    }

    return {
        firstSerial: firstSerial,
        deviceInfoList: deviceInfoList,
        numOfDevices: lines.length
    };
}

/**
 * Parses the result of $scope.loadPackages().
 *
 * @param data
 * @returns {Array}
 */
function parsePackageList(data) {
    var lines = data.trim().split("\n");

    for (var i in lines) {
        lines[i] = lines[i].replace(/^package:/, "").trim();
    }

    return lines;
}

/**
 * Makes adb command.
 *
 * @param cmd
 * @returns {string} <the length of zero padded cmd><cmd>
 */
function makeCommand(cmd) {
    var hex = cmd.length.toString(16);
    while (hex.length < 4) {
        hex = "0" + hex;
    }

    cmd = hex + cmd;
    return cmd;
}

/**
 * Parses the result of $scope.loadProcessList()
 *
 * @param data
 * @returns {Array}
 */
function parseProcessList(data) {
    var re = new RegExp(/^(\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([a-fA-F0-9]+)\s+([a-fA-F0-9]+ \w)\s+(.+)/m);
    var lines = data.trim().split("\n");
    var line;

    for (var i in lines) {
        line = lines[i].trim();
        if (0 == i) {
            line = line.trim().split(/\s+/);
        } else {
            line = re.exec(line);
            line.splice(0, 1);
        }
        lines[i] = line;
    }
    return lines;
}

function parseMemInfo(data) {
    // \1: memory (kb)
    // \2: process name
    // \3: pid
    var re = new RegExp(/^(\d+)\s+kB:\s+(\S+)\s\(pid\s+(\d+).*/);
    var lines = data.trim().split("\n");
    var line;
    var pss = 0;
    var ret = [];

    for (var i in lines) {
        line = lines[i].trim();

        if (line.length == 0) {
            continue;
        }

        if (line.indexOf("Total PSS by process") >= 0) {
            pss++;
            continue;
        }

        if (pss == 1) {
            line = re.exec(line);
            if (line) {
                ret.push({
                    process: line[2],
                    pid: line[3],
                    kb: line[1] + " KB",
                    mb: parseInt(parseFloat(line[1]) / 1024 + 0.5) + " MB"
                });
            } else {
                break;
            }
        }
    }
    return ret;
}

function parsePackageMemInfo(data) {
    // \1: Native | Dalvik
    // \2: size
    // \3: alloc
    // \4: free
    var re = new RegExp(/^(Native|Dalvik)(?:\s+\d+)(?:\s+\d+)(?:\s+\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    var lines = data.trim().split("\n");
    var line;
    var ret = [];
    var cnt = 0;

    for (var i in lines) {
        line = lines[i].trim();
        line = re.exec(line);
        if (line) {
            cnt++;
            ret.push({
                area: line[1],
                size: line[2],
                alloc: line[3],
                free: line[4]
            });
        }

        if (cnt >= 2) {
            break;
        }
    }
    return ret;
}

function parseDiskSpace(data) {
    var lines = data.trim().split("\n");
    var line, head, body = [];

    for (var i in lines) {
        line = lines[i].trim().split(/\s+/);
        if (i == 0) {
            head = line;
        } else {
            body.push(line);
        }
    }
    return {head: head, body: body};
}