import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('tags as folders', () => {
  let context
  let application

  beforeEach(async function () {
    localStorage.clear()
    context = await Factory.createAppContext()
    await context.launch()
    application = context.application
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    context = undefined
    application = undefined
    localStorage.clear()
  })

  it('lets me create a tag, add relationships, move a note to a children, and query data all along', async function () {
    // ## The user creates four tags
    let tagChildren = await Factory.createMappedTag(application, {
      title: 'children',
    })
    let tagParent = await Factory.createMappedTag(application, {
      title: 'parent',
    })
    let tagGrandParent = await Factory.createMappedTag(application, {
      title: 'grandparent',
    })
    let tagGrandParent2 = await Factory.createMappedTag(application, {
      title: 'grandparent2',
    })

    // ## Now the users moves the tag children into the parent
    await application.mutator.setTagParent(tagParent, tagChildren)

    expect(application.items.getTagParent(tagChildren)).to.equal(tagParent)
    expect(Uuids(application.items.getTagChildren(tagParent))).deep.to.equal(Uuids([tagChildren]))

    // ## Now the user moves the tag parent into the grand parent
    await application.mutator.setTagParent(tagGrandParent, tagParent)

    expect(application.items.getTagParent(tagParent)).to.equal(tagGrandParent)
    expect(Uuids(application.items.getTagChildren(tagGrandParent))).deep.to.equal(Uuids([tagParent]))

    // ## Now the user moves the tag parent into another grand parent
    await application.mutator.setTagParent(tagGrandParent2, tagParent)

    expect(application.items.getTagParent(tagParent)).to.equal(tagGrandParent2)
    expect(application.items.getTagChildren(tagGrandParent)).deep.to.equal([])
    expect(Uuids(application.items.getTagChildren(tagGrandParent2))).deep.to.equal(Uuids([tagParent]))

    // ## Now the user tries to move the tag into one of its children
    await expect(application.mutator.setTagParent(tagChildren, tagParent)).to.eventually.be.rejected

    expect(application.items.getTagParent(tagParent)).to.equal(tagGrandParent2)
    expect(application.items.getTagChildren(tagGrandParent)).deep.to.equal([])
    expect(Uuids(application.items.getTagChildren(tagGrandParent2))).deep.to.equal(Uuids([tagParent]))

    // ## Now the user move the tag outside any hierarchy
    await application.mutator.unsetTagParent(tagParent)

    expect(application.items.getTagParent(tagParent)).to.equal(undefined)
    expect(application.items.getTagChildren(tagGrandParent2)).deep.to.equals([])
  })

  it('lets me add a note to a tag hierarchy', async function () {
    // ## The user creates four tags hierarchy
    const tags = await Factory.createTags(application, {
      grandparent: { parent: { child: true } },
      another: true,
    })

    const note1 = await Factory.createMappedNote(application, 'my first note')
    const note2 = await Factory.createMappedNote(application, 'my second note')

    // ## The user add a note to the child tag
    await application.mutator.addTagToNote(note1, tags.child, true)
    await application.mutator.addTagToNote(note2, tags.another, true)

    // ## The note has been added to other tags
    const note1Tags = await application.items.getSortedTagsForItem(note1)
    const note2Tags = await application.items.getSortedTagsForItem(note2)

    expect(note1Tags.length).to.equal(3)
    expect(note2Tags.length).to.equal(1)
  })
})
