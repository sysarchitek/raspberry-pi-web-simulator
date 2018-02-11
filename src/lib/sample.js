import { Client, Message } from 'azure-iot-device'
import { traceEvent } from './telemetry.js';
import Protocol from './mqtt.js';
import wpi from './wiring-pi.js';
import codeFactory from '../data/codeFactory.js';
import BME280 from './bme280.js';
import SIM908 from './sim908.js'; // fturi added sim908 library
import SDCARD from './SdCard.js'; // fturi added SdCard library
//import IOTHUB from './IotHub.js'; // fturi added EventHub library


//fturi 1/3: DO import above library

class ClientWrapper extends Client {
    constructor(transport,connStr,blobUploadClient) {
        window.azure_iot_device_client = super(transport,connStr,blobUploadClient);
        return window.azure_iot_device_client;
    }

    static fromConnectionString(connStr,transport) {
        window.azure_iot_device_client = super.fromConnectionString(connStr,transport);
        return window.azure_iot_device_client;
    }
}
class Sample {
    constructor() {
        this.runningFunction = null;
        if(!window.oldSetTimeout) {
            window.timeoutList = new Array();
            window.intervalList = new Array();

            window.oldSetTimeout = window.setTimeout;
            window.oldSetInterval = window.setInterval;
            window.oldClearTimeout = window.clearTimeout;
            window.oldClearInterval = window.clearInterval;

            window.setTimeout = function(code, delay) {
                var retval = window.oldSetTimeout(code, delay);
                window.timeoutList.push(retval);
                return retval;
            };
            window.clearTimeout = function(id) {
                var ind = window.timeoutList.indexOf(id);
                if(ind >= 0) {
                    window.timeoutList.splice(ind, 1);
                }
                var retval = window.oldClearTimeout(id);
                return retval;
            };
            window.setInterval = function(code, delay) {
                var retval = window.oldSetInterval(code, delay);
                window.intervalList.push(retval);
                return retval;
            };
            window.clearInterval = function(id) {
                var ind = window.intervalList.indexOf(id);
                if(ind >= 0) {
                    window.intervalList.splice(ind, 1);
                }
                var retval = window.oldClearInterval(id);
                return retval;
            };
            window.clearAllTimeouts = function() {
                for(var i in window.timeoutList) {
                    window.oldClearTimeout(window.timeoutList[i]);
                }
                window.timeoutList = new Array();
            };
            window.clearAllIntervals = function() {
                for(var i in window.intervalList) {
                    window.oldClearInterval(window.intervalList[i]);
                }
                window.intervalList = new Array();
            };
        }
        this.actualClient = null;
    }

    stop() {
        window.clearAllIntervals();
        window.clearAllTimeouts();
        if(window.azure_iot_device_client) {
            window.azure_iot_device_client.close();
        }
    }

    
    //fturi 2/3 sed interpretor
    run(option) {
        // a prefix of UUID to avoid name conflict, here just use a fix one
        const prefix = '76f98350';
        var replaces = [
            {
                src: /require\('wiring-pi'\)/g,
                dest: 'wpi'
            }, {
                src: /require\('azure-iot-device'\)\.Client/g,
                dest: 'Client'
            }, {
                src: /require\('azure-iot-device'\)\.Message/g,
                dest: 'Message'
            }, {
                src: /require\('azure-iot-device-mqtt'\)\.Mqtt/g,
                dest: 'Protocol'
            }, {
                src: /require\('bme280-sensor'\)/g,
                dest: 'BME280'
            }, { // fturi begin Added SIM908 and SDCARD declaration into raspbery emulator language
                src: /require\('sim908-sensor'\)/g,
                dest: 'SIM908'
            }, { // fturi SDCARD declaration
                src: /require\('SdCard-device'\)/g,
                dest: 'SDCARD'
            }, { // fturi SDCARD declaration
                src: /require\('IotHub-service'\)/g,
                dest: 'IOTHUB'
            }, { // fturi end Added SIM908 and SDCARD declaration into raspbery emulator language
                src: /console\.log/g,
                dest: 'msgCb'
            }, {
                src: /console\.error/g,
                dest: 'errCb'
            }
        ];
        wpi.setFunc(option.ledSwitch);
        
        //fturi 3/3 Import constants
        try {
            traceEvent('run-sample');
            var src = codeFactory.getRunCode('index', replaces, prefix);
            this.runningFunction = new Function('replaces' + prefix, src);
            this.runningFunction({
                wpi: wpi,
                Client: ClientWrapper,
                Message: Message,
                Protocol: Protocol,
                BME280: BME280,
                SIM908: SIM908, // fturi added SIM908 constants
                SDCARD: SDCARD, // fturi added SDCARD constants
  //              IOTHUB: IOTHUB, //fturi added EVENTHUB
                msgCb: option.onMessage,
                errCb: option.onError
            });
            // if (src.search(/^((?!\/\/).)*setInterval/gm) < 0) {
            //     option.onFinish();
            // }
        } catch (err) {
            traceEvent('run-error', { error: err });
            option.onError(err.message || JSON.stringify(err));
            option.onFinish();
        }
    }
}

export default Sample;