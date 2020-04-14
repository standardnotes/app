/// <reference types="angular" />
import { WebApplication } from '@/ui_models/application';
import { SNComponent } from 'snjs';
import { WebDirective } from './../../types';
declare type ComponentModalScope = {
    component: SNComponent;
    callback: () => void;
    onDismiss: (component: SNComponent) => void;
    application: WebApplication;
};
export declare class ComponentModalCtrl implements ComponentModalScope {
    $element: JQLite;
    component: SNComponent;
    callback: () => void;
    onDismiss: (component: SNComponent) => void;
    application: WebApplication;
    constructor($element: JQLite);
    dismiss(): void;
}
export declare class ComponentModal extends WebDirective {
    constructor();
}
export {};
