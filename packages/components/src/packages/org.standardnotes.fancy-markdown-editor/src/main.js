document.addEventListener('DOMContentLoaded', function (event) {
  const editor = document.getElementById('editor-source')

  let workingNote

  const componentRelay = new ComponentRelay({
    targetWindow: window,
    onReady: () => {
      const platform = componentRelay.platform
      if (platform) {
        document.body.classList.add(platform)
      }
    },
  })

  componentRelay.streamContextItem((note) => {
    workingNote = note

    // Only update UI on non-metadata updates.
    if (note.isMetadataUpdate) {
      return
    }

    editor.value = note.content.text
    window.upmath.updateText()

    editor.setAttribute('spellcheck', JSON.stringify(workingNote.content.spellcheck))
  })

  editor.addEventListener('input', function (event) {
    const text = editor.value || ''

    function strip(html) {
      const tmp = document.implementation.createHTMLDocument('New').body
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    function truncateString(string, limit = 90) {
      if (string.length <= limit) {
        return string
      } else {
        return string.substring(0, limit) + '...'
      }
    }

    if (workingNote) {
      // Be sure to capture this object as a variable, as workingNote may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      const note = workingNote

      componentRelay.saveItemWithPresave(note, () => {
        window.upmath.updateText()

        const html = window.upmath.getHTML()
        const strippedHtml = truncateString(strip(html))

        note.content.preview_plain = strippedHtml
        note.content.preview_html = null
        note.content.text = text
      })
    }
  })

  // Tab handler
  editor.addEventListener('keydown', function (event) {
    if (!event.shiftKey && event.which == 9) {
      event.preventDefault()

      // Using document.execCommand gives us undo support
      if (!document.execCommand('insertText', false, '\t')) {
        // document.execCommand works great on Chrome/Safari but not Firefox
        const start = this.selectionStart
        const end = this.selectionEnd
        const spaces = '    '

        // Insert 4 spaces
        this.value = this.value.substring(0, start) + spaces + this.value.substring(end)

        // Place cursor 4 spaces away from where
        // the tab key was pressed
        this.selectionStart = this.selectionEnd = start + 4
      }
    }
  })
})
