import angular from 'angular';
export declare function delayHide($timeout: ng.ITimeoutService): {
    restrict: string;
    scope: {
        show: string;
        delay: string;
    };
    link: (scope: angular.IScope, elem: JQLite) => void;
};
