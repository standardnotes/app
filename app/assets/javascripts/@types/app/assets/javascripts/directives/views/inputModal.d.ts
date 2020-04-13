import { WebDirective } from './../../types';
export interface InputModalScope extends Partial<ng.IScope> {
    type: string;
    title: string;
    message: string;
    callback: (value: string) => void;
}
export declare class InputModal extends WebDirective {
    constructor();
}
