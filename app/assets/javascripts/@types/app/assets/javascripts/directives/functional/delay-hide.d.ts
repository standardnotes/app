export function delayHide($timeout: any): {
    restrict: string;
    scope: {
        show: string;
        delay: string;
    };
    link: (scope: any, elem: any, attrs: any) => void;
};
