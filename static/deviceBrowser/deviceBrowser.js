'use strict';

angular.module('myApp.deviceBrowser', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/deviceBrowser', {
    templateUrl: 'deviceBrowser/deviceBrowser.html',
    controller: 'DeviceBrowserCtrl'
  });
}])

.controller('DeviceBrowserCtrl', ['$scope', '$http', '$location', '$rootScope', '$timeout', function($scope, $http, $location, $rootScope, $timeout) {

	$scope.refreshDevices = function(){

		$http.get('/app-api/devices').then(function(resp){
			$scope.devices = resp.data.devices;
		})
		
		$timeout($scope.refreshDevices, 10000);

	}

	$scope.refreshDevices();

	$scope.refreshDeviceTypes = function(){

		$http.get('/app-api/devicetypes').then(function(resp){
			$rootScope.deviceTypes = resp.data.devicetypes;
			console.log($rootScope.deviceTypes);
		})

	}

	$scope.refreshDeviceTypes();

	$scope.openDevice = function(did){

		$location.path("/device/"+did);

	}

	$scope.newDeviceType = {
		'json': ''
	}

	$scope.addDeviceType = function(){

		var realData = angular.fromJson($scope.newDeviceType.json);

		$http.put('/app-api/devicetype', {
			'name': realData.varName,
			'json': realData
		}).then(function(){
			$scope.refreshDeviceTypes();
		});

		$scope.newDeviceType.name = "";
		$scope.newDeviceType.json = "";

	}

	$scope.deleteDeviceType = function(dtid){

		$http.put('/app-api/deletedevicetype', {
			'id': dtid
		}).then(function(){
			$scope.refreshDeviceTypes();
		});

	}

}]);