import { WebApplication } from '@/Application/WebApplication'
import { CompoundPredicateBuilderController } from '@/Components/SmartViewBuilder/CompoundPredicateBuilderController'
import {
  predicateFromJson,
  PredicateJsonForm,
  SmartViewDefaultIconName,
  VectorIconNameOrEmoji,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class AddSmartViewModalController {
  isAddingSmartView = false
  isSaving = false

  title = ''

  icon: VectorIconNameOrEmoji = SmartViewDefaultIconName

  predicateController = new CompoundPredicateBuilderController()

  customPredicateJson: string | undefined = undefined
  isCustomJsonValidPredicate: boolean | undefined = undefined

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

      customPredicateJson: observable,
      isCustomJsonValidPredicate: observable,
      setCustomPredicateJson: action,
      setIsCustomJsonValidPredicate: action,
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

  setIcon = (icon: VectorIconNameOrEmoji) => {
    this.icon = icon
  }

  setCustomPredicateJson = (customPredicateJson: string) => {
    this.customPredicateJson = customPredicateJson
  }

  setIsCustomJsonValidPredicate = (isCustomJsonValidPredicate: boolean | undefined) => {
    this.isCustomJsonValidPredicate = isCustomJsonValidPredicate
  }

  closeModal = () => {
    this.setIsAddingSmartView(false)
    this.setTitle('')
    this.setIcon('')
    this.setIsSaving(false)
    this.predicateController.resetState()
    this.setCustomPredicateJson('')
    this.setIsCustomJsonValidPredicate(undefined)
  }

  saveCurrentSmartView = async () => {
    this.setIsSaving(true)

    if (!this.title) {
      this.setIsSaving(false)
      return
    }

    const predicateJson =
      this.customPredicateJson && this.isCustomJsonValidPredicate
        ? JSON.parse(this.customPredicateJson)
        : this.predicateController.toJson()
    const predicate = predicateFromJson(predicateJson as PredicateJsonForm)

    await this.application.mutator.createSmartView({
      title: this.title,
      predicate,
      iconString: this.icon as string,
      vault: this.application.vaultDisplayService.exclusivelyShownVault,
    })

    this.setIsSaving(false)
    this.closeModal()
  }

  validateAndPrettifyCustomPredicate = () => {
    if (!this.customPredicateJson) {
      this.setIsCustomJsonValidPredicate(false)
      return
    }

    try {
      const parsedPredicate: PredicateJsonForm = JSON.parse(this.customPredicateJson)
      const predicate = predicateFromJson(parsedPredicate)

      if (predicate) {
        this.setCustomPredicateJson(JSON.stringify(parsedPredicate, null, 2))
        this.setIsCustomJsonValidPredicate(true)
      } else {
        this.setIsCustomJsonValidPredicate(false)
      }
    } catch (error) {
      this.setIsCustomJsonValidPredicate(false)
      return
    }
  }
}
