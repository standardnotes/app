document.addEventListener("DOMContentLoaded", function () {

  const modeByModeMode = CodeMirror.modeInfo.reduce(function (acc, m) {
    if (acc[m.mode]) {
      acc[m.mode].push(m)
    } else {
      acc[m.mode] = [m]
    }
    return acc;
  }, {});

  const modeModeAndMimeByName = CodeMirror.modeInfo.reduce(function (acc, m) {
    acc[m.name] = { mode: m.mode, mime: m.mime };
    return acc;
  }, {});

  const modes = Object.keys(modeModeAndMimeByName);

  let componentRelay;
  let workingNote, clientData;
  let lastValue, lastUUID;
  let editor, select;
  let ignoreTextChange = false;
  let initialLoad = true;

  function loadComponentRelay() {
    componentRelay = new ComponentRelay({
      targetWindow: window,
      onReady: () => {
        const platform = componentRelay.platform;
        if (platform) {
          document.body.classList.add(platform);
        }
        loadEditor();
      }
    });

    componentRelay.streamContextItem((note) => {
      onReceivedNote(note);
    });
  }

  function saveNote() {
    if (workingNote) {
      // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      let note = workingNote;

      componentRelay.saveItemWithPresave(note, () => {
        lastValue = editor.getValue();
        note.content.text = lastValue;
        note.clientData = clientData;

        note.content.preview_plain = null;
        note.content.preview_html = null;
      });
    }
  }

  function onReceivedNote(note) {
    if (note.uuid !== lastUUID) {
      // Note changed, reset last values
      lastValue = null;
      initialLoad = true;
      lastUUID = note.uuid;
    }

    workingNote = note;
    // Only update UI on non-metadata updates.
    if (note.isMetadataUpdate) {
      return;
    }

    clientData = note.clientData;
    let mode = clientData.mode;

    if (!mode) {
      // Assign editor's default mode from component settings
      mode = componentRelay.getComponentDataValueForKey("language") ?? "JavaScript";
    }

    changeMode(mode);

    if (editor) {
      if (note.content.text !== lastValue) {
        ignoreTextChange = true;
        editor.getDoc().setValue(workingNote.content.text);
        ignoreTextChange = false;
      }

      if (initialLoad) {
        initialLoad = false;
        editor.getDoc().clearHistory();
      }

      editor.setOption(
        "spellcheck",
        workingNote.content.spellcheck
      )
    }
  }

  function loadEditor() {
    // Handler for the save command that is mapped to the :w (write) Vim key binding.
    CodeMirror.commands.save = function() {
      saveNote();
    };
    editor = CodeMirror.fromTextArea(document.getElementById("code"), {
      extraKeys: {
        'Alt-F': 'findPersistent',
      },
      lineNumbers: true,
      styleSelectedText: true,
      lineWrapping: true,
      inputStyle: getInputStyleForEnvironment()
    });
    editor.setSize("100%", "100%");

    createSelectElements();

    editor.on("change", function() {
      if (ignoreTextChange) {
        return;
      }
      saveNote();
    });

    /**
     * Scrolls the cursor into view, so the soft keyboard on mobile devices
     * doesn't overlap the cursor. A short delay is added to prevent scrolling
     * before the keyboard is shown.
     */
    const scrollCursorIntoView = (editor) => {
      setTimeout(() => editor.scrollIntoView(), 200);
    };

    editor.on('cursorActivity', function (editor) {
      if (componentRelay.environment !== 'mobile') {
        return;
      }
      scrollCursorIntoView(editor);
    });

    const initialKeyMap = componentRelay.getComponentDataValueForKey("keyMap") ?? "default";
    window.setKeyMap(initialKeyMap);
  }

  function createSelectElements() {
    select = document.getElementById("language-select");
    for (let index = 0; index < modes.length; index++) {
      const option = document.createElement("option");
      option.value = index;
      option.innerHTML = modes[index];
      select.appendChild(option);
    }
  }

  // Editor Modes
  window.setKeyMap = function (keymap) {
    editor.setOption("keyMap", keymap);
    updateVimStatus(keymap);
  }

  window.onLanguageSelect = function () {
    const language = modes[select.selectedIndex];
    changeMode(language);
    saveNote();
  }

  window.setDefaultLanguage = function () {
    const language = modes[select.selectedIndex];

    // assign default language for this editor when entering notes
    componentRelay.setComponentDataValueForKey("language", language);

    // show a confirmation message
    const message = document.getElementById("default-label");
    const original = message.innerHTML;
    message.innerHTML = "Success";
    message.classList.add("success");

    setTimeout(function () {
      message.classList.remove("success");
      message.innerHTML = original;
    }, 750);
  }

  function inputModeToMode(inputMode) {
    const convertCodeMirrorMode = function (codeMirrorMode) {
      if (codeMirrorMode) {
        return {
          name: codeMirrorMode.name,
          mode: codeMirrorMode.mode,
          mime: codeMirrorMode.mime
        };
      } else {
        return null;
      }
    };

    const extension = /.+\.([^.]+)$/.exec(inputMode);
    const mime = /\//.test(inputMode)

    if (extension) {
      return convertCodeMirrorMode(CodeMirror.findModeByExtension(extension[1]));
    } else if (mime) {
      return convertCodeMirrorMode(CodeMirror.findModeByMIME(mime[1]));
    } else if (modeModeAndMimeByName[inputMode]) {
      return {
        name: inputMode,
        mode: modeModeAndMimeByName[inputMode].mode,
        mime: modeModeAndMimeByName[inputMode].mime
      };
    } else if (modeByModeMode[inputMode]) {
      const firstMode = modeByModeMode[inputMode][0];
      return {
        name: firstMode.name,
        mode: firstMode.mode,
        mime: firstMode.mime
      };
    } else {
      return {
        name: inputMode,
        mode: inputMode,
        mime: inputMode
      };
    }
  }

  function changeMode(inputMode) {
    if (!inputMode) {
      return;
    }

    const mode = inputModeToMode(inputMode);

    if (mode) {
      editor.setOption("mode", mode.mime);
      CodeMirror.autoLoadMode(editor, mode.mode);
      if (clientData) {
        clientData.mode = mode.name;
      }
      document.getElementById("language-select").selectedIndex = modes.indexOf(mode.name);
    } else {
      console.error("Could not find a mode corresponding to " + inputMode);
    }
  }

  function updateVimStatus(keyMap) {
    const toggleButton = document.getElementById("toggle-vim-mode-button");

    const newAction = keyMap === "vim" ? "Disable" : "Enable";
    const buttonClass = keyMap === "vim" ? "danger" : "success";

    toggleButton.innerHTML = `${newAction} Vim mode`;
    toggleButton.classList.remove('danger');
    toggleButton.classList.remove('success');
    toggleButton.classList.add(buttonClass);
  }

  window.toggleVimMode = function() {
    let newKeyMap;

    const currentKeyMap = componentRelay.getComponentDataValueForKey("keyMap") ?? "default";
    if (currentKeyMap === "default") {
      newKeyMap = "vim";
    } else {
      newKeyMap = "default";
    }

    window.setKeyMap(newKeyMap);
    componentRelay.setComponentDataValueForKey("keyMap", newKeyMap);
  }

  function getInputStyleForEnvironment() {
    const environment = componentRelay.environment ?? 'web';
    return environment === 'mobile' ? 'textarea' : 'contenteditable';
  }

  loadComponentRelay();
});
