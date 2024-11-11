const BytesInOneMB = 1024 * 1024

export enum AutoDownloadLimit {
  TwoAndHalfMB = 2.5 * BytesInOneMB,
  FiveMB = 5 * BytesInOneMB,
  TenMB = 10 * BytesInOneMB,
  TwentyMB = 20 * BytesInOneMB,
  FiftyMB = 50 * BytesInOneMB,
}
