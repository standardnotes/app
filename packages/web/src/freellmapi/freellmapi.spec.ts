import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { ContentType, NoteType, SNNote, StorageServiceInterface, StorageValueModes } from '@standardnotes/snjs'
import { confirmDialog } from '@standardnotes/ui-services'
import { extractResponseText, FreeLlmApiClient } from './client'
import {
  analyzeEndpointPolicy,
  DEFAULT_FREE_LLM_API_CONFIG,
  IMMUTABLE_OPERATION_LIMITS,
  loadFreeLlmApiConfig,
  saveFreeLlmApiConfig,
  SECURE_CONFIG_STORAGE_KEY,
  validateFreeLlmApiConfig,
} from './config'
import { FreeLlmApiController } from './FreeLlmApiController'
import { convertNoteToText, isNoteSafeForAi, scoreTextMatch, tokenizeSearchQuery } from './noteConverter'
import { appendNotationToNote, editNoteContent } from './noteOperations'
import {
  evaluateWriteSafetyPolicy,
  executeReadTool,
  executeWriteTool,
  parseToolCalls,
} from './noteTools'
import {
  captureNoteSnapshot,
  clearAllNoteSnapshots,
  deleteNoteSnapshot,
  loadNoteSnapshots,
  purgeLegacyLocalStorageSnapshots,
  restoreNoteFromSnapshot,
  SECURE_SNAPSHOTS_STORAGE_KEY,
  syncPersistedSnapshotsOptIn,
} from './recoveryStore'

jest.mock('@standardnotes/ui-services', () => ({
  confirmDialog: jest.fn().mockResolvedValue(true),
}))

const createMockNote = (overrides: Partial<SNNote> = {}): SNNote => {
  return {
    uuid: 'note-1',
    content_type: ContentType.TYPES.Note,
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

const createMockSecureStorage = (): StorageServiceInterface & { store: Map<string, unknown> } => {
  const store = new Map<string, unknown>()
  return {
    store,
    isStorageWrapped: jest.fn().mockReturnValue(false),
    getValue: jest.fn((key: string) => store.get(key)),
    setValue: jest.fn((key: string, value: unknown) => {
      store.set(key, value)
    }),
    removeValue: jest.fn(async (key: string) => {
      store.delete(key)
    }),
  } as unknown as StorageServiceInterface & { store: Map<string, unknown> }
}

const createMockSuperConverter = () => {
  return {
    isValidSuperString: jest.fn((s: string) => s.startsWith('{"root":')),
    convertSuperStringToOtherFormat: jest.fn(async (s: string) => {
      const parsed = JSON.parse(s) as { root: { text: string } }
      return parsed.root.text
    }),
    convertOtherFormatToSuperString: jest.fn((md: string) => JSON.stringify({ root: { text: md } })),
  } as unknown as HeadlessSuperConverter
}

const createMockApplication = (initialNotes: SNNote[] = [], storage = createMockSecureStorage()) => {
  const notesMap = new Map<string, SNNote>(initialNotes.map((n) => [n.uuid, n]))
  let selectedNote: SNNote | undefined = initialNotes[0]

  const app = {
    identifier: 'test-workspace',
    storage,
    isLaunched: jest.fn().mockReturnValue(true),
    addEventObserver: jest.fn().mockReturnValue(jest.fn()),
    openPreferences: jest.fn(),
    events: {
      publishSync: jest.fn(),
      addEventHandler: jest.fn(),
    },
    protections: {
      addEventObserver: jest.fn().mockReturnValue(jest.fn()),
    },
    commands: {
      add: jest.fn().mockReturnValue(jest.fn()),
    },
    sync: {
      sync: jest.fn().mockResolvedValue(undefined),
    },
    history: {
      sessionHistoryForItem: jest.fn().mockReturnValue([]),
    },
    listRevisions: {
      execute: jest.fn().mockResolvedValue({ isFailed: () => true }),
    },
    getRevision: {
      execute: jest.fn().mockResolvedValue({ isFailed: () => true }),
    },
    itemListController: {
      selectItem: jest.fn(async (uuid: string) => {
        selectedNote = notesMap.get(uuid)
      }),
    },
    notesController: {
      get firstSelectedNote() {
        return selectedNote
      },
      createNoteWithContent: jest.fn(async (_editor: string, title: string, text: string) => {
        const created = createMockNote({
          uuid: `created-${notesMap.size + 1}`,
          title,
          text,
          preview_plain: text.slice(0, 160),
        })
        notesMap.set(created.uuid, created)
        return created
      }),
    },
    items: {
      getItems: jest.fn(() => Array.from(notesMap.values())),
      findItem: jest.fn((uuid: string) => notesMap.get(uuid)),
      itemsReferencingItem: jest.fn(() => []),
    },
    mutator: {
      changeItem: jest.fn(async (note: SNNote, mutate: (mutator: Record<string, unknown>) => void) => {
        const draft: Record<string, unknown> = {
          title: note.title,
          text: note.text,
          preview_plain: note.preview_plain,
          preview_html: note.preview_html,
          trashed: note.trashed,
          archived: note.archived,
        }
        mutate(draft)
        const updated = createMockNote({
          ...note,
          title: String(draft.title ?? note.title),
          text: String(draft.text ?? note.text),
          preview_plain: String(draft.preview_plain ?? note.preview_plain),
          trashed: Boolean(draft.trashed),
          archived: Boolean(draft.archived),
        })
        notesMap.set(updated.uuid, updated)
        return updated
      }),
    },
  }

  return { app: app as unknown as WebApplication, notesMap, storage }
}

describe('freellmapi production & security test suite', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearAllNoteSnapshots('test-workspace')
    clearAllNoteSnapshots('ws-a')
    clearAllNoteSnapshots('ws-b')
    ;(confirmDialog as jest.Mock).mockResolvedValue(true)
  })

  describe('opt-in defaults, endpoint policies & secure storage', () => {
    it('is opt-in (disabled by default) and ships with no hardcoded API key', () => {
      expect(DEFAULT_FREE_LLM_API_CONFIG.enabled).toBe(false)
      expect(DEFAULT_FREE_LLM_API_CONFIG.apiKey).toBe('')
      expect(DEFAULT_FREE_LLM_API_CONFIG.persistEncryptedSnapshots).toBe(false)
      expect(DEFAULT_FREE_LLM_API_CONFIG.autoApplyEdits).toBe(false)
    })

    it('enforces loopback-only HTTP, requires HTTPS for remote servers, and rejects embedded credentials', () => {
      expect(analyzeEndpointPolicy('http://localhost:3001/v1')).toMatchObject({ valid: true, isLoopback: true, isRemote: false })
      expect(analyzeEndpointPolicy('http://127.0.0.1:11434/v1')).toMatchObject({ valid: true, isLoopback: true, isRemote: false })
      expect(analyzeEndpointPolicy('http://[::1]:1234/v1')).toMatchObject({ valid: true, isLoopback: true, isRemote: false })

      const remoteHttp = analyzeEndpointPolicy('http://my-llm.example.com/v1')
      expect(remoteHttp.valid).toBe(false)
      expect(remoteHttp.error).toContain('HTTPS')

      const remoteHttps = analyzeEndpointPolicy('https://my-llm.example.com/v1')
      expect(remoteHttps.valid).toBe(true)
      expect(remoteHttps.isRemote).toBe(true)
      expect(remoteHttps.warning).toContain('leave this machine')

      const withCreds = analyzeEndpointPolicy('https://user:pass@my-llm.example.com/v1')
      expect(withCreds.valid).toBe(false)
      expect(withCreds.error).toContain('credentials')

      expect(
        validateFreeLlmApiConfig({
          ...DEFAULT_FREE_LLM_API_CONFIG,
          maxAgentSteps: IMMUTABLE_OPERATION_LIMITS.MAX_AGENT_STEPS_HARD_CAP + 1,
        }),
      ).toBeDefined()
    })

    it('stores API config in Standard Notes encrypted storage and purges legacy localStorage', () => {
      const secureStorage = createMockSecureStorage()
      window.localStorage.setItem(
        'sn.freellmapi.config.v1',
        JSON.stringify({ enabled: true, apiKey: 'migrated-secret', baseURL: 'http://localhost:3001/v1' }),
      )

      const migrated = loadFreeLlmApiConfig(secureStorage)
      expect(migrated.apiKey).toBe('migrated-secret')
      expect(window.localStorage.getItem('sn.freellmapi.config.v1')).toBeNull()
      expect(secureStorage.setValue).toHaveBeenCalledWith(
        SECURE_CONFIG_STORAGE_KEY,
        expect.objectContaining({ apiKey: 'migrated-secret' }),
        StorageValueModes.Default,
      )

      const saveResult = saveFreeLlmApiConfig(
        { ...DEFAULT_FREE_LLM_API_CONFIG, enabled: true, apiKey: 'new-key' },
        secureStorage,
      )
      expect(saveResult.storedInSecureStorage).toBe(true)
      expect(window.localStorage.getItem('sn.freellmapi.config.v1')).toBeNull()
    })
  })

  describe('client extraction, policy enforcement & cancellation', () => {
    it('extracts output_text, output array, and choices fallback', () => {
      expect(extractResponseText({ output_text: 'direct' })).toBe('direct')
      expect(
        extractResponseText({
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'nested' }] }],
        }),
      ).toBe('nested')
      expect(extractResponseText({ choices: [{ message: { content: 'choice' } }] })).toBe('choice')
    })

    it('blocks remote HTTP at the client layer and respects AbortSignal cancellation', async () => {
      const fetchMock = jest.fn()
      ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock
      const client = new FreeLlmApiClient()

      await expect(
        client.createResponse(
          { ...DEFAULT_FREE_LLM_API_CONFIG, baseURL: 'http://remote.example.com/v1' },
          { input: 'hello' },
        ),
      ).rejects.toThrow('HTTPS')
      expect(fetchMock).not.toHaveBeenCalled()

      const abortController = new AbortController()
      abortController.abort()
      await expect(
        client.createResponse(DEFAULT_FREE_LLM_API_CONFIG, { input: 'hello' }, abortController.signal),
      ).rejects.toMatchObject({ name: 'AbortError' })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('malformed tool calls, safety guards & RichText/Super conversion', () => {
    it('handles malformed tool calls, unknown tools, and missing required args safely', () => {
      const mixed = [
        'Thinking...',
        '```sn-tool',
        '{broken json',
        '```',
        '```sn-tool',
        '[{"tool":"unknown_tool","args":{}},{"tool":"search_notes","args":{"query":""}},{"tool":"restore_note","args":{}},{"tool":"read_note","args":{"uuid":"note-1"}}]',
        '```',
      ].join('\n')

      const parsed = parseToolCalls(mixed)
      expect(parsed.malformedBlocksCount).toBe(1)
      expect(parsed.toolCalls).toHaveLength(1)
      expect(parsed.toolCalls[0]).toEqual({
        tool: 'read_note',
        args: { uuid: 'note-1', title: undefined, open_in_ui: undefined },
      })
    })

    it('blocks protected, 2FA, and locked notes across read, edit, append, and snapshot restore', async () => {
      const lockedNote = createMockNote({ uuid: 'n-locked', title: 'Locked', locked: true })
      const protectedNote = createMockNote({ uuid: 'n-protected', title: 'Secret', protected: true })
      const authNote = createMockNote({ uuid: 'n-2fa', title: '2FA', noteType: NoteType.Authentication })

      expect(isNoteSafeForAi(protectedNote, { includeTrashed: true, includeArchived: true })).toBe(false)
      expect(isNoteSafeForAi(authNote, { includeTrashed: true, includeArchived: true })).toBe(false)

      const { app } = createMockApplication([lockedNote, protectedNote, authNote])
      const converter = createMockSuperConverter()

      await expect(
        editNoteContent(app, lockedNote, converter, { mode: 'overwrite', content: 'hacked' }),
      ).rejects.toThrow('locked')

      await expect(
        editNoteContent(app, protectedNote, converter, { mode: 'overwrite', content: 'hacked' }),
      ).rejects.toThrow('protected')

      await expect(appendNotationToNote(app, lockedNote, 'note', converter)).rejects.toThrow('locked')
      await expect(appendNotationToNote(app, authNote, 'note', converter)).rejects.toThrow('authenticator')

      const snap = captureNoteSnapshot(lockedNote, 'test', app.identifier)
      await expect(restoreNoteFromSnapshot(app, snap)).rejects.toThrow('locked')

      const readRes = await executeReadTool(
        app,
        converter,
        { tool: 'read_note', args: { uuid: 'n-protected' } },
        { backupRecords: [] },
      )
      expect(readRes.resultJson).toContain('not accessible')
    })

    it('strips RichText HTML on read and escapes XSS payloads in headings and body on write', async () => {
      const richNote = createMockNote({
        uuid: 'n-rich',
        title: 'Rich Note',
        noteType: NoteType.RichText,
        text: '<p>Hello <b>world</b></p>',
      })
      const { app } = createMockApplication([richNote])
      const converter = createMockSuperConverter()

      const converted = await convertNoteToText(richNote, converter)
      expect(converted.text).toBe('Hello world')

      const appended = await appendNotationToNote(
        app,
        richNote,
        '<img src=x onerror=alert(1)>',
        converter,
        '<script>evil()</script>',
      )
      expect(appended.text).not.toContain('<script>')
      expect(appended.text).not.toContain('<img ')
      expect(appended.text).toContain('&lt;script&gt;evil()&lt;/script&gt;')
      expect(appended.text).toContain('&lt;img src=x onerror=alert(1)&gt;')
    })

    it('round-trips Super (Lexical JSON) notes cleanly on read, replace_text, and append', async () => {
      const superNote = createMockNote({
        uuid: 'n-super',
        title: 'Super Plan',
        noteType: NoteType.Super,
        text: JSON.stringify({ root: { text: '# Plan\nStep 1: Draft' } }),
      })
      const { app } = createMockApplication([superNote])
      const converter = createMockSuperConverter()

      const { note: edited } = await editNoteContent(app, superNote, converter, {
        mode: 'replace_text',
        oldText: 'Step 1: Draft',
        newText: 'Step 1: Done',
      })
      expect(JSON.parse(edited.text)).toEqual({ root: { text: '# Plan\nStep 1: Done' } })

      const appended = await appendNotationToNote(app, edited, 'Extra notation', converter, 'Review')
      const appendedMd = (JSON.parse(appended.text) as { root: { text: string } }).root.text
      expect(appendedMd).toContain('Step 1: Done')
      expect(appendedMd).toContain('Extra notation')
    })
  })

  describe('write tools, immutable limits, opt-in snapshots & controller integration', () => {
    it('executes create_note, edit_note, and restore_note from trash, snapshot, and backup', async () => {
      const activeNote = createMockNote({ uuid: 'n-active', title: 'Project', text: 'Alpha beta' })
      const trashedNote = createMockNote({ uuid: 'n-trash', title: 'Old Secret Plan', text: 'Archived idea', trashed: true })
      const { app } = createMockApplication([activeNote, trashedNote])
      const converter = createMockSuperConverter()
      const ctx = {
        backupRecords: [{ id: 'bkp-1', sourceFile: 'backup.json', title: 'Backup Note', text: 'Recovered body' }],
      }

      const editRes = await executeWriteTool(
        app,
        converter,
        {
          tool: 'edit_note',
          args: { uuid: 'n-active', mode: 'replace_text', old_text: 'Alpha', new_text: 'Omega', new_title: 'Project v2' },
        },
        ctx,
      )
      expect(editRes.snapshotId).toBeDefined()
      expect(app.items.findItem<SNNote>('n-active')?.title).toBe('Project v2')
      expect(app.items.findItem<SNNote>('n-active')?.text).toBe('Omega beta')

      // Restore from snapshot reverts title & text
      await executeWriteTool(
        app,
        converter,
        { tool: 'restore_note', args: { snapshot_id: editRes.snapshotId } },
        ctx,
      )
      expect(app.items.findItem<SNNote>('n-active')?.title).toBe('Project')
      expect(app.items.findItem<SNNote>('n-active')?.text).toBe('Alpha beta')

      // Restore from trash
      await executeWriteTool(app, converter, { tool: 'restore_note', args: { uuid: 'n-trash' } }, ctx)
      expect(app.items.findItem<SNNote>('n-trash')?.trashed).toBe(false)

      // Restore from backup creates note
      const bkpRes = await executeWriteTool(app, converter, { tool: 'restore_note', args: { backup_id: 'bkp-1' } }, ctx)
      expect(bkpRes.targetTitle).toBe('Backup Note')

      // Create note
      const createRes = await executeWriteTool(
        app,
        converter,
        { tool: 'create_note', args: { title: 'Fresh Note', content: 'Created body' } },
        ctx,
      )
      expect(createRes.targetTitle).toBe('Fresh Note')
    })

    it('enforces immutable write limits: bulk edits & restores always require confirmation even in auto-edit mode', () => {
      const bulkPolicy = evaluateWriteSafetyPolicy(
        [
          { tool: 'edit_note', args: { uuid: '1', mode: 'overwrite', content: 'a' } },
          { tool: 'edit_note', args: { uuid: '2', mode: 'overwrite', content: 'b' } },
          { tool: 'edit_note', args: { uuid: '3', mode: 'overwrite', content: 'c' } },
          { tool: 'edit_note', args: { uuid: '4', mode: 'overwrite', content: 'd' } },
        ],
        { autoApplyEdits: true, autoEditsAlreadyExecutedThisTurn: 0 },
      )
      expect(bulkPolicy.allowedCalls).toHaveLength(IMMUTABLE_OPERATION_LIMITS.MAX_WRITES_PER_TURN)
      expect(bulkPolicy.droppedCount).toBe(1)
      expect(bulkPolicy.mustRequireConfirmation).toBe(true)
      expect(bulkPolicy.confirmationReason).toContain('Bulk edits')

      const restorePolicy = evaluateWriteSafetyPolicy(
        [{ tool: 'restore_note', args: { uuid: 'n-trash' } }],
        { autoApplyEdits: true, autoEditsAlreadyExecutedThisTurn: 0 },
      )
      expect(restorePolicy.mustRequireConfirmation).toBe(true)
      expect(restorePolicy.confirmationReason).toContain('Restore')

      const autoCapPolicy = evaluateWriteSafetyPolicy(
        [{ tool: 'edit_note', args: { uuid: '1', mode: 'overwrite', content: 'a' } }],
        { autoApplyEdits: true, autoEditsAlreadyExecutedThisTurn: IMMUTABLE_OPERATION_LIMITS.MAX_AUTO_EDITS_PER_TURN },
      )
      expect(autoCapPolicy.mustRequireConfirmation).toBe(true)
    })

    it('persists encrypted snapshots ONLY on explicit opt-in and purges them when disabled', async () => {
      window.localStorage.setItem('sn.freellmapi.snapshots.v1', 'legacy-secret')
      purgeLegacyLocalStorageSnapshots()
      expect(window.localStorage.getItem('sn.freellmapi.snapshots.v1')).toBeNull()

      const secureStorage = createMockSecureStorage()
      const note = createMockNote({ uuid: 'n-snap', text: 'Sensitive plaintext' })

      // Opt-in OFF (default): stays in RAM, never touches storage
      const snap1 = captureNoteSnapshot(note, 'edit 1', 'ws-a', {
        storage: secureStorage,
        persistEncryptedSnapshots: false,
      })
      expect(loadNoteSnapshots('ws-a')).toHaveLength(1)
      expect(secureStorage.store.has(SECURE_SNAPSHOTS_STORAGE_KEY)).toBe(false)

      // Opt-in ON: writes to encrypted storage
      await syncPersistedSnapshotsOptIn('ws-a', { storage: secureStorage, persistEncryptedSnapshots: true })
      expect(secureStorage.store.has(SECURE_SNAPSHOTS_STORAGE_KEY)).toBe(true)

      // Opt-in toggled back OFF: immediately purges persisted snapshots
      await syncPersistedSnapshotsOptIn('ws-a', { storage: secureStorage, persistEncryptedSnapshots: false })
      expect(secureStorage.store.has(SECURE_SNAPSHOTS_STORAGE_KEY)).toBe(false)

      deleteNoteSnapshot(snap1.id, 'ws-a')
      expect(loadNoteSnapshots('ws-a')).toHaveLength(0)
    })

    it('discloses exact outbound notes before sending, warns on remote HTTPS, and supports cancellation', async () => {
      const noteA = createMockNote({ uuid: 'n-a', title: 'Server Notes', text: 'ssh root@10.0.0.1' })
      const { app } = createMockApplication([noteA])
      const converter = createMockSuperConverter()

      const mockClient = {
        createResponse: jest.fn(async (_cfg, _params, signal?: AbortSignal) => {
          return await new Promise<string>((resolve, reject) => {
            signal?.addEventListener('abort', () => {
              const err = new Error('aborted')
              err.name = 'AbortError'
              reject(err)
            })
            setTimeout(() => resolve('Found it!'), 50)
          })
        }),
        testConnection: jest.fn(),
      } as unknown as FreeLlmApiClient

      const controller = new FreeLlmApiController(app, converter, mockClient)
      controller.updateConfig({ enabled: true, baseURL: 'https://remote-llm.example.com/v1' })

      const disclosure = controller.outboundDisclosure
      expect(disclosure.policy.isRemote).toBe(true)
      expect(disclosure.fullContentNotes).toEqual([
        expect.objectContaining({ uuid: 'n-a', title: 'Server Notes', approxChars: 'ssh root@10.0.0.1'.length }),
      ])

      // User rejects remote endpoint warning -> nothing is sent
      ;(confirmDialog as jest.Mock).mockResolvedValueOnce(false)
      await controller.sendMessage('Find my SSH note')
      expect(mockClient.createResponse).not.toHaveBeenCalled()

      // User accepts remote endpoint warning -> request starts, then user cancels mid-flight
      ;(confirmDialog as jest.Mock).mockResolvedValueOnce(true)
      const sendPromise = controller.sendMessage('Find my SSH note')
      await new Promise((r) => setTimeout(r, 5))
      controller.cancelActiveRequest()
      await sendPromise
      expect(controller.isLoading).toBe(false)
      expect(controller.messages.filter((m) => m.role === 'assistant')).toHaveLength(0)

      // Multi-keyword lost-info scoring helper check
      const tokens = tokenizeSearchQuery('where did I save my server SSH setup', ['docker'])
      expect(tokens).toEqual(expect.arrayContaining(['server', 'ssh', 'docker']))
      expect(scoreTextMatch('Server Notes', [], 'ssh root@10.0.0.1', 'server ssh').score).toBeGreaterThan(5)

      controller.deinit()
    })
  })
})
