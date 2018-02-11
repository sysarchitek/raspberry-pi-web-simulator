
class SDCARD {

	
	constructor() {
	console.log("SDCARD constructor");
    this.uploadFile = this.uploadFile.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.init = this.init.bind(this);
  }

  init(option) {
    this.inited = true;

    // add new class variable following exactly _inited and this.inited
    /* looks like that variable must be initated here */
    this.data=0;


    return new Promise(function (resolve/*, reject*/) {
      resolve();
    });
  }

  reset() {
    return new Promise(function (resolve/*, reject */) {
      resolve();
    });
  }

  downloadFile() {
//https://stackoverflow.com/questions/29734312/javascript-access-parent-object-attribute
	    console.log("my inside downloadFile");
    var _inited = this.inited;
    var _data = this.data;

	//return, so last instruction to be executed
	return new Promise(function (resolve, reject) {
      if (!_inited) {
        return reject('You must first call SDCARD.init()');
      }
      resolve({data:_data});
    });
  }

  uploadFile(_data) {
	//https://stackoverflow.com/questions/29734312/javascript-access-parent-object-attribute
		    console.log("my inside uploadFile");
	    var _inited = this.inited;
	    this.data=_data ;

		//return, so last instruction to be executed
		return new Promise(function (resolve, reject) {
	      if (!_inited) {
	        return reject('You must first call SDCARD.init()');
	      }
	      resolve({
	        size:length(_data)
	      });
	    });
	  }

  static SDCARD_DEFAULT_I2C_ADDRESS() {
    return 0x97;
  }

  static CHIP_ID1_SDCARD() {
    return 0x166;
  }

  static CHIP_ID2_SDCARD() {
    return 0x167;
  }

  static CHIP_ID3_SDCARD() {
    return 0x168;
  }

  static CHIP_ID_SDCARD() {
    return 0x170;
  }


}
  
export default SDCARD;