/// <reference types="angular" />
export declare function delayHide($timeout: ng.ITimeoutService): {
    restrict: string;
    scope: {
        show: string;
        delay: string;
    };
    link: (scope: ng.IScope, elem: JQLite) => void;
};
