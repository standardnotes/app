export function isDeinitable(service: unknown): service is { deinit(): void } {
  if (!service) {
    throw new Error('Service is undefined')
  }
  return typeof (service as { deinit(): void }).deinit === 'function'
}
