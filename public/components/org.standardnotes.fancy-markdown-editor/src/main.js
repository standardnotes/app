document.addEventListener("DOMContentLoaded", function(event) {

  let editor = document.getElementById("editor-source");

  var workingNote;

  let permissions = [
    {
      name: "stream-context-item"
    }
  ];

  var componentManager = new ComponentManager(permissions, function(){
    // on ready
    var platform = componentManager.platform;
    if (platform) {
      document.body.classList.add(platform);
    }
  });

  // componentManager.loggingEnabled = true;

  componentManager.streamContextItem((note) => {
    workingNote = note;

     // Only update UI on non-metadata updates.
    if(note.isMetadataUpdate) {
      return;
    }

    editor.value = note.content.text;
    window.upmath.updateText();
  });

  editor.addEventListener("input", function(event) {
    var text = editor.value || "";

    function strip(html) {
      var tmp = document.implementation.createHTMLDocument("New").body;
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }

    function truncateString(string, limit = 90) {
      if(string.length <= limit) {
        return string;
      } else {
        return string.substring(0, limit) + "...";
      }
    }

    function save() {
      componentManager.saveItem(workingNote);
    }

    if(workingNote) {
      // Be sure to capture this object as a variable, as workingNote may be reassigned in `streamContextItem`, so by the time
      // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
      // the right object, and it will save incorrectly.
      let note = workingNote;

      componentManager.saveItemWithPresave(note, () => {
        window.upmath.updateText();

        var html = window.upmath.getHTML();
        var strippedHtml = truncateString(strip(html));

        note.content.preview_plain = strippedHtml;
        note.content.preview_html = null;
        note.content.text = text;
      });
    }
  });

  // Tab handler
  editor.addEventListener('keydown', function(event){
    if (!event.shiftKey && event.which == 9) {
      event.preventDefault();

      console.log(document);

      // Using document.execCommand gives us undo support
      if(!document.execCommand("insertText", false, "\t")) {
        // document.execCommand works great on Chrome/Safari but not Firefox
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var spaces = "    ";

         // Insert 4 spaces
        this.value = this.value.substring(0, start)
          + spaces + this.value.substring(end);

        // Place cursor 4 spaces away from where
        // the tab key was pressed
        this.selectionStart = this.selectionEnd = start + 4;
      }
    }
  });

});
