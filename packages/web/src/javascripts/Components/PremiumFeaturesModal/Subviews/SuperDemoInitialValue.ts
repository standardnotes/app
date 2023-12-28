import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'

const InitialHTML = `<div>
	<h1>This is a demo of Super notes</h1>
	<p><br></p>
	<p>Super notes are our new <b>rich text</b> experience. With Super notes, you can create <b>rich</b>, <i>dynamic</i> text with powerful options.</p>
  <p><br></p>
	<h2><span>Lists</span></h2>
  <p><br></p>
  <ul>
    <li value="1"><span>Type </span><code spellcheck="false"><span>-</span></code><span> followed by a space in begin a
        list</span></li>
    <li value="2"><span>Type </span><code spellcheck="false"><span>1.</span></code><span> followed by a space in begin a numbered
        list</span></li>
    <li value="3"><span>Type </span><code spellcheck="false"><span>[]</span></code><span> followed by a space
        to begin a checklist </span></li>
  </ul>
	<p><br></p>
	<ul>
    <li value="1"><span>A list</span></li>
    <li value="2">
      <ul>
        <li value="1"><span>Indent the list</span></li>
        <li value="2">
          <ul>
            <li value="1"><span>And even more</span></li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
  <p><br></p>
	<ol>
		<li value="1"><span>A numbered list</span></li>
		<li value="2"><span>With multiple levels</span></li>
		<li value="3"><span>And even more</span></li>
	</ol>
  <p><br></p>
  <ul __lexicallisttype="check">
    <li role="checkbox" tabindex="-1" aria-checked="false" value="1">
      <span>Create</span>
    </li>
    <li role="checkbox" tabindex="-1" aria-checked="true" value="2">
      <span>a</span>
    </li>
    <li role="checkbox" tabindex="-1" aria-checked="true" value="3">
      <span>checklist</span>
    </li>
  </ul>
	<p><br></p>
	<h2><span>Images</span></h2>
  <p><br></p>
  <p>You can add images to your note by selecting the "Image from URL" option from the <code spellcheck="false"><span>/</span></code> menu or Insert menu in the toolbar.</p>
  <p><br></p>
  <p><img src="https://standardnotes.com/static/292c6ba50c69a3ae4f8b1883e7f505f6/1f7f6/vault-wide.jpg" /></p>
  <p><br></p>
	<h2><span>Collapsible sections</span></h2>
	<p><br></p>
	<details open="">
    <summary><span>Collapsible section</span></summary>
    <div data-lexical-collapsible-content="true">
      <p><span>Collapsible sections can include all
          other types of content like</span></p>
      <p><br></p>
      <h2><span>Heading</span></h2>
      <p><br></p>
      <ul>
        <li value="1"><span>a list</span></li>
      </ul>
      <ol>
        <li value="1"><span>numbered</span></li>
      </ol>
      <ul __lexicallisttype="check">
        <li role="checkbox" tabindex="-1" aria-checked="false" value="1"><span>check
            list</span>
        </li>
      </ul>
      <p><br></p>
      <pre spellcheck="false" data-highlight-language="javascript"><span>A</span><span> code block</span></pre>
      <p><br></p>
      <p><span>You can even nest collapsible
          sections.</span></p>
      <p><br></p>
      <details open="">
        <summary><span>Nested collapsible section</span></summary>
        <div data-lexical-collapsible-content="true">
          <blockquote><span>Quote</span></blockquote>
        </div>
      </details>
    </div>
  </details>
	<p><br></p>
	<h2><span>Code blocks</span></h2>
  <p><br></p>
  <p><span>Type </span><code spellcheck="false"><span >\`\`\`</span></code><span> followed by a space to create a code
      block. You can choose the language when your
      cursor is within the code block.</span></p>
  <p><br></p>
  <pre spellcheck="false"
    data-highlight-language="js"><span >function</span><span> </span><span >main</span><span >(</span><span >)</span><span> </span><span >{</span><br><span>	</span><span >const</span><span> variable </span><span >=</span><span> </span><span >"string"</span><span >;</span><br><span>	</span><span >return</span><span> </span><span >TEST</span><span >;</span><br><span >}</span></pre>
	<p><br></p>
  <h2><span>Tables</span></h2>
  <table>
    <colgroup>
      <col>
      <col>
      <col>
    </colgroup>
    <tbody>
      <tr>
        <th>
          <p><span>Header</span></p>
        </th>
        <th>
          <p><span>Column 1</span></p>
        </th>
        <th>
          <p><span>Column 2</span></p>
        </th>
      </tr>
      <tr>
        <th>
          <p><span>Row 1</span></p>
        </th>
        <td>
          <p><span>Row 1 x Column 1</span></p>
        </td>
        <td>
          <p><span>Row 1 x Column 2</span></p>
        </td>
      </tr>
      <tr>
        <th>
          <p><span>Row 2</span></p>
        </th>
        <td>
          <p><span>Row 2 x Column 1</span></p>
        </td>
        <td>
          <p><span>Row 2 x Column 2</span></p>
        </td>
      </tr>
    </tbody>
  </table>
	<p><br></p>
	<h2><span>Passwords</span></h2>
  <p><span>You can generate a secure password using
	the "Generate password" command using the </span><code spellcheck="false"><span >/</span></code><span>
	menu.</span></p>
	<p><br></p>
  <ul>
    <li value="1"><span>}:hcMrIFgaijpkyz</span></li>
    <li value="2"><span>*raF/qi$m?y?iiBS</span></li>
    <li value="3"><span>YuVmWf(gOD&amp;=vjbB</span></li>
  </ul>
</div>`

export function SuperDemoInitialValue() {
  return new HeadlessSuperConverter().convertOtherFormatToSuperString(InitialHTML, 'html', {
    html: {
      addLineBreaks: false,
    },
  })
}
