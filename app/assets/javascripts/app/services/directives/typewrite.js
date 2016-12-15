/**
 * AngularJS directive that simulates the effect of typing on a text editor - with a blinking cursor.
 * This directive works as an attribute to any HTML element, and it changes the speed/delay of its animation.
 *
 * There's also a simple less file included for basic styling of the dialog, which can be overridden.
 * The config object also lets the user define custom CSS classes for the modal.
 *
 *  How to use:
 *
 *  Just add the desired text to the 'text' attribute of the element and the directive takes care of the rest.
 *  The 'text' attribute can be a single string or an array of string. In case an array is passed, the string
 *  on each index is erased so the next item can be printed. When the last index is reached, that string stays
 *  on the screen. (So if you want to erase the last string, just push an empty string to the end of the array)
 *
 * These are the optional preferences:
 *  - initial delay: set an 'initial-delay' attribute for the element
 *  - type delay: set a 'type-delay' attribute for the element
 *  - erase delay: set a 'erase-delay' attribute for the element
 *  - specify cursor : set a 'cursor' attribute for the element, specifying which cursor to use
 *  - turn off cursor blinking: set the 'blink-cursor' attribute  to "false"
 *  - cursor blinking speed: set a 'blink-delay' attribute for the element
 *  - scope callback: pass the desired scope callback as the 'callback-fn' attribute of the element
 *
 * Note:
 * Each time/delay value should be set either on seconds (1s) or milliseconds (1000)
 *
 * Dependencies:
 * The directive needs the css file provided in order to replicate the cursor blinking effect.
 */


angular
    .module('app.frontend').directive('typewrite', ['$timeout', function ($timeout) {
        function linkFunction($scope, $element, $attrs) {
            var timer = null,
                initialDelay = $attrs.initialDelay ? getTypeDelay($attrs.initialDelay) : 200,
                typeDelay = $attrs.typeDelay || 200,
                eraseDelay = $attrs.eraseDelay || typeDelay / 2,
                blinkDelay = $attrs.blinkDelay ? getAnimationDelay($attrs.blinkDelay) : false,
                cursor = $attrs.cursor || '|',
                blinkCursor = typeof $attrs.blinkCursor !== 'undefined' ? $attrs.blinkCursor === 'true' : true,
                currentText,
                textArray,
                running,
                auxStyle;



            if ($scope.text) {
                if ($scope.text instanceof Array) {
                    textArray = $scope.text;
                    currentText = textArray[0];
                } else {
                    currentText = $scope.text;
                }
            }
            if (typeof $scope.start === 'undefined' || $scope.start) {
                typewrite();
            }

            function typewrite() {
                timer = $timeout(function () {
                    updateIt($element, 0, 0, currentText);
                }, initialDelay);
            }

            function updateIt(element, charIndex, arrIndex, text) {
                if (charIndex <= text.length) {
                    updateValue(element, text.substring(0, charIndex) + cursor);
                    charIndex++;
                    timer = $timeout(function () {
                        updateIt(element, charIndex, arrIndex, text);
                    }, typeDelay);
                    return;
                } else {
                    charIndex--;

                    if($scope.iterationCallback) {
                      $scope.iterationCallback()(arrIndex);
                    }

                    // check if it's an array
                    if (textArray && arrIndex < textArray.length - 1) {
                        timer = $timeout(function () {
                            cleanAndRestart(element, charIndex, arrIndex, textArray[arrIndex]);
                        }, $scope.iterationDelay);
                    } else {
                        if ($scope.callbackFn) {
                            $scope.callbackFn();
                        }
                        blinkIt(element, charIndex, currentText);
                    }
                }
            }

            function blinkIt(element, charIndex) {
                var text = element.text().substring(0, element.text().length - 1);
                if (blinkCursor) {
                    if (blinkDelay) {
                        auxStyle = '-webkit-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-moz-animation:blink-it steps(1) ' + blinkDelay + ' infinite ' +
                            '-ms-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-o-animation:blink-it steps(1) ' + blinkDelay + ' infinite; ' +
                            'animation:blink-it steps(1) ' + blinkDelay + ' infinite;';
                        updateValue(element, text.substring(0, charIndex) + '<span class="blink" style="' + auxStyle + '">' + cursor + '</span>');
                    } else {
                        updateValue(element, text.substring(0, charIndex) + '<span class="blink">' + cursor + '</span>');
                    }
                } else {
                    updateValue(element, text.substring(0, charIndex));
                }
            }

            function cleanAndRestart(element, charIndex, arrIndex, currentText) {
              if(charIndex == 0) {
                if($scope.prebeginFn) {
                  $scope.prebeginFn()();
                }
              }
                if (charIndex > 0) {
                    currentText = currentText.slice(0, -1);
                    // element.html(currentText.substring(0, currentText.length - 1) + cursor);
                    updateValue(element, currentText + cursor);
                    charIndex--;
                    timer = $timeout(function () {
                        cleanAndRestart(element, charIndex, arrIndex, currentText);
                    }, eraseDelay);
                    return;
                } else {
                    arrIndex++;
                    currentText = textArray[arrIndex];
                    timer = $timeout(function () {
                        updateIt(element, 0, arrIndex, currentText);
                    }, typeDelay);
                }
            }

            function getTypeDelay(delay) {
                if (typeof delay === 'string') {
                    return delay.charAt(delay.length - 1) === 's' ? parseInt(delay.substring(0, delay.length - 1), 10) * 1000 : +delay;
                } else {
                    return false;
                }
            }

            function getAnimationDelay(delay) {
                if (typeof delay === 'string') {
                    return delay.charAt(delay.length - 1) === 's' ? delay : parseInt(delay.substring(0, delay.length - 1), 10) / 1000;
                }
            }

            function updateValue(element, value) {
                if (element.prop('nodeName').toUpperCase() === 'INPUT') {
                    return element.val(value);
                }
                return element.html(value);
            }

            $scope.$on('$destroy', function () {
                if (timer) {
                    $timeout.cancel(timer);
                }
            });

            $scope.$watch('start', function (newVal) {
                if (!running && newVal) {
                    running = !running;
                    typewrite();
                }
            });

            $scope.$watch('text', function (newVal, oldVal) {
              if(!(newVal instanceof Array)) {
                currentText = newVal;
                typewrite();
              }
            });
        }

        return {
            restrict: 'A',
            link: linkFunction,
            replace: true,
            scope: {
                text: '=',
                callbackFn: '&',
                iterationCallback: '&',
                iterationDelay: '=',
                prebeginFn: '&',
                start: '='
            }
        };

    }]);
