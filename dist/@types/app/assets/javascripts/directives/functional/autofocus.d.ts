/// <reference types="angular" />
export declare function autofocus($timeout: ng.ITimeoutService): {
    restrict: string;
    scope: {
        shouldFocus: string;
    };
    link: ($scope: ng.IScope, $element: JQLite) => void;
};
