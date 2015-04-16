var express = require('express'),
http = require('http'),
https = require('https'),
liftlib = require('./liftlib'),
fileSys = require('./liftstorage/fileSys'),
consoleDebug = require('./liftdebuggers/console'),
app = express(),
bodyParser = require('body-parser'),
config = require('./config');

var storage = fileSys.Storage(config.settings.database.directory);
var lift = liftlib.LiftLib(storage, consoleDebug.Debugger);

app.use(express.static('static'));

app.use(bodyParser.json());

var debugRoute = function(req, res){
	console.log("DEBUG");
	console.log(req.data);
	res.json({
		'debug': 'gotit'
	});
}

app.post('/device-api/debug', debugRoute);
app.put('/device-api/debug', debugRoute);

app.put('/device-api/rpc', function(req, res){

	var transformResp = liftlib.getTransform(req, 'json');
	if (transformResp.err){
		res.json(transformResp);
	}else{
		transform = transformResp.transform;
		keyResp = liftlib.getAccessKey(req);
		if (keyResp.err){
			data = transform.load(req, 'rpc');
			if ('method' in data){
				console.log("SENDING AUTH INFO");
				transform.makeResponse(res, {"jsonrpc": "2.0", 
					"result":{
						"deviceId": req.body.params.deviceId,
						"registrationPin": "1234",
			 			"deviceKey": req.body.params.deviceId, 
						"deviceSecret": "1234"
					},
					"id": data["id"]
				}, 'rpc');
			}else{
				transform.makeResponse(res, keyResp, 'rpc');
			}
		}else{
			var key = keyResp.key;
			var data = transform.load(req, 'rpc');
			rpcResp = lift.rpc(key, data);
			transform.makeResponse(res, rpcResp, 'rpc');
		}
	}

});

app.get('/app-api/devices', function(req, res){
	res.json({
		'devices': storage.getDevices().value
	});
});

app.get("/app-api/device/:deviceid", function(req, res){
	res.json({
		'device': storage.readDevice(req.params.deviceid)
	});
});

app.put("/app-api/devicetype", function(req, res){
	res.json({
		'data': storage.addDeviceType(req.body.name, req.body.json)
	});
});

app.get('/app-api/devicetypes', function(req, res){
	res.json({
		'devicetypes': storage.getDeviceTypes()
	});
});

app.put("/app-api/deletedevicetype", function(req, res){
	res.json({
		'data': storage.deleteDeviceType(req.body.id)
	});
});

app.put("/app-api/updatedevice", function(req, res){
	res.json({
		'data': storage.updateDevice(req.body)
	});
});

app.put("/app-api/purgeactions", function(req, res){
	res.json({
		'data': storage.purgeAllAct(req.body.id)
	});
});

var server = app.listen(config.settings.server.port, function(){
	console.log('Listening on port %d', server.address().port);
});