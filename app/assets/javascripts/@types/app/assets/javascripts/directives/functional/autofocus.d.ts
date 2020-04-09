export function autofocus($timeout: any): {
    restrict: string;
    scope: {
        shouldFocus: string;
    };
    link: ($scope: any, $element: any) => void;
};
