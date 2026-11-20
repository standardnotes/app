export const enex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="20210408T052957Z" application="Evernote" version="10.8.5">
  <note>
    <title>Testing 1</title>
    <created>20210308T051614Z</created>
    <updated>20210308T051855Z</updated>
    <tag>distant reading</tag>
    <note-attributes>
    </note-attributes>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>This is a test.</div><ul></ul><li></li><ol></ol><font><span>h</span><span>e</span></font></en-note>      ]]>
    </content>
  </note>
  <note>
    <title></title>
    <created>20200508T234829Z</created>
    <updated>20200508T235233Z</updated>
    <tag>distant reading</tag>
    <note-attributes>
    </note-attributes>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div></en-note>      ]]>
    </content>
  </note>
  <note>
    <title></title>
    <created>20200508T234829Z</created>
    <updated>20200508T235233Z</updated>
    <note-attributes>
    </note-attributes>
    <content>
    </content>
  </note>
</en-export>`

export const highlightEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="20210408T052957Z" application="Evernote" version="10.8.5">
  <note>
    <title>Highlight test</title>
    <created>20210308T051614Z</created>
    <updated>20210308T051855Z</updated>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>Line 1</div><div><span style="--en-highlight:yellow;background-color: #ffef9e;">Line 2</span></div></en-note>]]>
    </content>
  </note>
</en-export>`

export const checkboxEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="20221222T043818Z" application="Evernote" version="10.49.4">
  <note>
    <title>Checkbox test</title>
    <created>20221122T043758Z</created>
    <updated>20221122T043813Z</updated>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><ul style="--en-todo:true;"><li style="--en-checked:true;"><div>Line 1</div></li><li><div>Line 2</div></li></ul></en-note>]]>
    </content>
  </note>
</en-export>`

export const enTodoEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export2.dtd">
<en-export export-date="20200622T091735Z" application="Evernote/Windows" version="6.x">
  <note>
    <title>En-todo test</title>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note><div><en-todo checked="true"/>Checked item<br/></div><div><en-todo checked="false"/>Unchecked item<br/></div></en-note>]]></content>
    <created>20200622T091652Z</created>
    <updated>20200622T091707Z</updated>
  </note>
</en-export>`

export const styledInlineEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="20261016T182530Z" application="Evernote" version="11.38.5">
  <note>
    <title>Styled inline test</title>
    <created>20180808T013559Z</created>
    <updated>20190217T101724Z</updated>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div><span style="font-weight: bold; text-decoration: underline; font-size: 14pt;">General:</span></div><div><span style="font-weight: bold;">challenge</span></div></en-note>]]>
    </content>
  </note>
</en-export>`

export const codeBlockEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="20261016T182530Z" application="Evernote" version="11.38.5">
  <note>
    <title>Code block test</title>
    <created>20180808T013559Z</created>
    <updated>20190217T101724Z</updated>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>Before</div><div style="--en-codeblock:true; --en-syntaxLanguage:sql; box-sizing: border-box; padding: 8px; font-family: Monaco, Menlo, Consolas, 'Courier New', monospace; font-size: 12px; color: rgb(51, 51, 51); border-radius: 4px; background-color: rgb(251, 250, 248); border: 1px solid rgba(0, 0, 0, 0.15); background-image: none; background-attachment: scroll; background-origin: padding-box; background-clip: border-box; background-size: auto; background-position: 0% 0%; background-repeat: repeat;"><div>SELECT id, name</div><div>FROM users</div><div><br/></div><div>&nbsp;&nbsp;WHERE id &lt; 10 AND name = 'a &amp; b';</div></div><div>After</div></en-note>]]>
    </content>
  </note>
</en-export>`

export const emptyLineEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="20210408T052957Z" application="Evernote" version="10.8.5">
  <note>
    <title>Empty line test</title>
    <created>20210308T051614Z</created>
    <updated>20210308T051855Z</updated>
    <content>
      <![CDATA[<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>line1</div><div><br/></div><div>line2</div></en-note>]]>
    </content>
  </note>
</en-export>`

export function createTestResourceElement(
  shouldHaveMimeType = true,
  shouldHaveSourceUrl = false,
  shouldHaveFileName = true,
  shouldHaveData = true,
  encoding = 'base64',
): Element {
  const resourceElement = document.createElement('resource')

  if (shouldHaveMimeType) {
    const mimeTypeElement = document.createElement('mime')
    mimeTypeElement.textContent = 'image/png'
    resourceElement.appendChild(mimeTypeElement)
  }

  const attributesElement = document.createElement('resource-attributes')

  if (shouldHaveSourceUrl) {
    const sourceUrlElement = document.createElement('source-url')
    sourceUrlElement.textContent =
      'en-cache://tokenKey%3D%22AuthToken%3AUser%3A212093785%22+8596a26a-92b0-4dd8-9ded-16266ccbf3f3+8eb2fb2aeb08edb45f78512f3b8e9d35+https://www.evernote.com/shard/s609/res/e8cf9bb5-90b7-440c-a333-c2910afaa65b'
    attributesElement.appendChild(sourceUrlElement)
  }

  if (shouldHaveFileName) {
    const fileNameElement = document.createElement('file-name')
    fileNameElement.textContent = 'image.png'
    attributesElement.appendChild(fileNameElement)
  }

  resourceElement.appendChild(attributesElement)

  const dataElement = document.createElement('data')
  if (shouldHaveData) {
    dataElement.setAttribute('encoding', encoding)
    dataElement.textContent = 'data:text/plain;base64,SAo='
  }
  resourceElement.appendChild(dataElement)

  return resourceElement
}
