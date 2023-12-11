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
