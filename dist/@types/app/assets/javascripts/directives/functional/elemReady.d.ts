/// <reference types="angular" />
export declare function elemReady($parse: ng.IParseService): {
    restrict: string;
    link: ($scope: ng.IScope, elem: JQLite, attrs: any) => void;
};
