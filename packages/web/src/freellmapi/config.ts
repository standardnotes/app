import { StorageServiceInterface, StorageValueModes } from '@standardnotes/snjs'

export interface FreeLlmApiConfig {
  enabled: boolean
  baseURL: string
  apiKey: string
  model: string
  customInstructions: string
  maxAgentSteps: number
  autoApplyEdits: boolean
  persistEncryptedSnapshots: boolean
  acknowledgedRemoteOrigin: string
}

export interface FreeLlmProviderPreset {
  id: string
  label: string
  baseURL: string
  model: string
  description: string
}

export interface EndpointPolicyResult {
  valid: boolean
  isLoopback: boolean
  isRemote: boolean
  origin?: string
  error?: string
  warning?: string
}

export const IMMUTABLE_OPERATION_LIMITS = Object.freeze({
  MAX_AGENT_STEPS_HARD_CAP: 10,
  MAX_WRITES_PER_TURN: 3,
  MAX_AUTO_EDITS_PER_TURN: 2,
  BULK_EDIT_CONFIRM_THRESHOLD: 2,
  MAX_SINGLE_EDIT_CHARS: 100_000,
})

const LEGACY_LOCAL_STORAGE_KEY = 'sn.freellmapi.config.v1'
export const SECURE_CONFIG_STORAGE_KEY = 'freellmapi_config_v1'

export const DEFAULT_FREE_LLM_API_CONFIG: FreeLlmApiConfig = {
  enabled: false,
  baseURL: 'http://localhost:3001/v1',
  apiKey: '',
  model: 'auto',
  customInstructions: '',
  maxAgentSteps: 6,
  autoApplyEdits: false,
  persistEncryptedSnapshots: false,
  acknowledgedRemoteOrigin: '',
}

export const FREE_LLM_PRESETS: FreeLlmProviderPreset[] = [
  {
    id: 'freellmapi-local',
    label: 'FreeLLM Local',
    baseURL: 'http://localhost:3001/v1',
    model: 'auto',
    description: 'Local FreeLLM API proxy on localhost:3001',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseURL: 'http://localhost:11434/v1',
    model: 'llama3.2',
    description: 'Local Ollama OpenAI-compatible server',
  },
  {
    id: 'lm-studio',
    label: 'LM Studio',
    baseURL: 'http://localhost:1234/v1',
    model: 'local-model',
    description: 'Local LM Studio API server',
  },
]

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase())
}

export function analyzeEndpointPolicy(baseURL: string): EndpointPolicyResult {
  const trimmed = baseURL.trim()
  if (!trimmed) {
    return {
      valid: false,
      isLoopback: false,
      isRemote: false,
      error: 'Base URL is required (e.g. http://localhost:3001/v1).',
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return {
      valid: false,
      isLoopback: false,
      isRemote: false,
      error: 'Base URL is not a valid URL.',
    }
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      isLoopback: false,
      isRemote: false,
      error: 'Do not embed credentials in Base URL. Use the API Key field instead.',
    }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      isLoopback: false,
      isRemote: false,
      error: 'Base URL must use http:// (localhost only) or https://.',
    }
  }

  const loopback = isLoopbackHostname(parsed.hostname)
  if (!loopback && parsed.protocol !== 'https:') {
    return {
      valid: false,
      isLoopback: false,
      isRemote: true,
      origin: parsed.origin,
      error: 'Remote (non-loopback) endpoints must use HTTPS (https://). Plain HTTP is only allowed for localhost.',
    }
  }

  if (!loopback) {
    return {
      valid: true,
      isLoopback: false,
      isRemote: true,
      origin: parsed.origin,
      warning: `Remote endpoint (${parsed.origin}): decrypted note text will leave this machine over HTTPS.`,
    }
  }

  return {
    valid: true,
    isLoopback: true,
    isRemote: false,
    origin: parsed.origin,
  }
}

export function validateFreeLlmApiConfig(config: FreeLlmApiConfig): string | undefined {
  const endpointPolicy = analyzeEndpointPolicy(config.baseURL)
  if (!endpointPolicy.valid) {
    return endpointPolicy.error
  }
  if (!config.model.trim()) {
    return 'Model name is required (e.g. auto).'
  }
  if (
    !Number.isFinite(config.maxAgentSteps) ||
    config.maxAgentSteps < 1 ||
    config.maxAgentSteps > IMMUTABLE_OPERATION_LIMITS.MAX_AGENT_STEPS_HARD_CAP
  ) {
    return `Max agent steps must be between 1 and ${IMMUTABLE_OPERATION_LIMITS.MAX_AGENT_STEPS_HARD_CAP}.`
  }
  return undefined
}

function normalizeConfig(parsed: Partial<FreeLlmApiConfig>): FreeLlmApiConfig {
  const maxCap = IMMUTABLE_OPERATION_LIMITS.MAX_AGENT_STEPS_HARD_CAP
  return {
    enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_FREE_LLM_API_CONFIG.enabled,
    baseURL:
      typeof parsed.baseURL === 'string' && parsed.baseURL.trim()
        ? parsed.baseURL.trim()
        : DEFAULT_FREE_LLM_API_CONFIG.baseURL,
    apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULT_FREE_LLM_API_CONFIG.apiKey,
    model:
      typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : DEFAULT_FREE_LLM_API_CONFIG.model,
    customInstructions:
      typeof parsed.customInstructions === 'string'
        ? parsed.customInstructions
        : DEFAULT_FREE_LLM_API_CONFIG.customInstructions,
    maxAgentSteps:
      typeof parsed.maxAgentSteps === 'number' && parsed.maxAgentSteps >= 1 && parsed.maxAgentSteps <= maxCap
        ? Math.round(parsed.maxAgentSteps)
        : DEFAULT_FREE_LLM_API_CONFIG.maxAgentSteps,
    autoApplyEdits:
      typeof parsed.autoApplyEdits === 'boolean' ? parsed.autoApplyEdits : DEFAULT_FREE_LLM_API_CONFIG.autoApplyEdits,
    persistEncryptedSnapshots:
      typeof parsed.persistEncryptedSnapshots === 'boolean'
        ? parsed.persistEncryptedSnapshots
        : DEFAULT_FREE_LLM_API_CONFIG.persistEncryptedSnapshots,
    acknowledgedRemoteOrigin:
      typeof parsed.acknowledgedRemoteOrigin === 'string'
        ? parsed.acknowledgedRemoteOrigin
        : DEFAULT_FREE_LLM_API_CONFIG.acknowledgedRemoteOrigin,
  }
}

function canUseSecureStorage(storage?: StorageServiceInterface): storage is StorageServiceInterface {
  if (!storage) {
    return false
  }
  try {
    return !storage.isStorageWrapped()
  } catch {
    return false
  }
}

function readLegacyLocalStorageConfig(): Partial<FreeLlmApiConfig> | undefined {
  try {
    const raw = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY)
    if (!raw) {
      return undefined
    }
    return JSON.parse(raw) as Partial<FreeLlmApiConfig>
  } catch {
    return undefined
  }
}

function purgeLegacyLocalStorageConfig(): void {
  try {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function loadFreeLlmApiConfig(storage?: StorageServiceInterface): FreeLlmApiConfig {
  if (canUseSecureStorage(storage)) {
    try {
      const stored = storage.getValue<Partial<FreeLlmApiConfig> | undefined>(
        SECURE_CONFIG_STORAGE_KEY,
        StorageValueModes.Default,
      )
      if (stored && typeof stored === 'object') {
        purgeLegacyLocalStorageConfig()
        return normalizeConfig(stored)
      }

      const legacy = readLegacyLocalStorageConfig()
      if (legacy) {
        const migrated = normalizeConfig(legacy)
        storage.setValue(SECURE_CONFIG_STORAGE_KEY, migrated, StorageValueModes.Default)
        purgeLegacyLocalStorageConfig()
        return migrated
      }
      return { ...DEFAULT_FREE_LLM_API_CONFIG }
    } catch {
      // Fall through to defaults if storage isn't ready yet
    }
  }

  const fallback = readLegacyLocalStorageConfig()
  return fallback ? normalizeConfig(fallback) : { ...DEFAULT_FREE_LLM_API_CONFIG }
}

export function saveFreeLlmApiConfig(
  config: FreeLlmApiConfig,
  storage?: StorageServiceInterface,
): {
  storedInSecureStorage: boolean
} {
  const normalized = normalizeConfig(config)
  if (canUseSecureStorage(storage)) {
    try {
      storage.setValue(SECURE_CONFIG_STORAGE_KEY, normalized, StorageValueModes.Default)
      purgeLegacyLocalStorageConfig()
      return { storedInSecureStorage: true }
    } catch {
      // Fall back to localStorage only if secure storage is unavailable
    }
  }

  try {
    window.localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Ignore storage quota / availability errors
  }
  return { storedInSecureStorage: false }
}
