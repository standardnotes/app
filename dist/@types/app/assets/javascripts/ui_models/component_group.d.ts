import { SNComponent, ComponentArea } from 'snjs';
import { WebApplication } from './application';
import { UuidString } from 'snjs/dist/@types/types';
export declare class ComponentGroup {
    private application;
    changeObservers: any[];
    activeComponents: UuidString[];
    constructor(application: WebApplication);
    get componentManager(): import("snjs/dist/@types").SNComponentManager;
    deinit(): void;
    activateComponent(component: SNComponent): Promise<void>;
    deactivateComponent(component: SNComponent, notify?: boolean): Promise<void>;
    deactivateComponentForArea(area: ComponentArea): Promise<void>;
    activeComponentForArea(area: ComponentArea): SNComponent;
    activeComponentsForArea(area: ComponentArea): SNComponent[];
    allComponentsForArea(area: ComponentArea): SNComponent[];
    private allActiveComponents;
    /**
     * Notifies observer when the active editor has changed.
     */
    addChangeObserver(callback: () => void): () => void;
    private notifyObservers;
}
