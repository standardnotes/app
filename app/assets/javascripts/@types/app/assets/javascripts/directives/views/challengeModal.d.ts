/// <reference types="pug" />
export class ChallengeModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof ChallengeModalCtrl;
    controllerAs: string;
    bindToController: {
        challenge: string;
        orchestrator: string;
        application: string;
    };
}
declare class ChallengeModalCtrl {
    constructor($element: any, $timeout: any);
    $element: any;
    processingTypes: any[];
    $onInit(): void;
    deinit(): void;
    application: any;
    orchestrator: any;
    challenge: any;
    reloadProcessingStatus(): void;
    promptForChallenge(challenge: any): "Enter your application passcode" | "Enter your account password";
    cancel(): void;
    onTextValueChange(challenge: any): void;
    validate(): boolean;
    submit(): Promise<void>;
    dismiss(): void;
}
export {};
