export function Uuids(items: { uuid: string }[]): string[] {
  return items.map((item) => {
    return item.uuid
  })
}
