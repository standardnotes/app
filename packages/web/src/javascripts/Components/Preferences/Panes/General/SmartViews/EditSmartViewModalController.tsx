import { WebApplication } from '@/Application/WebApplication'
import { STRING_DELETE_TAG } from '@/Constants/Strings'
import {
  predicateFromJson,
  PredicateJsonForm,
  SmartView,
  SmartViewDefaultIconName,
  SmartViewMutator,
  VectorIconNameOrEmoji,
} from '@standardnotes/snjs'
import { confirmDialog } from '@standardnotes/ui-services'
import { action, makeObservable, observable } from 'mobx'

export class EditSmartViewModalController {
  title = ''
  icon: VectorIconNameOrEmoji = SmartViewDefaultIconName
  predicateJson = ''
  isPredicateJsonValid = false
  isSaving = false
  view: SmartView | undefined = undefined

  constructor(private application: WebApplication) {
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

  setIcon = (icon: VectorIconNameOrEmoji) => {
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
    this.setIcon(SmartViewDefaultIconName)
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

    await this.application.changeAndSaveItem.execute<SmartViewMutator>(this.view, (mutator) => {
      mutator.title = this.title
      mutator.iconString = (this.icon as string) || SmartViewDefaultIconName
      mutator.predicate = JSON.parse(this.predicateJson) as PredicateJsonForm
    })

    this.setIsSaving(false)
    this.closeDialog()
  }

  deleteView = async () => {
    if (!this.view) {
      return
    }
    const view = this.view

    this.closeDialog()

    const shouldDelete = await confirmDialog({
      text: STRING_DELETE_TAG,
      confirmButtonStyle: 'danger',
    })
    if (shouldDelete) {
      this.application.mutator
        .deleteItem(view)
        .then(() => this.application.sync.sync())
        .catch(console.error)
    }
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
