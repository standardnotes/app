export class MenuRow {
    restrict: string;
    transclude: boolean;
    template: any;
    controller: typeof MenuRowCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        action: string;
        buttonAction: string;
        buttonClass: string;
        buttonText: string;
        desc: string;
        disabled: string;
        circle: string;
        circleAlign: string;
        faded: string;
        hasButton: string;
        label: string;
        spinnerClass: string;
        stylekitClass: string;
        subRows: string;
        subtitle: string;
    };
}
declare class MenuRowCtrl {
    onClick($event: any): void;
    clickAccessoryButton($event: any): void;
}
export {};
