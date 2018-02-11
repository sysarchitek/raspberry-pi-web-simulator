class SIM908  {
	
	
	constructor() {
    this.readSensorData = this.readSensorData.bind(this);
    this.init = this.init.bind(this);
    this.getState=this.getState.bind(this);
    this.setState=this.setState.bind(this);
  }




  init(option) {
    this.inited = true;
    //this.myconsole();

    // add new class variable following exactly _inited and this.inited
    /* looks like that variable must be initated here */
    this.time=0;
    this.tic=0;
    this.steps=25;
    this.tps=this.steps;
    this.wait=0;
    this.status=0;
    //this.status=3;

    return new Promise(function (resolve/*, reject*/) {
      resolve();
    });
  }

  reset() {
    return new Promise(function (resolve/*, reject */) {
      resolve();
    });
  }
  
  getState()
  {
	  return this.status;
  }
  setState(new_state)
  {
	  this.status=new_state;
  }

  readSensorData() {
//https://stackoverflow.com/questions/29734312/javascript-access-parent-object-attribute
	//this.myconsole.log("my inside read Sensor");
    var _inited = this.inited;

    // add new class variable following exactly _inited and this.inited
    var _time=this.time;
	var _tic=this.tic;
	var _tps=this.tps;
	var steps=this.steps;
	var _wait=this.wait;
	var isteps=0.001/steps;
	
	/* * /
	var _time=0;
	var _tic=1;
	var _tps=2;
	/**/
	// side effect must be done here and not into Promise lambda function
	if (_tps>steps || _tps==0)
	  {
      if (_wait++>20)
    	  {
    	  _wait=0;
    	  }
	  }
	if (this.status<66)
		_wait=1;
	switch (this.status)
	{
	case 0:
		_tic=1;_tps=steps;
		break;
	case 1:
		_tic=1;_tps=steps;
		break;
	case 2:
		_tic=1;_wait=0;
		break;
	case 3:
		_tic=1;
		break;
	case 4:
		_tic=1;
		break;
	case 5:
		_tic=0;_wait=0;
		break;
	case 6:
		_tic=0;
		break;
	}
    if (0==_wait)
	{
		if (_tic%2==0)
		  {
		  _tps++;
		  }
		else
		  {
		  _tps--;
		  }

    	if (_tps>steps || _tps<0)
		  {
		  if (_tic%2==0)
			  {
			  _tps=steps;
			  }
		  else
			  {
			  _tps=0;
			  }
		  if (66==this.status)
			  _tic++;
		  }
	}
   
  		
    /* * /
  	parent.time=_time;
	parent.tic=_tic;
	parent.tps=_tps;
    /* */
  	this.time=_time;
	this.tic=_tic;
	this.tps=_tps;
	this.wait=_wait;
	/**/

	//return, so last instruction to be executed
	return new Promise(function (resolve, reject) {
      if (!_inited) {
        return reject('You must first call sim908.init()');
      }
      resolve({
          /* * /
          temperature_C: BME280.random(20, 32),
          humidity: BME280.random(60, 80),
          pressure_hPa: BME280.random(10, 12)
    	  /**/
    	/* Client 275 Viger E:   45.511,73.557
    	 * Azure 4705 Dobrin :   45.494,73.744
    	 * Delta			.17	    .187 
    	 * 
    	 */
        latitude:   45.494+(_tps*17* 1*isteps),
        longitude: -73.744+(_tps*17*11*isteps)
        /**/
      });
    });
  }

  static SIM908_DEFAULT_I2C_ADDRESS() {
    return 0x87;
  }

  static CHIP_ID1_SIM908() {
    return 0x156;
  }

  static CHIP_ID2_SIM908() {
    return 0x157;
  }

  static CHIP_ID3_SIM908() {
    return 0x158;
  }

  static CHIP_ID_SIM908() {
    return 0x160;
  }

}

export default SIM908;