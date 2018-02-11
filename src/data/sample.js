/*
* IoT Hub Raspberry Pi NodeJS - Microsoft Sample Code - Copyright (c) 2017 - Licensed MIT
* 2018-02-11 mr.fturi@gmail.com added SIM908 geopos simulator and basic SdDisk device simulator
*/
const wpi = require('wiring-pi');
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;
//const BME280 = require('bme280-sensor');
const SIM908 = require('sim908-sensor');
const SDCARD = require('SdCard-device');

const SIM908_OPTION = {
  i2cBusNo: 1, // defaults to 1
  i2cAddress: SIM908.SIM908_DEFAULT_I2C_ADDRESS() // defaults to 0x77
};

const SDCARD_OPTION = {
  i2cBusNo: 2, // defaults to 1
  i2cAddress: SDCARD.SDCARD_DEFAULT_I2C_ADDRESS() // defaults to 0x77
};

// fturi begin : Azure MQTTP device 
const connectionString = 'HostName=DataBoxHub.azure-devices.net;DeviceId=DataBoxDevice;SharedAccessKey=QNhUokaBq0FoSYAoCalyQD+tP2yl6CPGbR6kCL0oMy4=';
// fturi end : Azure MQTTP device
const LEDPin = 4;

var sendingMessage = false;
var messageId = 0;
var client,sensor,device;
var blinkLEDTimeout = null;

function getMessage(cb) {
  messageId++;
  //console.log("#inf reading sensor data"+messageId);
  sensor.readSensorData()
    .then(function (data) {
	var _client=
		(
			(data.latitude >=  45.4930 && data.latitude <=  45.4950)
		&&
			(data.longitude >= -73.7640 && data.longitude <= -73.7240)
		);
	var _azure=
		(
			(data.latitude >=  45.5100 && data.latitude <=  45.5120)
		&&
			(data.longitude >= -73.5770 && data.longitude <= -73.5370)
		);
  _status=sensor.getState();
	if (_client  && 2==_status)
	  sensor.setState(_status=3);
	if (_azure && 5==_status)
	  sensor.setState(_status=6);
	var _travelling=(!_client && !_azure);
	//console.log("#inf travelling="+_travelling);
	var _myJsonMsg=JSON.stringify({
        messageId: messageId,
        deviceId: 'DataBoxDevice',
		// fturi begin: add SIM908 data collection begin
        latitude: data.latitude,
        longitude: data.longitude,
        client:_client,
        azure:_azure,
        status:_status
      });
    //console.log("#inf myJsonMsg="+_myJsonMsg);
    cb(_myJsonMsg, _travelling);
		// fturi end : add SIM908 data collection 
    })
    .catch(function (err) {
      console.error('# KO_ Failed to read out sensor data: ' + err);
    });
}

function sendMessage() {
  if (!sendingMessage) { return; }

  getMessage(function (content, travellingAlert) {
    var message = new Message(content);
    message.properties.add('travellingAlert', travellingAlert.toString());
    //console.log('Sending message: ' + content);
    client.sendEvent(message, function (err) {
      if (err) {
        console.error('# KO_ cb:Failed to send message to Azure IoT Hub');
      } else {
	  
      	  //fturi disable blinking
      	  if (travellingAlert)
      		{
        		blinkLED();
        		//console.log("#inf cb:travelling!");
      		}
      	  //console.log('#inf cb:Message sent to Azure IoT Hub');
      }
    });
  });
}


function upload_azure(){
  device.downloadFile().then(function(payload)
    {
    console.log("payload is"+payload+"data="+payload.data);
    console.log("payload name"+payload.data.originalname);
    var myJsonMsg=JSON.stringify({
          messageId: messageId++,
          deviceId: 'DataBoxDevice',
          azure:payload.data
        });
    console.log("file to upload is:"+myJsonMsg+",file is:"+payload.data.originalname);
    var message = new Message(myJsonMsg);
    message.properties.add('nature', 'dummy property');
    console.log('Sending message: ' + message);
    client.sendEvent(message, function (err) {
    if (err) {
          console.error('# KO_ cb:Failed to send message to Azure IoT Hub');
        }});
  })
    .catch(function (err) {
      console.error('# KO_ Failed to read out device data: ' + err);
    });
}


function onStart(request, response) {
  console.log('Try to invoke method start(' + request.payload + ')');
  sendingMessage = true;

  response.send(200, 'Successully start sending message to cloud', function (err) {
    if (err) {
      console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
    }
  });
}

function onStop(request, response) {
  console.log('Try to invoke method stop(' + request.payload + ')');
  sendingMessage = false;

  response.send(200, 'Successully stop sending message to cloud', function (err) {
    if (err) {
      console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
    }
  });
}

  function react(cmd){
  var status=sensor.getState();
  result="ok";
  
  switch (cmd){
	  case "order":
		  if (0===status)
			  {
			  status=1;
			  }
		  else
			  {
			  result="KO, your databox as already been ordered";
			  }
		  break;
	  case "ship":
	  	switch (status)
	  	{
	  	case 0:
	  		result="KO, you need to order a databox first";
	  		break;
	  	case 1:
	  	  status=2;
	  	  break;
	  	case 2:
	  	  result="war: your databox is already shipping";
	  	  break;
	  	default:
	  	  result="war: your databox is already there";
	  	}
	  	break;
	  case "fill":
	    status=3;
	  	switch (status)
	  	{
	  	case 3:
  	    status=4;
  	    break;
  	  case 4:
  	    break;
  	  default:
  	    result="KO: cannot fill your databox now";
	  	}
	  	break;
	  case "return":
	    if (4==status)
  	    status=5;
  	  else 
  	    result="KO:cannot ship your databox now";
  	   break;
	  case "upload":
	    if (1==1)
	    {
	      upload_azure();
  	    status=1;
	    }
  	  else 
  	    result="KO: cannot upload your files now";
  	   break;
	  default:
		  result="KO, cmd unknown["+cmd+"]";
  	}
  	/**/
  sensor.setState(status);
  return result+"("+status+")";
  }


//We hijack the receive message to use it for upload/download to SDcard
function receiveMessageCallback(msg) {
  console.log("msg");
  
  var message = msg.getData().toString('utf-8');
  //console.log('Receive FTURIdb message: ' + message);
  var json=JSON.parse(message);
  var cmd=json.cmd;
  console.log('order is: ' + cmd);
  if ("fill"==cmd)
    {
    console.log("file is"+json.file);
    console.log("filename"+json.file.originalname);
    console.log("file size"+json.file.size);
    device.uploadFile(json.file);
    }
  console.log("result: "+react(json.cmd));
  client.complete(msg, function () {
  
  //fturi add blinkLED when receiving message
  
  });
  /**/
}

function blinkLED() {
  // Light up LED for 500 ms
  if(blinkLEDTimeout) {
       clearTimeout(blinkLEDTimeout);
   }
  wpi.digitalWrite(LEDPin, 1);
  blinkLEDTimeout = setTimeout(function () {
    wpi.digitalWrite(LEDPin, 0);
  }, 500);
}

// set up wiring
wpi.setup('wpi');
wpi.pinMode(LEDPin, wpi.OUTPUT);
sensor = new SIM908(SIM908_OPTION);
sensor.init()
  .then(function () {    sendingMessage = true;
  })
  .catch(function (err) {
    console.error(err.message || err);
  });

 
device = new SDCARD(SDCARD_OPTION);
device.init()
  .then(function () {
    sendingMessage = true;
  })
  .catch(function (err) {
    console.error(err.message || err);
  });


// create a client
client = Client.fromConnectionString(connectionString, Protocol);

client.open(function (err) {
  if (err) {
    console.error('[IoT hub Client] Connect error: ' + err.message);
    return;
  }

  // set C2D and device method callback
  client.onDeviceMethod('start', onStart);
  client.onDeviceMethod('stop', onStop);
  client.on('message', receiveMessageCallback);
  setInterval(sendMessage, 2000);
});
