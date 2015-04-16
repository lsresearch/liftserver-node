/*
 liftlib.js
 LiftServer - Node.js

 Created by mkremer@lsr.com on 4/16/14
 Copyright (C) 2015 LSR

 This source file is licensed under the terms of The MIT License
 See LICENSE for details
*/

var transforms = {}

require("fs").readdirSync("./lifttransforms").forEach(function(file) {
  transforms[file.replace('.js','')] = require("./lifttransforms/" + file);
});

module.exports.getTransform = function(req, defaultT){

	if (typeof defaultT === "undefined") defaultT = false;

	var check = req.get('X-TC-Transform');

	if (typeof check != "undefined"){
		if (check in transforms){
			return {
				'err': false,
				'transform': transforms[check]
			}
		}else{
			return {
				err: true,
				c: 2003,
				errMsg: "Transform doesn't exist."
			};
		}
	}else{
		if (defaultT){
			return {
				'err': false,
				'transform': transforms[defaultT]
			}
		}else{
			return {
				err: true,
				c: 2003,
				errMsg: "No transform sent."
			};
		}
	}

}

module.exports.getAccessKey = function(req){
	var check = req.get('X-TC-Key');

	if (typeof check === "undefined"){
		return {
			err: true,
			c: 2000,
			errMsg: 'No access key sent.'
		}
	}else{
		return {
			err: false,
			key: req.get('X-TC-Key')
		}
	}

}

module.exports.LiftLib = function(storage, debug){

	var ret = {
		'debug': function(m){
			if (typeof debug !== "undefined"){
				debug.output(m);
			}
		},
		'rpc': function(key, data){

			var resp = {
				"jsonrpc": "2.0",
				"id": data.id,
				"result": {}
			};

			if ("params" in data){
				if ("aID" in data.params && data.params.aID != ""){
					console.log(data.params);
					storage.ackAct(key, data.params.aID);
				}
			}

			if ("method" in data){

				if (data.method == "SetAtts"){
					for (var profile in data.params){
						if (profile != "aID"){
							for (var att in data.params[profile]){
								storage.setAtt(key, profile, att, data.params[profile][att]);
							}
						}
					}
				}

				if (data.method == "GetAtts"){
					if ("params" in data){
						for (var profile in data.params){
							if (profile != "aID"){
								resp.result[profile] = {};
								for (var i=0;i<data.params[profile].length;i++){
									var check = storage.getAtt(key, profile, data.params[profile][i]);
									if (check.err == false){
										resp.result[profile][data.params[profile][i]] = check.value;
									}else{
										ret.debug("Att not found");
										ret.debug(check);
									}
								}
							}
						}
					}else{
						resp.result = storage.getAllAtts(key);
					}
				}

				if (data.method == "GetAct"){
					console.log("GETTING ACT");
					var check = storage.getNextAct(key);
					if (check.err == false){
						resp.result.aID = check.value.aID;
						resp.result.action = check.value;
						delete resp.result.action.aID;
						console.log(JSON.stringify(resp));
					}else{
						ret.debug("No Action Found");
						ret.debug(check);
					}
				}

				if (data.method == "CreateAct"){
					storage.createAct(key, data.params.profile, data.params.action, data.params.arguments);
				}

			}

			resp.result.aCnt = storage.getActCount(key);

			return resp;

		}
	}

	return ret;

}