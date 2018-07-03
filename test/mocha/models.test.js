import '../../vendor/assets/javascripts/compiled.js';
import '../../node_modules/chai/chai.js';
import './vendor/chai-as-promised-built.js';
import '../../vendor/assets/javascripts/lodash/lodash.custom.js';
import Factory from './lib/factory.js';

chai.use(chaiAsPromised);
var expect = chai.expect;

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
  tagParams.content.references = [
    {
      uuid: noteParams.uuid,
      content_type: noteParams.content_type
    }
  ]

  noteParams.content.references = []

  return [noteParams, tagParams];
}
describe("notes and tags", () => {

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

    expect(noteParams.content.references.length).to.equal(0);
    expect(tagParams.content.references.length).to.equal(1);

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;

    expect(note.content.references.length).to.equal(0);
    expect(tag.content.references.length).to.equal(1);

    expect(note.hasRelationshipWithItem(tag)).to.equal(false);
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
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.content.references.length).to.equal(0);
    expect(tag.content.references.length).to.equal(1);

    tagParams.content.references = [];
    modelManager.mapResponseItemsToLocalModels([tagParams]);

    expect(tag.content.references.length).to.equal(0);
    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;
  });

  it('resets cached note tags string when tag is deleted from remote source', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.tagsString().length).to.not.equal(0);

    tagParams.deleted = true;
    modelManager.mapResponseItemsToLocalModels([tagParams]);

    // should be null
    expect(note.savedTagsString).to.not.be.ok;

    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);
  });

  it('resets cached note tags string when tag reference is removed from remote source', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.tagsString().length).to.not.equal(0);

    tagParams.content.references = [];
    modelManager.mapResponseItemsToLocalModels([tagParams]);

    // should be null
    expect(note.savedTagsString).to.not.be.ok;

    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);
  });

  it.only('resets cached note tags string when tag is renamed', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.tagsString()).to.equal(`#${tagParams.content.title}`);

    var title = Math.random();

    // Saving involves modifying local state first, then syncing with omitting content.
    tag.title = title;
    tagParams.content.title = title;
    // simulate a save, which omits `content`
    modelManager.mapResponseItemsToLocalModelsOmittingFields([tagParams], ['content']);

    // should be null
    expect(note.savedTagsString).to.not.be.ok;
    expect(note.tagsString()).to.equal(`#${title}`);
  });

  it('handles removing relationship between note and tag', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(note.content.references.length).to.equal(0);
    expect(tag.content.references.length).to.equal(1);

    tag.removeItemAsRelationship(note);
    modelManager.mapResponseItemsToLocalModels([tag]);

    expect(note.tags.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);
  });

  it('properly handles tag duplication', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    // Usually content_type will be provided by a server response
    var duplicateParams = _.merge({content_type: "Tag"}, tag);
    duplicateParams.uuid = null;

    expect(duplicateParams.content_type).to.equal("Tag");
    var duplicateTag = modelManager.createDuplicateItem(duplicateParams);
    modelManager.addDuplicatedItem(duplicateTag, tag);

    expect(tag.uuid).to.not.equal(duplicateTag.uuid);

    expect(tag.content.references.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    expect(duplicateTag.content.references.length).to.equal(1);
    expect(duplicateTag.notes.length).to.equal(1);

    expect(note.tags.length).to.equal(2);

    var noteTag1 = note.tags[0];
    var noteTag2 = note.tags[1];
    expect(noteTag1.uuid).to.not.equal(noteTag2.uuid);

    // expect to be false
    expect(note.dirty).to.not.be.ok;
    expect(tag.dirty).to.not.be.ok;
  });

  it('duplicating a note should maintain its tag references', () => {
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

    var duplicateNote = modelManager.createDuplicateItem(duplicateParams);
    modelManager.addDuplicatedItem(duplicateNote, note);

    expect(note.uuid).to.not.equal(duplicateNote.uuid);

    expect(duplicateNote.tags.length).to.equal(note.tags.length);
  });

  it('deleting a note should update tag references', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(tag.content.references.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    expect(note.content.references.length).to.equal(0);
    expect(note.tags.length).to.equal(1);

    modelManager.setItemToBeDeleted(tag);
    modelManager.mapResponseItemsToLocalModels([tag]);
    expect(tag.content.references.length).to.equal(0);
    expect(tag.notes.length).to.equal(0);
  });

  it('importing existing data should keep relationships valid', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    expect(tag.content.references.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    expect(note.content.references.length).to.equal(0);
    expect(note.tags.length).to.equal(1);

    modelManager.importItems([noteParams, tagParams]);

    expect(modelManager.allItems.length).to.equal(2);

    expect(tag.content.references.length).to.equal(1);
    expect(tag.notes.length).to.equal(1);

    expect(note.content.references.length).to.equal(0);
    expect(note.referencingObjects.length).to.equal(1);
    expect(note.tags.length).to.equal(1);
  });

  it('importing data with differing content should create duplicates', () => {
    let modelManager = Factory.createModelManager();

    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    noteParams.content.title = Math.random();
    tagParams.content.title = Math.random();
    modelManager.importItems([noteParams, tagParams]);

    expect(modelManager.allItems.length).to.equal(4);

    var newNote = modelManager.allItemsMatchingTypes(["Note"])[1];
    var newTag = modelManager.allItemsMatchingTypes(["Tag"])[1];

    expect(newNote.uuid).to.not.equal(note.uuid);
    expect(newTag.uuid).to.not.equal(tag.uuid);

    expect(tag.content.references.length).to.equal(2);
    expect(tag.notes.length).to.equal(2);

    expect(note.content.references.length).to.equal(0);
    expect(note.referencingObjects.length).to.equal(2);
    expect(note.tags.length).to.equal(2);

    expect(newTag.content.references.length).to.equal(1);
    expect(newTag.notes.length).to.equal(1);

    expect(newNote.content.references.length).to.equal(0);
    expect(newNote.referencingObjects.length).to.equal(1);
    expect(newNote.tags.length).to.equal(1);
  });
});

describe("syncing", () => {
  var totalItemCount = 0;

  beforeEach((done) => {
    var email = Factory.globalStandardFile().crypto.generateUUIDSync();
    var password = Factory.globalStandardFile().crypto.generateUUIDSync();
    Factory.globalStorageManager().clearAllData().then(() => {
      Factory.newRegisteredUser(email, password).then((user) => {
        done();
      })
    })
  })

  let modelManager = Factory.createModelManager();
  let authManager = Factory.globalAuthManager();
  let syncManager = new SFSyncManager(modelManager, Factory.globalStorageManager(), Factory.globalHttpManager());

  syncManager.setEventHandler(() => {

  })

  syncManager.setKeyRequestHandler(async () => {
    return {
      keys: await authManager.keys(),
      offline: false
    };
  })

  it('syncing a note many times does not cause duplication', async () => {
    modelManager.resetLocalMemory();
    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    for(var i = 0; i < 25; i++) {
      note.setDirty(true);
      tag.setDirty(true);
      await syncManager.sync();
      expect(tag.content.references.length).to.equal(1);
      expect(note.tags.length).to.equal(1);
      expect(tag.notes.length).to.equal(1);
      expect(modelManager.allItems.length).to.equal(2);

    }
  }).timeout(10000);

  it("handles signing in and merging data", async () => {

    let syncManager = new SFSyncManager(modelManager, Factory.globalStorageManager(), Factory.globalHttpManager());

    syncManager.setEventHandler(() => {})

    // be offline
    syncManager.setKeyRequestHandler(async () => {
      return {
        offline: true
      };
    })

    modelManager.resetLocalMemory();
    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let originalNote = modelManager.allItemsMatchingTypes(["Note"])[0];
    let originalTag = modelManager.allItemsMatchingTypes(["Tag"])[0];
    originalNote.setDirty(true);
    originalTag.setDirty(true);

    await syncManager.sync();

    expect(originalTag.content.references.length).to.equal(1);
    expect(originalTag.notes.length).to.equal(1);
    expect(originalNote.tags.length).to.equal(1);

    // go online
    syncManager.setKeyRequestHandler(async () => {
      return {
        keys: await authManager.keys(),
        offline: false
      };
    })

    // when signing in, all local items are cleared from storage (but kept in memory; to clear desktop logs),
    // then resaved with alternated uuids.
    await Factory.globalStorageManager().clearAllModels();
    return expect(syncManager.markAllItemsDirtyAndSaveOffline(true)).to.be.fulfilled.then(() => {
      let note = modelManager.allItemsMatchingTypes(["Note"])[0];
      let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

      expect(modelManager.allItems.length).to.equal(2);

      expect(note.uuid).to.not.equal(originalNote.uuid);
      expect(tag.uuid).to.not.equal(originalTag.uuid);

      expect(tag.content.references.length).to.equal(1);
      expect(note.content.references.length).to.equal(0);

      expect(note.referencingObjects.length).to.equal(1);
      expect(tag.notes.length).to.equal(1);
      expect(note.tags.length).to.equal(1);
    });
  })

  it('duplicating a tag should maintian its relationships', async () => {
    modelManager.resetLocalMemory();
    let pair = createRelatedNoteTagPair();
    let noteParams = pair[0];
    let tagParams = pair[1];

    modelManager.mapResponseItemsToLocalModels([noteParams, tagParams]);
    let note = modelManager.allItemsMatchingTypes(["Note"])[0];
    let tag = modelManager.allItemsMatchingTypes(["Tag"])[0];

    note.setDirty(true);
    tag.setDirty(true);

    await syncManager.sync();
    await syncManager.clearSyncToken();

    expect(modelManager.allItems.length).to.equal(2);

    tag.title = `${Math.random()}`
    tag.setDirty(true);

    expect(note.referencingObjects.length).to.equal(1);

    // wait about 1s, which is the value the dev server will ignore conflicting changes
    return expect(new Promise((resolve, reject) => {
      setTimeout(function () {
        resolve();
      }, 1100);
    })).to.be.fulfilled.then(async () => {
      return expect(syncManager.sync()).to.be.fulfilled.then(async (response) => {
        // tag should now be conflicted and a copy created
        let models = modelManager.allItems;
        expect(modelManager.allItems.length).to.equal(3);
        var tags = modelManager.allItemsMatchingTypes(["Tag"]);
        var tag1 = tags[0];
        var tag2 = tags[1];

        expect(tag1.uuid).to.not.equal(tag2.uuid);

        expect(tag1.uuid).to.equal(tag.uuid);
        expect(tag2.conflict_of).to.equal(tag1.uuid);
        expect(tag1.notes.length).to.equal(tag2.notes.length);
        expect(tag1.referencingObjects.length).to.equal(0);
        expect(tag2.referencingObjects.length).to.equal(0);

        // Two tags now link to this note
        expect(note.referencingObjects.length).to.equal(2);
        expect(note.referencingObjects[0]).to.not.equal(note.referencingObjects[1]);
      })
    })
  }).timeout(10000);
})
