export class LockScreen {
    restrict: string;
    template: any;
    controller: typeof LockScreenCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        onValue: string;
        puppet: string;
    };
}
declare class LockScreenCtrl extends PureCtrl {
    constructor($timeout: any);
    formData: {};
    get passcodeInput(): HTMLElement | null;
    /** @override */
    onAppStateEvent(eventName: any, data: any): Promise<void>;
    submitPasscodeForm(): Promise<void>;
    forgotPasscode(): void;
    beginDeleteData(): void;
}
import { PureCtrl } from "./abstract/pure_ctrl";
export {};
