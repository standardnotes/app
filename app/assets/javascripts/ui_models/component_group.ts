import { dictToArray } from '../utils';
import { SNComponent, ComponentArea, removeFromArray } from 'snjs';
import { WebApplication } from './application';

/** Areas that only allow a single component to be active */
const SingleComponentAreas = [
  ComponentArea.Editor,
  ComponentArea.NoteTags,
  ComponentArea.TagsList
]

export class ComponentGroup {

  private application: WebApplication
  changeObservers: any[] = []
  activeComponents: Partial<Record<string, SNComponent>> = {}
  

  constructor(application: WebApplication) {
    this.application = application;
  }

  get componentManager() {
    return this.application.componentManager!;
  }

  public deinit() {
    (this.application as any) = undefined;
    for (const component of this.allActiveComponents()) {
      this.componentManager.deregisterComponent(component);
    }
  }

  async activateComponent(component: SNComponent) {
    if (this.activeComponents[component.uuid]) {
      return;
    }
    if (SingleComponentAreas.includes(component.area)) {
      const currentActive = this.activeComponentForArea(component.area);
      if (currentActive) {
        await this.deactivateComponent(currentActive, false);
      }
    }
    this.activeComponents[component.uuid] = component;
    await this.componentManager.activateComponent(component);
    this.notifyObservers();
  }

  async deactivateComponent(component: SNComponent, notify = true) {
    if (!this.activeComponents[component.uuid]) {
      return;
    }
    delete this.activeComponents[component.uuid];
    await this.componentManager.deactivateComponent(component);
    if(notify) {
      this.notifyObservers();
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
    const all = dictToArray(this.activeComponents);
    return all.filter((c) => c.area === area);
  }

  allComponentsForArea(area: ComponentArea) {
    return this.componentManager.componentsForArea(area);
  }

  private allActiveComponents() {
    return dictToArray(this.activeComponents);
  }


  /**
   * Notifies observer when the active editor has changed.
   */
  public addChangeObserver(callback: () => void) {
    this.changeObservers.push(callback);
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