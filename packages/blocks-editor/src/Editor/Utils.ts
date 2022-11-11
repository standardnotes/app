export function truncateString(string: string, limit: number) {
  if (string.length <= limit) {
    return string;
  } else {
    return string.substring(0, limit) + '...';
  }
}
