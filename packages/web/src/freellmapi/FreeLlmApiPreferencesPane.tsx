import { useApplication } from '@/Components/ApplicationProvider'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { FormEvent, useEffect, useState } from 'react'
import { FREE_LLM_PRESETS, FreeLlmApiConfig, validateFreeLlmApiConfig } from './config'

const FreeLlmApiPreferencesPane = observer(() => {
  const application = useApplication()
  const controller = application.freeLlmApiController

  const [draft, setDraft] = useState<FreeLlmApiConfig | undefined>(() => {
    return controller ? { ...controller.config } : undefined
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [validationError, setValidationError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (controller) {
      setDraft({ ...controller.config })
    }
  }, [
    controller,
    controller?.config.enabled,
    controller?.config.baseURL,
    controller?.config.apiKey,
    controller?.config.model,
    controller?.config.customInstructions,
    controller?.config.maxAgentSteps,
    controller?.config.autoApplyEdits,
  ])

  if (!controller || !draft) {
    return (
      <PreferencesPane>
        <PreferencesGroup>
          <Title>AI / FreeLLM API</Title>
          <Subtitle>Local AI configuration is available only in the Standard Notes Desktop app.</Subtitle>
        </PreferencesGroup>
      </PreferencesPane>
    )
  }

  const updateDraft = (partial: Partial<FreeLlmApiConfig>) => {
    setValidationError(undefined)
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  const handleSave = (event?: FormEvent) => {
    event?.preventDefault()
    const error = validateFreeLlmApiConfig(draft)
    if (error) {
      setValidationError(error)
      return
    }
    controller.saveConfigFromGui(draft)
  }

  const handleTestConnection = async () => {
    const error = validateFreeLlmApiConfig(draft)
    if (error) {
      setValidationError(error)
      return
    }
    controller.saveConfigFromGui(draft, { silent: true })
    await controller.testConnection(draft)
  }

  const handleReset = () => {
    setValidationError(undefined)
    controller.resetConfig()
    setDraft({ ...controller.config })
  }

  const testResult = controller.connectionTestResult

  return (
    <PreferencesPane>
      <form onSubmit={handleSave}>
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>AI / FreeLLM API (Desktop Local)</Title>
            <Subtitle>
              Configure your local OpenAI-compatible Responses API endpoint to chat with, browse, edit, and recover your
              decrypted notes locally.
            </Subtitle>

            <div className="mt-4 flex items-center justify-between rounded border border-border bg-contrast px-3 py-2.5">
              <div>
                <div className="text-sm font-semibold text-text">Enable Local AI Assistant</div>
                <div className="text-xs text-neutral">
                  Shows the AI Chat button in the bottom bar and enables the Command Palette shortcut.
                </div>
              </div>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => updateDraft({ enabled: e.target.checked })}
                className="h-4 w-4 cursor-pointer"
              />
            </div>

            {/* Provider Presets */}
            <div className="mt-4">
              <div className="mb-1.5 text-xs font-semibold uppercase text-neutral">Quick Presets</div>
              <div className="flex flex-wrap gap-2">
                {FREE_LLM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      updateDraft({
                        baseURL: preset.baseURL,
                        model: preset.model,
                      })
                    }
                    title={preset.description}
                    className="cursor-pointer rounded border border-border bg-contrast px-3 py-1.5 text-xs font-medium text-text hover:border-info hover:text-info"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL */}
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text">Base URL</span>
                <input
                  type="text"
                  value={draft.baseURL}
                  onChange={(e) => updateDraft({ baseURL: e.target.value })}
                  placeholder="http://localhost:3001/v1"
                  className="w-full rounded border border-border bg-default px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
                />
                <span className="text-xs text-neutral">
                  Requests are sent to <code className="text-info">{draft.baseURL.replace(/\/+$/, '')}/responses</code>.
                </span>
              </label>

              {/* API Key */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text">API Key</span>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={draft.apiKey}
                    onChange={(e) => updateDraft({ apiKey: e.target.value })}
                    placeholder="freellmapi-..."
                    className="flex-1 rounded border border-border bg-default px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="cursor-pointer rounded border border-border bg-contrast px-3 py-2 text-xs font-semibold text-text hover:border-info"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-xs text-neutral">
                  Sent in the <code>Authorization: Bearer ...</code> header. Stored locally on this machine.
                </span>
              </label>

              {/* Model */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text">Model</span>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => updateDraft({ model: e.target.value })}
                  placeholder="auto"
                  className="w-full rounded border border-border bg-default px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
                />
              </label>
            </div>

            {validationError && (
              <div className="mt-3 rounded border border-danger bg-contrast px-3 py-2 text-xs text-danger">
                {validationError}
              </div>
            )}

            {testResult && (
              <div
                className={`mt-3 rounded border px-3 py-2 text-xs ${
                  testResult.ok ? 'border-success bg-contrast text-success' : 'border-danger bg-contrast text-danger'
                }`}
              >
                {testResult.ok
                  ? `Connected in ${testResult.latencyMs}ms — Model replied: "${testResult.replyPreview}"`
                  : `Connection failed (${testResult.latencyMs}ms): ${testResult.error}`}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="cursor-pointer rounded bg-info px-4 py-2 text-xs font-semibold text-info-contrast hover:opacity-90"
              >
                Save Configuration
              </button>
              <button
                type="button"
                disabled={controller.isTestingConnection}
                onClick={() => void handleTestConnection()}
                className="cursor-pointer rounded border border-info bg-info-backdrop px-4 py-2 text-xs font-semibold text-info hover:opacity-90 disabled:opacity-50"
              >
                {controller.isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="cursor-pointer rounded border border-border bg-contrast px-3 py-2 text-xs font-medium text-text hover:border-danger hover:text-danger"
              >
                Reset to Defaults
              </button>
            </div>
          </PreferencesSegment>
        </PreferencesGroup>

        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Agent Behavior & Safety</Title>
            <Subtitle>Control how the AI agent browses, edits, and talks to you.</Subtitle>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text">Custom Instructions (optional)</span>
                <textarea
                  rows={3}
                  value={draft.customInstructions}
                  onChange={(e) => updateDraft({ customInstructions: e.target.value })}
                  placeholder="e.g. Always reply concisely in bullet points, or respond in Arabic/English..."
                  className="w-full resize-y rounded border border-border bg-default p-2.5 text-sm text-text focus:border-info focus:outline-none"
                />
              </label>

              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-text">Max Agent Tool Steps per Turn</div>
                  <div className="text-xs text-neutral">
                    How many browse/search/read/edit steps the model can chain automatically (1–15).
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={draft.maxAgentSteps}
                  onChange={(e) => updateDraft({ maxAgentSteps: Number(e.target.value) || 7 })}
                  className="w-20 rounded border border-border bg-default px-2.5 py-1.5 text-sm text-text"
                />
              </label>

              <div className="flex items-center justify-between rounded border border-border bg-contrast px-3 py-2.5">
                <div>
                  <div className="text-xs font-semibold text-text">Auto-apply Note Edits</div>
                  <div className="text-xs text-neutral">
                    Apply AI edits immediately without approval prompts (a recovery snapshot is still saved before every
                    edit).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.autoApplyEdits}
                  onChange={(e) => updateDraft({ autoApplyEdits: e.target.checked })}
                  className="h-4 w-4 cursor-pointer"
                />
              </div>
            </div>
          </PreferencesSegment>
        </PreferencesGroup>
      </form>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Notes & Recovery Status</Title>
          <Text className="mt-2">
            Readable notes: <strong>{controller.readableNotesCount}</strong> · Saved undo snapshots:{' '}
            <strong>{controller.snapshots.length}</strong> · Loaded backup notes:{' '}
            <strong>{controller.backupRecords.length}</strong>
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                application.preferencesController.closePreferences()
                controller.open()
              }}
              className="cursor-pointer rounded bg-info px-3.5 py-1.5 text-xs font-semibold text-info-contrast hover:opacity-90"
            >
              Open AI Chat Panel
            </button>
            <button
              type="button"
              onClick={() => {
                application.preferencesController.closePreferences()
                controller.open()
                if (!controller.showRecoveryDrawer) {
                  controller.toggleRecoveryDrawer()
                }
              }}
              className="cursor-pointer rounded border border-border bg-contrast px-3.5 py-1.5 text-xs font-semibold text-text hover:border-info"
            >
              Open Recovery Drawer
            </button>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
})

export default FreeLlmApiPreferencesPane
