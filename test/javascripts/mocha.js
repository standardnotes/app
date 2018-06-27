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

    tagParams.content.references = [
      {
        uuid: noteParams.uuid,
        content_type: noteParams.content_type
      }
    ]

    return [noteParams, tagParams];
  }

  it('uses proper class for note', () => {
    let modelManager = createModelManager();
    let noteParams = getNoteParams();
    modelManager.mapResponseItemsToLocalModels([noteParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    expect(note).to.be.an.instanceOf(Note);
  });

  it('creates two-way relationship between note and tag', () => {
    let modelManager = createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    expect(tagParams.content.references.length).to.equal(1);
    expect(tagParams.content.references.length).to.equal(1);

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;

    expect(note).to.not.be.null;
    expect(tag).to.not.be.null;

    expect(note.content.references.length).to.equal(1);
    expect(tag.content.references.length).to.equal(1);

    expect(note.hasRelationshipWithItem(tag)).to.equal(true);
    expect(tag.hasRelationshipWithItem(note)).to.equal(true);

    expect(note.tags.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    modelManager.setItemToBeDeleted(note);
    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);

    // expect to be true
    expect(note.dirty).to.be.ok;
    expect(tag.dirty).to.be.ok;
  });

  it('handles remote deletion of relationship', () => {
    let modelManager = createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.content.references.length).to.equal(1);
    expect(tag.content.references.length).to.equal(1);

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
    let modelManager = createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    var duplicateNote = modelManager.createDuplicateItem(note);
    expect(note.uuid).to.equal(duplicateNote.uuid);

    expect(duplicateNote.content.references.length).to.equal(1);
    expect(duplicateNote.tags.length).to.equal(1);

    expect(tag.content.references.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;
  });
});
