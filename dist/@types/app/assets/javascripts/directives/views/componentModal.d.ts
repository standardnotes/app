/// <reference types="angular" />
import { WebApplication } from '@/ui_models/application';
import { SNComponent, LiveItem } from 'snjs';
import { WebDirective } from './../../types';
export declare type ComponentModalScope = {
    componentUuid: string;
    onDismiss: () => void;
    application: WebApplication;
};
export declare class ComponentModalCtrl implements ComponentModalScope {
    $element: JQLite;
    componentUuid: string;
    onDismiss: () => void;
    application: WebApplication;
    liveComponent: LiveItem<SNComponent>;
    component: SNComponent;
    constructor($element: JQLite);
    $onInit(): void;
    $onDestroy(): void;
    dismiss(): void;
}
export declare class ComponentModal extends WebDirective {
    constructor();
}
