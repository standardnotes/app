import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'

const InitialHTML = `<div>
	<h1>This is a demo of Super notes</h1>
	<p>Super notes are our new <b>rich text</b> experience. With Super notes, you can create <b>rich</b>, <i>dynamic</i> text with powerful options.</p>
</div>`

export function SuperDemoInitialValue() {
  return new HeadlessSuperConverter().convertOtherFormatToSuperString(InitialHTML, 'html')
}
