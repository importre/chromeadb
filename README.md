ChromeADB
=========

[![Build Status](https://travis-ci.org/importre/chromeadb.svg?branch=master)](https://travis-ci.org/importre/chromeadb)
[![Android Arsenal](https://img.shields.io/badge/Android%20Arsenal-ChromeADB-brightgreen.svg?style=flat)](https://android-arsenal.com/details/1/863)

**ChromeADB** is a Chrome ADB (Android Debug Bridge) client.

When launched, you can see all devices connected to your machine if the ADB connection is successful.  
Click a device that you want to control or monitor. And enjoy!

![screenshot](https://raw.github.com/importre/chromeadb/master/src/assets/chromeadb_screenshot.png)



How to install
--------------

- Install [node.js][0]
- `$ npm install -g bower`
- `$ bower install`
- Open `chrome://extensions` in your Chrome.
- Check `Developer mode`
- Select `Load unpacked extensions...`
- Open `$CHROMEADB_HOME/src`



How to build
------------

- `$ npm install -g grunt-cli`
- `$ npm install`
- `$ grunt`
- Check a zip file in `$CHROMEADB_HOME/package`



Pre-requirements
----------------

- ADB included in [Android SDK][1]
- Start ADB daemon
	- `$ adb start-server`
- ChromeADB for Android (Optional)
	-  for Mousepad
	- Go to [Github][github] or [PlayStore][chromeadb_for_android]



How to use
----------

Are you an Android developer?  
No description needed anymore :)



Chrome Store
------------

[![chrome_store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_496x150.png)][2]



References
----------

- [ADB OVERVIEW.txt][3]
- [ADB SERVICES.txt][4]



License
-------

BrickSimple Public License 1.0 (Based on the Mozilla Public License Version 2.0). See the `LICENSE` file.




[0]: http://www.nodejs.org/ "node.js"
[1]: http://developer.android.com/sdk/index.html "android sdk"
[2]: https://chrome.google.com/webstore/detail/chrome-adb/fhdoijgfljahinnpbolfdimpcfoicmnm "chrome store"
[3]: https://github.com/android/platform_system_core/blob/master/adb/OVERVIEW.TXT "adb overview"
[4]: https://github.com/android/platform_system_core/blob/master/adb/SERVICES.TXT "adb services"

[chromeadb_for_android]: https://play.google.com/store/apps/details?id=io.github.importre.android.chromeadb
[github]: https://github.com/importre/chromeadb_for_android
