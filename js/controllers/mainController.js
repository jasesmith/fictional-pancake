(function($angular, $moment, Hammer) {
    'use strict';

    $angular.module('app')

    .controller('mainController', ['$scope', function($scope) {
      $scope.date = null; //$moment().add(1, 'day').startOf('day'); //.add(1, 'day');

      var calendarClick = function(date){
        console.log('caendar action clicked!', date);
        window.alert('Pancake says:\n\nload an actual calendar\nselect: ' + date.format('MMM D, YYYY'));
      };

      $scope.config = {
        useWeekendAlert: false,
        allowBeforeToday: false,
        calendarAction: calendarClick,
        text: {
          diff: 0,
          today: 'today',
          date: '',
          day: '',
          when: ''
        }
      };

      $scope.setDate = {
        month: $moment().month(),
        day: $moment().date(),
        year: $moment().year()
      };

      $scope.$watch('setDate', function(d){
        // console.log(d);
        $scope.$broadcast('set:date', $moment([d.year, d.month, d.day]));
      }, true);

      $scope.format = function(datetime) {
        return new Date(datetime);
      };

      $scope.reset = function(date) {
        $scope.$broadcast('reset:date', date);
      };
    }])

    .directive('tap', [function() {
      return function(scope, element, attr) {
        var hammerTap = new Hammer(element[0], {});
        hammerTap.on('tap', function() {
          scope.$apply(function() {
            scope.$eval(attr.tap);
          });
        });
      };
    }])

    .directive('calendarDial', ['UiHelpers', function(ui) {
      var _rotate = function(el, degrees, shift) {
        var translate = shift ? 'translate(-50%, -50%) ' : '';
        $angular.element(el).css({
          transform: translate + 'rotate(' + degrees + 'deg)'
        });
      };

      var _getDayByDegree = function(max, d, s){
        var i = max - Math.floor(Math.abs(d + s/2)/s);
        var k = (i === 0 ? max : (max - i < 1 ? 1 : (max - i > max ? max : max - i)));
        return k;
      };

      var _getDegreeByDay = function(max, day){
        return (ui.maxDegrees/max * day);
      };

      return {
        restrict: 'E',
        replace: true,

        scope: {
          date: '=?',
          config: '=?'
        },

        template: '' +
        '<div class="calendar-dial bezel" ng-class="setClasses()">' +
        '<div class="lcd">' +
        '<div class="day">{{config.text.day}}</div>' +
        '<div class="when">{{config.text.when}}</div>' +
        // '<div class="date">{{config.text.date}}</div>' +
        '</div>' +
        '<div ng-if="config.calendarAction" tap="config.calendarAction(date)" class="icon calendar-action fa fa-calendar-o"></div>' +
        '<div ng-if="config.useWeekendAlert" class="icon weekend-alert fa fa-exclamation-circle"></div>' +
        '<div class="crown today"><span><span data-title="{{config.text.today}}"></span></span></div>' +
        '<div class="crown step"><span>{{config.text.diff}}</span></div>' +
        '</div>' +
        '',

        link: function(scope, element) {
          // if (!scope.date) {
          // 	scope.date = $moment().startOf('day'); // current date
          // }

          var max = 31; //scope.date.daysInMonth();

          scope.format = function(datetime) {
            return new Date(datetime);
          };

          var step = $angular.element(element[0].querySelector('.step'));
          var lcd = $angular.element(element[0].querySelector('.lcd'));

          var day = {
            deg: 0,
            max: max,
            step: ui.maxDegrees/max,
            element: step,
            handle: $angular.element(element[0].querySelector('.step > span')),
            canvas: element
          };

          var key = {
            deg: 0,
            max: max,
            step: ui.maxDegrees/max,
            element: $angular.element(element[0].querySelector('.today')),
            handle: $angular.element(element[0].querySelector('.today > span')),
            label: $angular.element(element[0].querySelector('.today > span span')),
            canvas: element
          };

          var _setDayTypes = function(date){
            scope.weekday = date.isoWeekday();
            scope.weekend = (scope.weekday === 6 || scope.weekday === 7);
          };

          var _setDisplay = function(date, mode){
            var diff = date.diff(scope.today, 'days');
            var f1 = scope.thisYear !== date.year() ? 'MMMM D, YYYY' : 'MMMM D';
            var f2 = 'ddd, MMM D';
            return {
              diff: (diff > 0 ? '+' + diff : diff),
              today: (Math.abs(diff) > 1 ? 'today':''),
              when: (diff === 0 || diff === 1) ? date.format(f2) : date.fromNow(), //(scope.today),
              date: date.format(f1),
              day: date.calendar(scope.today, {
                lastWeek: f2,
                lastDay: '[Yesterday]',
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: f2,
                sameElse: f2
              })
            };
          };

          var init = function(reset) {
            if(!scope.date || reset) {
              scope.isPast = false;
              scope.date = $moment().add(1, 'day').startOf('day'); // set to today + 1 day
              // bypass weekends
              if(scope.config.useWeekendAlert) {
                if(scope.date.isoWeekday() === 6) {
                  scope.date.add(1, 'day');
                }
                if(scope.date.isoWeekday() === 7) {
                  scope.date.add(1, 'day');
                }
              }
            }
            _setDayTypes(scope.date);
            scope.today = $moment().startOf('day');
            scope.thisYear = scope.today.year();
            var initKey = _getDegreeByDay(max, scope.today.date());
            key.deg = initKey;
            _rotate(key.element[0], initKey);
            var initDay = _getDegreeByDay(max, scope.date.date());
            day.deg = initDay;
            _rotate(day.element[0], initDay);
            _rotate(day.handle[0], -initDay, true);
            scope.config.text = _setDisplay(scope.date, 'date');
          };

          var prek, input, n, k, dim, diff=0, deg=0, lastDeg=0, pointerDeg, relativeDeg, rotationDeg;

          var start = function(e, max, handle){
            n = ui.maxDegrees/max;
            input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers;
            deg = ui.getDegrees(input[0], element[0]);
            lastDeg = handle.deg;
          };

          var pan = function(e){
            input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers;
            pointerDeg = ui.getDegrees(input[0], element[0]);
            relativeDeg = pointerDeg - deg;
            rotationDeg = lastDeg + relativeDeg;
            rotationDeg = isNaN(rotationDeg) ? lastDeg : rotationDeg;
            rotationDeg = rotationDeg <= 0 ? ui.maxDegrees-Math.abs(rotationDeg) : rotationDeg;
            rotationDeg = rotationDeg >= ui.maxDegrees ? rotationDeg-ui.maxDegrees :  rotationDeg;
            deg = pointerDeg;
            lastDeg = rotationDeg;
          };

          // hammer time
          scope.touching = false;
          var hammerStep = new Hammer(day.canvas[0]);
          var hammerLcd = new Hammer(lcd[0], {});
          hammerStep.get('pan').set({direction: Hammer.DIRECTION_ALL, threshold: 0});
          hammerStep.on('panstart', function(e) {
            scope.touching = e.srcEvent && e.srcEvent.changedTouches ? true : false;
            scope.active = true;
            start(e, max, day);
          })
          .on('pan panmove', function(e) {
            pan(e);

            prek = k;
            dim = scope.date.daysInMonth();
            k = _getDayByDegree(dim, rotationDeg, n);

            diff = scope.date.diff(scope.today, 'days');
            scope.isPast = (diff < 0);

            if(k && prek && prek !== k) {
              if(prek === 1 && k > 2) {
                //prev month
                scope.date = scope.date.subtract(1, 'month');
                k = scope.date.daysInMonth();
                // k = dim;
              }

              else if(k === 1 && prek > 2) {
                // next month
                scope.date.add(1, 'month');
                dim = scope.date.daysInMonth();
              }
              scope.date.date(k);
            }

            _rotate(day.element[0], rotationDeg);
            _rotate(day.handle[0], -rotationDeg, true);

            scope.config.text = _setDisplay(scope.date);
            _setDayTypes(scope.date);

            scope.$apply();
          })
          .on('panend pancancel', function() {
            scope.touching = false;
            scope.active = false;
            if(scope.isPast && !scope.config.allowBeforeToday) {
              k = scope.today.date();
              scope.date = $moment(scope.today); // clone today to reset past date
              scope.config.text = _setDisplay(scope.date);
              _setDayTypes(scope.date);
              scope.isPast = false;
            }
            day.deg = k*n;
            _rotate(day.element[0], day.deg);
            _rotate(day.handle[0], -day.deg, true);
            scope.$apply();
          });

          scope.setClasses  = function(){
            var classes = [];
            if(scope.weekday) {classes.push('weekday-' + scope.weekday);}
            if(scope.isPast && !scope.config.allowBeforeToday) {classes.push('is-past');}
            if(scope.active) {classes.push('active');}
            if(scope.touching) {classes.push('touch');}
            if(scope.config.useWeekendAlert && scope.weekend) {classes.push('is-weekend');}
            if(scope.config.calendarAction) {classes.push('has-calendar');}
            return classes.join(' ');
          };

          init();

          scope.$on('reset:date', function(date){
            if(date) {
              scope.date = $moment(date);
            }
            init(true);
          });

          // scope.$on('set:date', function(date){
          // 	scope.date = $moment(date);
          // 	init();
          // });
        }
      };
    }])

    .factory('UiHelpers', [function(){
      var maxDegrees = 360;
      var maxRadians = 6.283185307179586;

      // helpers
      var _getNumbers = function(target){
        var numbers = {};
        if(target) {
          numbers = {
            t: target.offsetTop,
            r: target.offsetLeft + target.offsetWidth,
            b: target.offsetTop + target.offsetHeight,
            l: target.offsetLeft,
            w: target.offsetWidth,
            h: target.offsetHeight,
          };
          // find x|y center
          numbers.cx = (numbers.l + (numbers.w/2));
          numbers.cy = (numbers.t + (numbers.h/2));
        }
        return numbers;
      };

      var _getRadians = function(input, el){
        var metrics = _getNumbers(el);
        var radians = Math.atan2((input.clientY - metrics.cy), (input.clientX - metrics.cx));
        radians += maxRadians/4;
        if(radians < 0) {
          radians += maxRadians;
        }
        return radians;
      };

      var _getDegrees = function(input, el){
        var radians = _getRadians(input, el);
        var degree = radians * 180/Math.PI;
        return degree;
      };

      return {
        maxRadians: maxRadians,
        maxDegrees: maxDegrees,
        getNumbers: _getNumbers,
        getRadians: _getRadians,
        getDegrees: _getDegrees
      };
    }])
    ;

})(window.angular, window.moment, window.Hammer);
