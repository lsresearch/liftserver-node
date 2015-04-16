module.exports.load = function(value, url){
	return value.body;
}

module.exports.dump = function(value, url){
	return value;
}

module.exports.makeResponse = function(res, value, url){
	res.json(value);
}