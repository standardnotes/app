import { WebApplication } from '@/Application/Application'
import { CompoundPredicateBuilderController } from '@/Components/SmartViewBuilder/CompoundPredicateBuilderController'
import { predicateFromJson } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class AddSmartViewModalController {
  isAddingSmartView = false
  isSaving = false

  title = ''

  icon = 'restore'

  predicateController = new CompoundPredicateBuilderController()

  constructor(private application: WebApplication) {
    makeObservable(this, {
      isAddingSmartView: observable,
      setIsAddingSmartView: action,

      isSaving: observable,
      setIsSaving: action,

      title: observable,
      setTitle: action,

      icon: observable,
      setIcon: action,
    })
  }

  setIsAddingSmartView = (isAddingSmartView: boolean) => {
    this.isAddingSmartView = isAddingSmartView
  }

  setIsSaving = (isSaving: boolean) => {
    this.isSaving = isSaving
  }

  setTitle = (title: string) => {
    this.title = title
  }

  setIcon = (icon: string) => {
    this.icon = icon
  }

  closeModal = () => {
    this.setIsAddingSmartView(false)
    this.setTitle('')
    this.setIcon('')
    this.setIsSaving(false)
    this.predicateController.resetState()
  }

  saveCurrentSmartView = async () => {
    this.setIsSaving(true)

    if (!this.title) {
      this.setIsSaving(false)
      return
    }

    const predicate = predicateFromJson(this.predicateController.toJson())
    await this.application.items.createSmartView(this.title, predicate, this.icon)

    this.setIsSaving(false)
    this.closeModal()
  }
}
