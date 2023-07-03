import { SNTag } from '@standardnotes/snjs'
import { action, makeAutoObservable, observable } from 'mobx'
import { WebApplication } from '../../Application/WebApplication'

export class TagsCountsState {
  public counts: { [uuid: string]: number } = {}

  public constructor(private application: WebApplication) {
    makeAutoObservable(this, {
      counts: observable.ref,
      update: action,
    })
  }

  public update(tags: SNTag[]) {
    const newCounts: { [uuid: string]: number } = Object.assign({}, this.counts)

    tags.forEach((tag) => {
      newCounts[tag.uuid] = this.application.items.countableNotesForTag(tag)
    })

    this.counts = newCounts
  }
}
