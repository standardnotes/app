import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

const generateLongString = (minLength = 600) => {
  const BASE = 'Lorem ipsum dolor sit amet. '
  const repeatCount = Math.ceil(minLength / BASE.length)
  return BASE.repeat(repeatCount)
}

const getFilteredNotes = (application, { views }) => {
  const criteria = {
    views,
    includePinned: true,
  }
  application.items.setPrimaryItemDisplayOptions(criteria)
  const notes = application.items.getDisplayableNotes()
  return notes
}

const titles = (items) => {
  return items.map((item) => item.title).sort()
}

describe('notes and smart views', () => {
  let application

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  it('lets me create a smart view and use it', async function () {
    // ## The user creates 3 notes
    const [note_1, note_2, note_3] = await Promise.all([
      Factory.createMappedNote(application, 'long & pinned', generateLongString()),
      Factory.createMappedNote(application, 'long & !pinned', generateLongString()),
      Factory.createMappedNote(application, 'pinned', 'this is a pinned note'),
    ])

    // The user pin 2 notes
    await Promise.all([Factory.pinNote(application, note_1), Factory.pinNote(application, note_3)])

    // ## The user creates smart views (long & pinned)
    const not_pinned = '!["Not Pinned", "pinned", "=", false]'
    const long = '!["Long", "text.length", ">", 500]'

    const tag_not_pinned = await application.mutator.createTagOrSmartView(not_pinned)
    const tag_long = await application.mutator.createTagOrSmartView(long)

    // ## The user can filter and see the pinned notes
    const notes_not_pinned = getFilteredNotes(application, {
      views: [tag_not_pinned],
    })

    expect(titles(notes_not_pinned)).to.eql(['long & !pinned'])

    // ## The user can filter and see the long notes
    const notes_long = getFilteredNotes(application, { views: [tag_long] })
    expect(titles(notes_long)).to.eql(['long & !pinned', 'long & pinned'])

    // ## The user creates a new long note
    await Factory.createMappedNote(application, 'new long', generateLongString())

    // ## The user can filter and see the new long note
    const notes_long2 = getFilteredNotes(application, {
      views: [tag_long],
    })
    expect(titles(notes_long2)).to.eql(['long & !pinned', 'long & pinned', 'new long'])
  })
})
