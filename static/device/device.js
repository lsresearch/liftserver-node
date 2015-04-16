'use strict';

angular.module('myApp.device', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/device/:deviceid', {
    templateUrl: 'device/device.html',
    controller: 'DeviceCtrl'
  });
}])

.controller('DeviceCtrl', ['$scope', '$http', '$routeParams', '$location', '$timeout', '$rootScope', function($scope, $http, $routeParams, $location, $timeout, $rootScope) {

	$scope.currentDevice = $routeParams.deviceid

	$scope.deviceData = {};

	$scope.lastBrowserUpdate = "";

	$scope.metadata = {
		'devicetype': ''
	}

	var initial = true;

	$scope.actionData = {
		'profile': 'rgbLed',
		'action': 'setColor',
		'arguments': '{"red": 100, "green": 0, "blue": 0}'
	}

	$scope.sendCustomAction = function(){

		var data = {
			"jsonrpc": "2.0",
			"method": "CreateAct", 
			"params": { "profile": $scope.actionData.profile, "action": $scope.actionData.action, "arguments": angular.fromJson($scope.actionData.arguments) },
			"id": 1
		};

		$http.put('/device-api/rpc', data, {
			"headers": {
				"X-TC-Key": $scope.currentDevice,
				"X-TC-Transform": "json"
			}
		});

		$scope.actionData.profile = "";
		$scope.actionData.action = "";
		$scope.actionData.arguments = "{}";

	}

	$scope.sendAction = function(action){

		var actionKey = action;

		action = $scope.actions[action];

		var data = {
			"jsonrpc": "2.0",
			"method": "CreateAct",
			"params": {
				"profile": action.profile,
				"action": actionKey,
				"arguments": {}
			},
			"id": 1
		}

		for (var i=0;i<action.args.length;i++){
			data["params"]["arguments"][action.args[i].name] = action.args[i].value;
		}

		$http.put('/device-api/rpc', data, {
			"headers": {
				"X-TC-Key": $scope.currentDevice,
				"X-TC-Transform": "json"
			}
		});

		for (var i=0;i<action.args.length;i++){
			action.args[i].value = "";
		}

	}

	$scope.saveMetaData = function(){

		var data = {
			"id": $scope.currentDevice,
			"deviceType": $scope.metadata.devicetype
		}

		$http.put('/app-api/updatedevice', data).then(function(){
			$scope.refreshDevice(false);
			$scope.refreshActions();
		});

	}

	$scope.refreshDeviceTypes = function(){

		$http.get('/app-api/devicetypes').then(function(resp){
			$rootScope.deviceTypes = resp.data.devicetypes;
			console.log($rootScope.deviceTypes);
			$scope.refreshActions();
		})

	}

	$scope.refreshDeviceTypes();

	$scope.purgeActions = function(){

		$http.put('/app-api/purgeactions', {
			'id': $scope.currentDevice
		}).then(function(resp){
			$scope.refreshDevice(false);
		})

	}

	$scope.refreshDevice = function(timeout){

		if (typeof timeout === "undefined") timeout = true;

		$http.get('/app-api/device/'+$scope.currentDevice).then(function(resp){
			$scope.deviceData = resp.data.device;

			$scope.lastBrowserUpdate = Date.now();

			if (initial){
				$scope.metadata.devicetype = $scope.deviceData.deviceType;
				$scope.refreshActions();
				initial = false;
			}

			if (timeout){
				$timeout($scope.refreshDevice, 5000);
			}else{
				$scope.refreshActions();
			}

		});

	}

	$scope.refreshDevice();

	$scope.actions = {};

	$scope.refreshActions = function(){
		$scope.actions = {};
		if (typeof $rootScope.deviceTypes !== "undefined" && typeof $scope.deviceData.deviceType !== "undefined" && typeof $rootScope.deviceTypes[$scope.deviceData.deviceType] !== "undefined"){

			var deviceType = $rootScope.deviceTypes[$scope.deviceData.deviceType];

			for (var profileIdx=0;profileIdx<deviceType.profileList.length;profileIdx++){

				var profile = deviceType.profileList[profileIdx];

				for (var actionIdx=0;actionIdx<profile.actionList.length;actionIdx++){

					var action = profile.actionList[actionIdx];

					var adding = {
						'name': action.metaData.name,
						'args': [],
						'profile': profile.varName
					};

					for (var argI=0;argI<action.paramsList.length;argI++){

						var arg = action.paramsList[argI];

						adding.args.push({
							'name': arg.varName,
							'value': ''
						});

					}

					$scope.actions[action.varName] = adding;

				}
			}

		}

		console.log($scope.actions);

	}

	$scope.goBack = function(){
		$location.path("/deviceBrowser");
	}

}]);