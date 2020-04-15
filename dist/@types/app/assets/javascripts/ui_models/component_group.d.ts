import { SNComponent, ComponentArea } from 'snjs';
import { WebApplication } from './application';
export declare class ComponentGroup {
    private application;
    changeObservers: any[];
    activeComponents: Partial<Record<string, SNComponent>>;
    constructor(application: WebApplication);
    get componentManager(): import("../../../../../snjs/dist/@types").SNComponentManager;
    deinit(): void;
    registerComponentHandler(): void;
    activateComponent(component: SNComponent): Promise<void>;
    deactivateComponent(component: SNComponent): Promise<void>;
    deactivateComponentForArea(area: ComponentArea): Promise<void>;
    activeComponentForArea(area: ComponentArea): SNComponent;
    activeComponentsForArea(area: ComponentArea): SNComponent[];
    allComponentsForArea(area: ComponentArea): SNComponent[];
    private allActiveComponents;
    /**
     * Notifies observer when the active editor has changed.
     */
    addChangeObserver(callback: any): void;
    private notifyObservers;
}
