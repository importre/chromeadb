// Copyright (c) 2013, importre. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/**
 * Converts ArrayBuffer to string.
 *
 * @param buf
 * @param callback
 */
function arrayBufferToString(buf, callback) {
    var b = new Blob([new Uint8Array(buf)]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsText(b);
}

function arrayBufferToBinaryString(buf, callback) {
    var b = new Blob([new Uint8Array(buf)]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsBinaryString(b);
}

/**
 * Converts string to ArrayBuffer.
 *
 * @param buf
 * @param callback
 */
function stringToArrayBuffer(str, callback) {
    var b = new Blob([str]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(b);
}

function newZeroArray(size) {
    var arr = new Array(size);
    for (var i = 0; i < size; i++) {
        arr[i] = 0;
    }
    return arr;
}

function getChartId(idx) {
    switch (idx) {
        case 0:
            return "heap_native_chart";
        case 1:
            return "heap_dalvik_chart";
    }
    return null;
}

function integerToArrayBuffer(value) {
    result = new Uint32Array(1);
    result[0] = value;
    return result;
}
