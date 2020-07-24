/// <reference types="angular" />
export declare function fileChange(): {
    restrict: string;
    scope: {
        handler: string;
    };
    link: (scope: import("angular").IScope, element: JQLite) => void;
};
