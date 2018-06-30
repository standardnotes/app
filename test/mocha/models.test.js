import '../../vendor/assets/javascripts/compiled.js';
import '../../node_modules/chai/chai.js';
import './vendor/chai-as-promised-built.js';
import '../../vendor/assets/javascripts/lodash/lodash.custom.js';
import Factory from './lib/factory.js';

chai.use(chaiAsPromised);
var expect = chai.expect;

describe("notes and tags", () => {
  const getNoteParams = () => {
    var params = {
      uuid: SFJS.crypto.generateUUIDSync(),
      content_type: "Note",
      content: {
        title: "hello",
        text: "world"
      }
    };
    return params;
  }

  const createRelatedNoteTagPair = () => {
    let noteParams = getNoteParams();
    let tagParams = {
      uuid: SFJS.crypto.generateUUIDSync(),
      content_type: "Tag",
      content: {
        title: "thoughts",
      }
    };
    noteParams.content.references = [
      {
        uuid: tagParams.uuid,
        content_type: tagParams.content_type
      }
    ]

    tagParams.content.references = []

    return [noteParams, tagParams];
  }

  it('uses proper class for note', () => {
    let modelManager = Factory.createModelManager();
    let noteParams = getNoteParams();
    modelManager.mapResponseItemsToLocalModels([noteParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    expect(note).to.be.an.instanceOf(Note);
  });

  it('creates two-way relationship between note and tag', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    expect(noteParams.content.references.length).to.equal(1);
    expect(tagParams.content.references.length).to.equal(0);

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;

    expect(note).to.not.be.null;
    expect(tag).to.not.be.null;

    expect(note.content.references.length).to.equal(1);
    expect(tag.content.references.length).to.equal(0);

    expect(note.hasRelationshipWithItem(tag)).to.equal(true);
    expect(tag.hasRelationshipWithItem(note)).to.equal(false);

    expect(note.tags.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    modelManager.setItemToBeDeleted(note);
    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);

    // expect to be true
    expect(note.dirty).to.be.ok;

    // expect to be false
    expect(tag.dirty).to.not.be.ok;
  });

  it('handles remote deletion of relationship', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.content.references.length).to.equal(1);
    expect(tag.content.references.length).to.equal(0);

    noteParams.content.references = [];
    modelManager.mapResponseItemsToLocalModels([noteParams]);

    expect(note.content.references.length).to.equal(0);
    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;
  });

  it('properly handles duplication', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    // Usually content_type will be provided by a server response
    var duplicateParams = _.merge({content_type: "Note"}, note);
    duplicateParams.uuid = null;

    expect(duplicateParams.content_type).to.equal("Note");
    var duplicateNote = modelManager.createDuplicateItem(duplicateParams);
    modelManager.addItem(duplicateNote);

    expect(note.uuid).to.not.equal(duplicateNote.uuid);

    expect(note.content.references.length).to.equal(1);
    expect(note.tags.length).to.equal(1);

    expect(duplicateNote.content.references.length).to.equal(1);
    expect(duplicateNote.tags.length).to.equal(1);

    expect(tag.content.references.length).to.equal(0);
    expect(tag.notes.length).to.equal(2);

    var tagNote1 = tag.notes[0];
    var tagNote2 = tag.notes[1];
    expect(tagNote1.uuid).to.not.equal(tagNote2.uuid);

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;
  });

  it('deleting a tag should update note references', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.content.references.length).to.equal(1);
    expect(note.tags.length).to.equal(1);

    expect(tag.content.references.length).to.equal(0);
    expect(tag.notes.length).to.equal(1);

    modelManager.setItemToBeDeleted(tag);
    modelManager.mapResponseItemsToLocalModels([tag]);
    // expect(tag.notes.length).to.equal(0);
    expect(note.content.references.length).to.equal(0);
    expect(note.tags.length).to.equal(0);
  });
});
