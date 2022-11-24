export type ChangelogVersion = {
  version: string | null
  title: string
  date: string | null
  body: string
  parsed: Record<string, string[]>
}

export interface Changelog {
  title: string
  description: string
  versions: Array<ChangelogVersion>
}
