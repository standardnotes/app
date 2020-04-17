import { SNComponent, ComponentArea, removeFromArray, addIfUnique } from 'snjs';
import { WebApplication } from './application';
import { UuidString } from '@/../../../../snjs/dist/@types/types';

/** Areas that only allow a single component to be active */
const SingleComponentAreas = [
  ComponentArea.Editor,
  ComponentArea.NoteTags,
  ComponentArea.TagsList
]

export class ComponentGroup {

  private application: WebApplication
  changeObservers: any[] = []
  activeComponents: UuidString[] = []

  constructor(application: WebApplication) {
    this.application = application;
  }

  get componentManager() {
    return this.application?.componentManager!;
  }

  public deinit() {
    (this.application as any) = undefined;
  }

  async activateComponent(component: SNComponent) {
    if (this.activeComponents.includes(component.uuid)) {
      return;
    }
    if (SingleComponentAreas.includes(component.area)) {
      const currentActive = this.activeComponentForArea(component.area);
      if (currentActive) {
        await this.deactivateComponent(currentActive, false);
      }
    }
    addIfUnique(this.activeComponents, component.uuid);
    await this.componentManager.activateComponent(component.uuid);
    this.notifyObservers();
  }

  async deactivateComponent(component: SNComponent, notify = true) {
    if (!this.activeComponents.includes(component.uuid)) {
      return;
    }
    removeFromArray(this.activeComponents, component.uuid);
    /** If this function is called as part of global application deinit (locking),
     * componentManager can be destroyed. In this case, it's harmless to not take any 
     * action since the componentManager will be destroyed, and the component will 
     * essentially be deregistered. */
    if(this.componentManager) {
      await this.componentManager.deactivateComponent(component.uuid);
      if(notify) {
        this.notifyObservers();
      }
    }
  }

  async deactivateComponentForArea(area: ComponentArea) {
    const component = this.activeComponentForArea(area);
    if (component) {
      return this.deactivateComponent(component);
    }
  }

  activeComponentForArea(area: ComponentArea) {
    return this.activeComponentsForArea(area)[0];
  }

  activeComponentsForArea(area: ComponentArea) {
    return this.allActiveComponents().filter((c) => c.area === area);
  }

  allComponentsForArea(area: ComponentArea) {
    return this.componentManager.componentsForArea(area);
  }

  private allActiveComponents() {
    return this.application.getAll(this.activeComponents) as SNComponent[];
  }


  /**
   * Notifies observer when the active editor has changed.
   */
  public addChangeObserver(callback: () => void) {
    this.changeObservers.push(callback);
    callback();
    return () => {
      removeFromArray(this.changeObservers, callback);
    }
  }

  private notifyObservers() {
    for (const observer of this.changeObservers) {
      observer();
    }
  }
}