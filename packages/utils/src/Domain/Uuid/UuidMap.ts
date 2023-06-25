import { addIfUnique, removeFromArray } from '../Utils/Utils'

/**
 * Maps a UUID to an array of UUIDS to establish either direct or inverse
 * relationships between UUID strings (represantative of items or payloads).
 */
export class UuidMap {
  /** uuid to uuids that we have a relationship with */
  private directMap: Partial<Record<string, string[]>> = {}
  /** uuid to uuids that have a relationship with us */
  private inverseMap: Partial<Record<string, string[]>> = {}

  public get directMapSize(): number {
    return Object.keys(this.directMap).length
  }

  public get inverseMapSize(): number {
    return Object.keys(this.inverseMap).length
  }

  public makeCopy(): UuidMap {
    const copy = new UuidMap()
    copy.directMap = Object.assign({}, this.directMap)
    copy.inverseMap = Object.assign({}, this.inverseMap)
    return copy
  }

  public getDirectRelationships(uuid: string): string[] {
    return this.directMap[uuid] || []
  }

  public getInverseRelationships(uuid: string): string[] {
    return this.inverseMap[uuid] || []
  }

  public establishRelationship(uuidA: string, uuidB: string): void {
    this.establishDirectRelationship(uuidA, uuidB)
    this.establishInverseRelationship(uuidA, uuidB)
  }

  public deestablishRelationship(uuidA: string, uuidB: string): void {
    this.deestablishDirectRelationship(uuidA, uuidB)
    this.deestablishInverseRelationship(uuidA, uuidB)
  }

  public setAllRelationships(uuid: string, relationships: string[]): void {
    const previousDirect = this.directMap[uuid] || []
    this.directMap[uuid] = relationships

    /** Remove all previous values in case relationships have changed
     * The updated references will be added afterwards.
     */
    for (const previousRelationship of previousDirect) {
      this.deestablishInverseRelationship(uuid, previousRelationship)
    }

    /** Now map current relationships */
    for (const newRelationship of relationships) {
      this.establishInverseRelationship(uuid, newRelationship)
    }
  }

  public removeFromMap(uuid: string): void {
    /** Items that we reference */
    const directReferences = this.directMap[uuid] || []
    for (const directReference of directReferences) {
      removeFromArray(this.inverseMap[directReference] || [], uuid)
    }
    delete this.directMap[uuid]

    /** Items that are referencing us */
    const inverseReferences = this.inverseMap[uuid] || []
    for (const inverseReference of inverseReferences) {
      removeFromArray(this.directMap[inverseReference] || [], uuid)
    }
    delete this.inverseMap[uuid]
  }

  private establishDirectRelationship(uuidA: string, uuidB: string): void {
    const index = this.directMap[uuidA] || []
    addIfUnique(index, uuidB)
    this.directMap[uuidA] = index
  }

  private establishInverseRelationship(uuidA: string, uuidB: string): void {
    const inverseIndex = this.inverseMap[uuidB] || []
    addIfUnique(inverseIndex, uuidA)
    this.inverseMap[uuidB] = inverseIndex
  }

  private deestablishDirectRelationship(uuidA: string, uuidB: string): void {
    const index = this.directMap[uuidA] || []
    removeFromArray(index, uuidB)
    this.directMap[uuidA] = index
  }

  private deestablishInverseRelationship(uuidA: string, uuidB: string): void {
    const inverseIndex = this.inverseMap[uuidB] || []
    removeFromArray(inverseIndex, uuidA)
    this.inverseMap[uuidB] = inverseIndex
  }
}
