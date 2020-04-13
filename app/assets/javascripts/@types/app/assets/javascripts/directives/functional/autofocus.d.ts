export declare function autofocus($timeout: ng.ITimeoutService): {
    restrict: string;
    scope: {
        shouldFocus: string;
    };
    link: ($scope: import("angular").IScope, $element: JQLite) => void;
};
