document.addEventListener('DOMContentLoaded', function (event) {
  let componentRelay
  let workingNote, clientData
  let lastValue, lastUUID
  let editor
  let ignoreTextChange = false
  let initialLoad = true

  function loadComponentRelay() {
    const initialPermissions = [{ name: 'stream-context-item' }]
    componentRelay = new ComponentRelay({
      initialPermissions,
      targetWindow: window,
      onReady: function () {
        const platform = componentRelay.platform
        if (platform) {
          document.body.classList.add(platform)
        }

        loadEditor()

        // only use CodeMirror selection color if we're not on mobile.
        editor.setOption('styleSelectedText', !componentRelay.isMobile)
      },
    })

    componentRelay.streamContextItem((note) => {
      onReceivedNote(note)
    })
  }

  function saveNote() {
    if (workingNote) {
      // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      let note = workingNote

      componentRelay.saveItemWithPresave(note, () => {
        lastValue = editor.getValue()
        note.content.text = lastValue
        note.clientData = clientData

        // clear previews
        note.content.preview_plain = null
        note.content.preview_html = null
      })
    }
  }

  function onReceivedNote(note) {
    if (note.uuid !== lastUUID) {
      // Note changed, reset last values
      lastValue = null
      initialLoad = true
      lastUUID = note.uuid
    }

    workingNote = note

    // Only update UI on non-metadata updates.
    if (note.isMetadataUpdate) {
      return
    }

    clientData = note.clientData

    if (editor) {
      if (note.content.text !== lastValue) {
        ignoreTextChange = true
        editor.getDoc().setValue(workingNote.content.text)
        ignoreTextChange = false
      }

      if (initialLoad) {
        initialLoad = false
        editor.getDoc().clearHistory()
      }

      editor.setOption('spellcheck', workingNote.content.spellcheck)
    }
  }

  function loadEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
      mode: 'gfm',
      lineWrapping: true,
      extraKeys: { 'Alt-F': 'findPersistent' },
      inputStyle: getInputStyleForEnvironment(),
    })
    editor.setSize(undefined, '100%')

    editor.on('change', function () {
      if (ignoreTextChange) {
        return
      }
      saveNote()
    })
  }

  function getInputStyleForEnvironment() {
    const environment = componentRelay.environment ?? 'web'
    return environment === 'mobile' ? 'textarea' : 'contenteditable'
  }

  loadComponentRelay()
})
