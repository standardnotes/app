export function isDeinitable(service: unknown): service is { deinit(): void } {
  if (!service) {
    throw new Error('Service is undefined')
  }
  return typeof (service as { deinit(): void }).deinit === 'function'
}

export function canBlockDeinit(service: unknown): service is { blockDeinit(): Promise<void> } {
  if (!service) {
    throw new Error('Service is undefined')
  }

  return typeof (service as { blockDeinit(): Promise<void> }).blockDeinit === 'function'
}
