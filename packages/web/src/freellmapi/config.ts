export interface FreeLlmApiConfig {
  enabled: boolean
  baseURL: string
  apiKey: string
  model: string
  customInstructions: string
  maxAgentSteps: number
  autoApplyEdits: boolean
}

export interface FreeLlmProviderPreset {
  id: string
  label: string
  baseURL: string
  model: string
  description: string
}

const STORAGE_KEY = 'sn.freellmapi.config.v1'

export const DEFAULT_FREE_LLM_API_CONFIG: FreeLlmApiConfig = {
  enabled: true,
  baseURL: 'http://localhost:3001/v1',
  apiKey: '',
  model: 'auto',
  customInstructions: '',
  maxAgentSteps: 7,
  autoApplyEdits: false,
}

export const FREE_LLM_PRESETS: FreeLlmProviderPreset[] = [
  {
    id: 'freellmapi-local',
    label: 'FreeLLM Local',
    baseURL: 'http://localhost:3001/v1',
    model: 'auto',
    description: 'Local FreeLLM API proxy on port 3001',
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

export function validateFreeLlmApiConfig(config: FreeLlmApiConfig): string | undefined {
  const url = config.baseURL.trim()
  if (!url) {
    return 'Base URL is required (e.g. http://localhost:3001/v1).'
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Base URL must start with http:// or https://.'
    }
  } catch {
    return 'Base URL is not a valid URL.'
  }
  if (!config.model.trim()) {
    return 'Model name is required (e.g. auto).'
  }
  if (!Number.isFinite(config.maxAgentSteps) || config.maxAgentSteps < 1 || config.maxAgentSteps > 15) {
    return 'Max agent steps must be between 1 and 15.'
  }
  return undefined
}

export function loadFreeLlmApiConfig(): FreeLlmApiConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_FREE_LLM_API_CONFIG }
    }
    const parsed = JSON.parse(raw) as Partial<FreeLlmApiConfig>
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_FREE_LLM_API_CONFIG.enabled,
      baseURL:
        typeof parsed.baseURL === 'string' && parsed.baseURL.trim()
          ? parsed.baseURL.trim()
          : DEFAULT_FREE_LLM_API_CONFIG.baseURL,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULT_FREE_LLM_API_CONFIG.apiKey,
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_FREE_LLM_API_CONFIG.model,
      customInstructions:
        typeof parsed.customInstructions === 'string'
          ? parsed.customInstructions
          : DEFAULT_FREE_LLM_API_CONFIG.customInstructions,
      maxAgentSteps:
        typeof parsed.maxAgentSteps === 'number' && parsed.maxAgentSteps >= 1 && parsed.maxAgentSteps <= 15
          ? Math.round(parsed.maxAgentSteps)
          : DEFAULT_FREE_LLM_API_CONFIG.maxAgentSteps,
      autoApplyEdits:
        typeof parsed.autoApplyEdits === 'boolean' ? parsed.autoApplyEdits : DEFAULT_FREE_LLM_API_CONFIG.autoApplyEdits,
    }
  } catch {
    return { ...DEFAULT_FREE_LLM_API_CONFIG }
  }
}

export function saveFreeLlmApiConfig(config: FreeLlmApiConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore storage quota / availability errors
  }
}
