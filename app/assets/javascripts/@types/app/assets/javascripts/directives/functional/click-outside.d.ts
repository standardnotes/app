export function clickOutside($document: any): {
    restrict: string;
    replace: boolean;
    link: ($scope: any, $element: any, attrs: any) => void;
};
