/// <reference types="angular" />
export declare function fileChange(): {
    restrict: string;
    scope: {
        handler: string;
    };
    link: (scope: ng.IScope, element: JQLite) => void;
};
