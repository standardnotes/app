import { addIfUnique, removeFromArray } from '../Utils/Utils'

/**
 * Maps a UUID to an array of UUIDS to establish either direct or inverse
 * relationships between UUID strings (represantative of items or payloads).
 */
export class UuidMap {
  /** uuid to uuids that we have a relationship with */
  private directMap: Map<string, string[]> = new Map()
  /** uuid to uuids that have a relationship with us */
  private inverseMap: Map<string, string[]> = new Map()

  public get directMapSize(): number {
    return this.directMap.size
  }

  public get inverseMapSize(): number {
    return this.inverseMap.size
  }

  public makeCopy(): UuidMap {
    const copy = new UuidMap()
    copy.directMap = new Map(this.directMap)
    copy.inverseMap = new Map(this.inverseMap)
    return copy
  }

  public existsInDirectMap(uuid: string): boolean {
    return this.directMap.has(uuid)
  }

  public existsInInverseMap(uuid: string): boolean {
    return this.inverseMap.has(uuid)
  }

  public getDirectRelationships(uuid: string): string[] {
    return this.directMap.get(uuid) || []
  }

  public getAllDirectKeys(): string[] {
    return Array.from(this.directMap.keys())
  }

  public getInverseRelationships(uuid: string): string[] {
    return this.inverseMap.get(uuid) || []
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
    const previousDirect = this.directMap.get(uuid) || []
    this.directMap.set(uuid, relationships)

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
    const directReferences = this.directMap.get(uuid) || []
    for (const directReference of directReferences) {
      removeFromArray(this.inverseMap.get(directReference) || [], uuid)
    }
    this.directMap.delete(uuid)

    /** Items that are referencing us */
    const inverseReferences = this.inverseMap.get(uuid) || []
    for (const inverseReference of inverseReferences) {
      removeFromArray(this.directMap.get(inverseReference) || [], uuid)
    }
    this.inverseMap.delete(uuid)
  }

  private establishDirectRelationship(uuidA: string, uuidB: string): void {
    const index = this.directMap.get(uuidA) || []
    addIfUnique(index, uuidB)
    this.directMap.set(uuidA, index)
  }

  private establishInverseRelationship(uuidA: string, uuidB: string): void {
    const inverseIndex = this.inverseMap.get(uuidB) || []
    addIfUnique(inverseIndex, uuidA)
    this.inverseMap.set(uuidB, inverseIndex)
  }

  private deestablishDirectRelationship(uuidA: string, uuidB: string): void {
    const index = this.directMap.get(uuidA) || []
    removeFromArray(index, uuidB)
    this.directMap.set(uuidA, index)
  }

  private deestablishInverseRelationship(uuidA: string, uuidB: string): void {
    const inverseIndex = this.inverseMap.get(uuidB) || []
    removeFromArray(inverseIndex, uuidA)
    this.inverseMap.set(uuidB, inverseIndex)
  }
}
