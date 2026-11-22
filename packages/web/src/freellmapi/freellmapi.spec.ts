import { NoteType, SNNote } from '@standardnotes/snjs'
import { extractResponseText, FreeLlmApiClient } from './client'
import {
  DEFAULT_FREE_LLM_API_CONFIG,
  loadFreeLlmApiConfig,
  saveFreeLlmApiConfig,
  validateFreeLlmApiConfig,
} from './config'
import { isNoteSafeForAi, scoreTextMatch, tokenizeSearchQuery } from './noteConverter'
import { parseToolCalls } from './noteTools'
import {
  captureNoteSnapshot,
  clearAllNoteSnapshots,
  deleteNoteSnapshot,
  loadNoteSnapshots,
  purgeLegacyLocalStorageSnapshots,
} from './recoveryStore'

const createMockNote = (overrides: Partial<SNNote> = {}): SNNote => {
  return {
    uuid: 'note-1',
    title: 'Test Note',
    text: 'Hello world',
    preview_plain: 'Hello world',
    noteType: NoteType.Plain,
    trashed: false,
    archived: false,
    protected: false,
    locked: false,
    userModifiedDate: new Date('2026-01-01T00:00:00Z'),
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as unknown as SNNote
}

describe('freellmapi production checks', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearAllNoteSnapshots('ws-a')
    clearAllNoteSnapshots('ws-b')
  })

  describe('config', () => {
    it('does not ship with a hardcoded API key by default', () => {
      expect(DEFAULT_FREE_LLM_API_CONFIG.apiKey).toBe('')
    })

    it('validates baseURL, model, and maxAgentSteps', () => {
      expect(validateFreeLlmApiConfig(DEFAULT_FREE_LLM_API_CONFIG)).toBeUndefined()
      expect(validateFreeLlmApiConfig({ ...DEFAULT_FREE_LLM_API_CONFIG, baseURL: '' })).toBeDefined()
      expect(validateFreeLlmApiConfig({ ...DEFAULT_FREE_LLM_API_CONFIG, baseURL: 'ftp://localhost:3001' })).toBeDefined()
      expect(validateFreeLlmApiConfig({ ...DEFAULT_FREE_LLM_API_CONFIG, model: '   ' })).toBeDefined()
      expect(validateFreeLlmApiConfig({ ...DEFAULT_FREE_LLM_API_CONFIG, maxAgentSteps: 0 })).toBeDefined()
      expect(validateFreeLlmApiConfig({ ...DEFAULT_FREE_LLM_API_CONFIG, maxAgentSteps: 99 })).toBeDefined()
    })

    it('persists and reloads user GUI config including empty apiKey', () => {
      saveFreeLlmApiConfig({
        ...DEFAULT_FREE_LLM_API_CONFIG,
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'my-local-key',
        model: 'llama3.2',
        maxAgentSteps: 5,
        autoApplyEdits: true,
      })

      const loaded = loadFreeLlmApiConfig()
      expect(loaded.baseURL).toBe('http://localhost:11434/v1')
      expect(loaded.apiKey).toBe('my-local-key')
      expect(loaded.model).toBe('llama3.2')
      expect(loaded.maxAgentSteps).toBe(5)
      expect(loaded.autoApplyEdits).toBe(true)
    })
  })

  describe('client response extraction', () => {
    it('extracts output_text, Responses API output array, and chat completions fallback', () => {
      expect(extractResponseText({ output_text: 'direct text' })).toBe('direct text')
      expect(
        extractResponseText({
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'from output array' }] }],
        }),
      ).toBe('from output array')
      expect(
        extractResponseText({
          choices: [{ message: { content: 'from choices' } }],
        }),
      ).toBe('from choices')
    })

    it('sends bearer header only when apiKey is set and handles HTTP errors', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ output_text: 'OK' }),
      })
      ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock

      const client = new FreeLlmApiClient()
      const res = await client.createResponse(
        { ...DEFAULT_FREE_LLM_API_CONFIG, apiKey: 'test-token' },
        { instructions: 'sys', input: 'hello' },
      )
      expect(res).toBe('OK')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/v1/responses',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: 'Invalid key' } }),
      })
      await expect(
        client.createResponse(DEFAULT_FREE_LLM_API_CONFIG, { input: 'hi' }),
      ).rejects.toThrow('FreeLLM API error (401): Invalid key')
    })
  })

  describe('note safety & lost-info search scoring', () => {
    it('always blocks protected and 2FA authenticator notes', () => {
      const authNote = createMockNote({ noteType: NoteType.Authentication })
      const protectedNote = createMockNote({ protected: true })
      const trashedNote = createMockNote({ trashed: true })
      const normalNote = createMockNote()

      expect(isNoteSafeForAi(authNote, { includeTrashed: true, includeArchived: true })).toBe(false)
      expect(isNoteSafeForAi(protectedNote, { includeTrashed: true, includeArchived: true })).toBe(false)
      expect(isNoteSafeForAi(trashedNote)).toBe(false)
      expect(isNoteSafeForAi(trashedNote, { includeTrashed: true })).toBe(true)
      expect(isNoteSafeForAi(normalNote)).toBe(true)
    })

    it('scores multi-keyword fuzzy queries and extracts context snippets', () => {
      const tokens = tokenizeSearchQuery('where did I save my server SSH setup', ['docker'])
      expect(tokens).toContain('server')
      expect(tokens).toContain('ssh')
      expect(tokens).toContain('docker')

      const match = scoreTextMatch(
        'Homelab Server Guide',
        ['devops'],
        'Run ssh root@10.0.0.5 and restart docker compose for the API.',
        'server ssh',
        ['docker'],
      )
      expect(match.score).toBeGreaterThan(10)
      expect(match.snippet).toContain('ssh root@10.0.0.5')
    })
  })

  describe('tool call parser', () => {
    it('parses sn-tool arrays, single calls, and legacy sn-action blocks safely', () => {
      const raw = [
        'Let me search for that note.',
        '```sn-tool',
        '[{"tool":"find_lost_info","args":{"query":"ssh","keywords":["server"]}},{"tool":"read_note","args":{"uuid":"abc"}}]',
        '```',
      ].join('\n')

      const parsed = parseToolCalls(raw)
      expect(parsed.displayText).toBe('Let me search for that note.')
      expect(parsed.toolCalls).toHaveLength(2)
      expect(parsed.toolCalls[0].tool).toBe('find_lost_info')
      expect(parsed.toolCalls[1].tool).toBe('read_note')
    })

    it('survives malformed JSON blocks without throwing', () => {
      const parsed = parseToolCalls('Hello ```sn-tool {broken json``` world')
      expect(parsed.toolCalls).toHaveLength(0)
      expect(parsed.displayText).toContain('Hello')
    })
  })

  describe('in-memory snapshot isolation (zero localStorage plaintext leak)', () => {
    it('stores snapshots in memory per workspace and never writes plaintext to localStorage', () => {
      window.localStorage.setItem('sn.freellmapi.snapshots.v1', 'legacy-secret')
      purgeLegacyLocalStorageSnapshots()
      expect(window.localStorage.getItem('sn.freellmapi.snapshots.v1')).toBeNull()

      const note = createMockNote({ uuid: 'n-secret', text: 'Top secret text' })
      const snap = captureNoteSnapshot(note, 'Before edit', 'ws-a')

      expect(loadNoteSnapshots('ws-a')).toHaveLength(1)
      expect(loadNoteSnapshots('ws-b')).toHaveLength(0)
      expect(window.localStorage.getItem('sn.freellmapi.snapshots.v1')).toBeNull()

      deleteNoteSnapshot(snap.id, 'ws-a')
      expect(loadNoteSnapshots('ws-a')).toHaveLength(0)
    })
  })
})
