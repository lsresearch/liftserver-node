var fs = require('fs'),
mkdirp = require('mkdirp');

module.exports.Storage = function(root){

	function ensureDir(d){
		if (!fs.existsSync(root+d)){
			mkdirp.sync(root+d);
		}
	}

	ensureDir('devicetypes');

	var ret = {
		'getDevices': function(){
			var filesAndFolders = fs.readdirSync(root);
			var devices = [];

			for (var i=0;i<filesAndFolders.length;i++){
				if (filesAndFolders[i].indexOf(".json")>-1){
					devices.push(filesAndFolders[i].replace(".json",""));
				}
			}

			return {
				'err': false,
				'value': devices
			}
		},
		'readDevice': function(accessKey){
			if (!fs.existsSync(root+accessKey+'.json')){
				return {"attributes": {}, "actions": [], "onAction": 0};
			}
			var v = fs.readFileSync(root+accessKey+'.json', 'utf8');
			if (v==""){
				return {"attributes": {}, "actions": [], "onAction": 0};
			}
			return JSON.parse(v);
		},
		'writeDevice': function(accessKey, value, checkin){
			if (typeof checkin === "undefined") checkin = false;
			if (checkin){
				value.lastSeen = Date.now();
			}
			fs.writeFileSync(root+accessKey+'.json', JSON.stringify(value));
		},
		'ensureProfile': function(data, profile){
			if (!(profile in data.attributes)){
				data.attributes[profile] = {};
			}
			return data;
		},
		'setAtt': function(accessKey, profile, att, value, timestamp){
			if (typeof timestamp === "undefined") timestamp = Date.now();
			var data = ret.readDevice(accessKey);
			data = ret.ensureProfile(data, profile);
			data.attributes[profile][att] = value;
			fs.writeFileSync(root+accessKey+'.'+profile+'.'+att+'.log', '['+timestamp+'] '+value+'\n');
			ret.writeDevice(accessKey, data, true);
		},
		'getAtt': function(accessKey, profile, att){
			var data = ret.readDevice(accessKey);
			data = ret.ensureProfile(data,profile);
			if (att in data.attributes[profile]){
				return {
					'err': false,
					'value': data.attributes[profile][att]
				}
			}else{
				return {
					'err': true
				}
			}
		},
		'getAllAtts': function(accessKey){
			var data = ret.readDevice(accessKey);
			return data.attributes;
		},
		'createAct': function(accessKey, profile, actionName, arguments){
			var data = ret.readDevice(accessKey);
			var action = {
				'aID': data.onAction
			}
			action[profile] = {};
			action[profile][actionName] = arguments;
			data.onAction = data.onAction + 1;
			data.actions.push(action);
			ret.writeDevice(accessKey, data);
		},
		'getNextAct': function(accessKey){
			var data = ret.readDevice(accessKey);
			if (data.actions.length !== 0){
				return {
					'err': false,
					'value': data.actions[0]
				}
			}else{
				return {
					'err': true
				}
			}
		},
		'ackAct': function(accessKey, aID){
			console.log("ACKING", aID);
			var data = ret.readDevice(accessKey);
			if (aID == "force" || aID == "FORCE"){
				if (data.actions.length>0){
					data.actions.splice(0,1);
				}
			}else{
				for (var i=0;i<data.actions.length;i++){
					if (data.actions[i].aID == aID){
						data.actions.splice(i,1);
						break;
					}
				}
			}
			ret.writeDevice(accessKey, data);
		},
		'purgeAllAct': function(){
			var data = ret.readDevice(accessKey);
			data.actions = [];
			ret.writeDevice(accessKey, data);
			return {
				'success': true
			}
		},
		'getActCount': function(accessKey){
			data = ret.readDevice(accessKey);
			return data.actions.length;
		},
		'addDeviceType': function(name, data){
			fs.writeFileSync(root+'devicetypes/'+name+'.json', JSON.stringify(data));
			return {
				'success': true
			}
		},
		'getDeviceTypes': function(){
			var filesAndFolders = fs.readdirSync(root+'devicetypes');
			var devices = [];

			for (var i=0;i<filesAndFolders.length;i++){
				if (filesAndFolders[i].indexOf(".json")>-1){
					devices.push(filesAndFolders[i].replace(".json",""));
				}
			}

			console.log(devices);

			var retDevices = {};

			for (var i=0;i<devices.length;i++){
				var device = devices[i];
				retDevices[device] = JSON.parse(fs.readFileSync(root+"devicetypes/"+device+".json", "utf8"));
			}
			return retDevices;
		},
		'deleteDeviceType': function(name){
			fs.unlinkSync(root+'devicetypes/'+name+'.json');
			return {
				'success': true
			}
		},
		'updateDevice': function(data){
			var id = data.id;
			deviceType = data.deviceType;
			var device = ret.readDevice(id);
			device.deviceType = deviceType;
			ret.writeDevice(id, device);
			return {
				'success': true
			}
		}
	}

	return ret;

}