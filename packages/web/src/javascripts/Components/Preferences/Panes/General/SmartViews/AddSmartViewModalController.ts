import { WebApplication } from '@/Application/Application'
import { PredicateCompoundOperator, predicateFromJson, PredicateJsonForm } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class AddSmartViewModalController {
  isAddingSmartView = false
  isSaving = false

  title = ''

  icon = 'restore'

  predicate: PredicateJsonForm = {
    keypath: '',
    operator: '!=',
    value: '',
  }

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

      predicate: observable,
      setPredicate: action,
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

  setPredicate = (predicate: Partial<PredicateJsonForm>) => {
    this.predicate = {
      ...this.predicate,
      ...predicate,
    }
  }

  createCompoundPredicateFromCurrentPredicate = (operator: PredicateCompoundOperator) => {
    const currentPredicate = { ...this.predicate }
    this.setPredicate({
      keypath: undefined,
      operator,
      value: [
        currentPredicate,
        {
          keypath: '',
          operator: '!=',
          value: '',
        },
      ],
    })
  }

  closeModal = () => {
    this.setIsAddingSmartView(false)
    this.setTitle('')
    this.setIcon('')
  }

  saveCurrentSmartView = async () => {
    this.setIsSaving(true)

    const predicate = predicateFromJson(this.predicate)
    await this.application.items.createSmartView(this.title, predicate, this.icon)

    this.setIsSaving(false)
    this.closeModal()
  }
}
