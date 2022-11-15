import { WebApplication } from '@/Application/Application'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { predicateFromJson, PredicateJsonForm, SmartView, TagMutator } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class EditSmartViewModalController {
  title = ''
  icon = 'restore'
  predicateJson = ''
  isPredicateJsonValid = false
  isSaving = false
  view: SmartView | undefined = undefined

  constructor(private application: WebApplication, private navigationController: NavigationController) {
    makeObservable(this, {
      title: observable,
      icon: observable,
      predicateJson: observable,
      isPredicateJsonValid: observable,
      isSaving: observable,
      view: observable,

      setTitle: action,
      setIcon: action,
      setPredicateJson: action,
      setIsPredicateJsonValid: action,
      setIsSaving: action,
      setView: action,
    })
  }

  setTitle = (title: string) => {
    this.title = title
  }

  setIcon = (icon: string) => {
    this.icon = icon
  }

  setPredicateJson = (json: string) => {
    this.predicateJson = json
  }

  setIsPredicateJsonValid = (isValid: boolean) => {
    this.isPredicateJsonValid = isValid
  }

  setView = (view: SmartView | undefined) => {
    this.view = view

    if (view) {
      this.setTitle(view.title)
      this.setIcon(view.iconString)
      this.setPredicateJson(JSON.stringify(view.predicate.toJson(), null, 2))
      this.setIsPredicateJsonValid(true)
    }
  }

  setIsSaving = (isSaving: boolean) => {
    this.isSaving = isSaving
  }

  closeDialog = () => {
    this.setView(undefined)
    this.setTitle('')
    this.setIcon('restore')
    this.setPredicateJson('')
  }

  save = async () => {
    if (!this.view) {
      return
    }

    this.validateAndPrettifyCustomPredicate()

    if (!this.isPredicateJsonValid) {
      return
    }

    this.setIsSaving(true)

    await this.application.mutator.changeAndSaveItem<TagMutator>(this.view, (mutator) => {
      mutator.title = this.title
      mutator.iconString = this.icon || 'restore'
    })

    this.setIsSaving(false)
    this.closeDialog()
  }

  deleteView = () => {
    if (!this.view) {
      return
    }

    void this.navigationController.remove(this.view, true)
    this.closeDialog()
  }

  validateAndPrettifyCustomPredicate = () => {
    try {
      const parsedPredicate: PredicateJsonForm = JSON.parse(this.predicateJson)
      const predicate = predicateFromJson(parsedPredicate)

      if (predicate) {
        this.setPredicateJson(JSON.stringify(parsedPredicate, null, 2))
        this.setIsPredicateJsonValid(true)
      } else {
        this.setIsPredicateJsonValid(false)
      }
    } catch (error) {
      this.setIsPredicateJsonValid(false)
      return
    }
  }
}
