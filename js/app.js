var app = angular.module('app', ['ngRoute']);
/*
var socket = io.connect();

socket.on("connect", function () {
	console.log('client socket e bağlandı.');
});
*/
app.config(function ($routeProvider) {
	$routeProvider
		.when("/", {
			controller: "UserController",
			templateUrl: "views/user.html"
		})
		.when("/user-list", {
			controller: "ChatController",
			templateUrl: "views/user_list.html"
		})
		.when("/chat/:id", {
			controller: "ChatController",
			templateUrl: "views/chat.html"
		});
}).factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});

var nodeUrl = 'http://localhost:8080';
var loginUser = {};
app.controller('ChatController', function ($scope, $http, $location, $routeParams, $q, socket) {
	$scope.users = [];
	$scope.messages = [];
	$scope.loginUserId = loginUser.id;
	$scope.messagingUser = $routeParams.id;
	$scope.asdf = 0;

//	$scope.getMessageHistory($scope.loginUserId, $routeParams.id);
	$scope.getUserList = function () {
		$http.get('user').success(function (data) {
			console.log('kullanıcı listesi');
			console.log(data);
			$scope.users = data;
		});
	};

	$scope.getMessageHistory = function(sender, receiver){
		var deferred = $q.defer();
		$http.post('message', {sender:sender, receiver:receiver}).success(function (data) {
			$scope.messages = data;
			$scope.asdf = 1;
			console.log(data);
			console.log($scope.messages);
			deferred.resolve($scope.messages);
		});
		return deferred.promise;
	};

	$scope.startChat = function (userId) {
console.log('qqqqq');

		$scope.getMessageHistory(loginUser.id, userId).then(function(data){
			console.log(data);
			console.log('fffff');
			console.log(userId);
			console.log(loginUser);
			$scope.messages = data;
			$location.path('/chat/' + userId);
		});

	};

	$scope.sendMessage = function() {
		var msg = {sender:loginUser.id, receiver:$routeParams.id, message: $scope.message};
		socket.emit("message:send", msg, function (data) {});
		$scope.message = '';
	};

	$scope.setMessagingHash = function(sender, receiver){
		return sender > receiver ? sender + receiver : receiver + sender;
	};

	socket.on("message:publish", function(data){
		console.log('client message:publish', data);
		if((loginUser.id == data.sender && $routeParams.id == data.receiver) || (loginUser.id == data.receiver && $routeParams.id == data.sender)){
			$scope.messages.unshift(data);
			console.log('mesaj görüntülenecek');
		}


	});
});


app.controller('UserController', function ($scope, $http, $location, socket) {
	$scope.login = {};
	$scope.addUser = function () {
		if ($scope.email != '') {
			$http.post('user/add', {email: $scope.email}).success(function (data) {
				console.log('kişi post edildi..');
				$scope.login = {id: data.id, email: data.email} || {};
				loginUser = $scope.login;

				$location.path('/user-list');
			});
		}
	};
});