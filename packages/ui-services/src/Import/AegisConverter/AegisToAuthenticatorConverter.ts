type AegisData = {
  db: {
    entries: {
      issuer: string
      name: string
      info: {
        secret: string
      }
      note: string
    }[]
  }
}

type AuthenticatorEntry = {
  service: string
  account: string
  secret: string
  notes: string
}

export class AegisToAuthenticatorConverter {
  parse(data: string): AuthenticatorEntry[] | null {
    try {
      const json = JSON.parse(data) as AegisData
      const entries = json.db.entries.map((entry) => {
        return {
          service: entry.issuer,
          account: entry.name,
          secret: entry.info.secret,
          notes: entry.note,
        } as AuthenticatorEntry
      })
      return entries
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
