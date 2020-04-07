import * as vscode from 'vscode';
import * as serialport from 'serialport';
//import SerialPort = require("serialport");
import * as drivelist from 'drivelist';



/*
There are a few scenarios in which we might manage a device

1. The workspace is the root of the devices' filesystem

2. The workspace is on disk, but there is a device attached and the user's
   intent is to work on disk and click something that copies everything to the
   device.

*/
export class DeviceManager implements vscode.Disposable {

  public static async getInstance(): Promise<DeviceManager> {
    if (DeviceManager._instance === null) {
      DeviceManager._instance = new DeviceManager();
    }
    let d: drivelist.Drive[] = await DeviceManager._instance.findDevice();
    console.log(d);
    return DeviceManager._instance;
  }
  private static _instance: DeviceManager = null;

  public constructor() {}

  private async findDevice(): Promise<drivelist.Drive[]> {
    let usbDevices: drivelist.Drive[] =
      await drivelist.list().then(
        (drives) => drives.filter((v,i,a) => v.isUSB)
      );
    console.log(usbDevices);
    /*
    Here's fields from the Drive instance that will help
    drive.mountpoints.shift().label == "CIRCUITPY"
    drive.mountpoints.shift().path == "/Volumes/CIRCUITPY"
    drive.isUSB
    drive.size
        - PyRuler 66048

        - BackupDrive: 3000592498688 <- LOL
    drive.description
        - "Adafruit PyRuler Media"

        - "WD WDC WD30EFRX-68EUZN0 Media"
    */
    let serialPorts: serialport.PortInfo[] =
        await serialport.list();
    console.log(serialPorts);
    /*
    PortInfo

    port.comName - /dev/tty.usbmodem401
    port.manufacturer - "Adafruit Industries LLC"
    port.path /dev/tty.usbmodem401
    productId 804c
    vendorId: 239a
    */
    return usbDevices;
  }


  public dispose() {}
}