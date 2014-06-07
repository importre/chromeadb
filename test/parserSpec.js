'use strict';

describe('parser spec', function() {
  beforeEach(function() {
  });

  it('test \'adb devices -l\'', function() {
    var data = '000000 device usb:1111111 product:razor model:Nexus_7 device:flo';
    var res = parseDeviceInfoList(data);
    var serial = res.firstSerial;
    expect(serial).toBe('000000');
    expect(res.deviceInfoList[serial].usb).toBe('1111111');
    expect(res.deviceInfoList[serial].product).toBe('razor');
    expect(res.deviceInfoList[serial].model).toBe('Nexus_7');
    expect(res.deviceInfoList[serial].device).toBe('flo');
  });
});
