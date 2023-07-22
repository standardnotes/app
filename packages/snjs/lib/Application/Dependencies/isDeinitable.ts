export function isDeinitable(service: unknown): service is { deinit(): void } {
  return typeof (service as { deinit(): void }).deinit === 'function'
}
