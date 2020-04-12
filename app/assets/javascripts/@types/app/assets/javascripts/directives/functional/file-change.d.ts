export function fileChange(): {
    restrict: string;
    scope: {
        handler: string;
    };
    link: (scope: any, element: any) => void;
};
