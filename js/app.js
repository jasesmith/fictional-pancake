(function($angular) {
    'use strict';

    $angular
    .module('app', [
        'jamfu',
        'ui.router'
    ])
    .controller('appController', ['$scope', 'StorageService', function($scope, storage) {

        $scope.headline = 'Fictional Pancake';
        $scope.icon = 'calendar-o';

    }]);

})(window.angular);
