import WebDeviceInterface from './lib/web_device_interface.js'
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('application group', function () {
  let device
  let group

  beforeEach(async function () {
    localStorage.clear()

    device = new WebDeviceInterface(setTimeout.bind(window), setInterval.bind(window))
    group = new SNApplicationGroup(device)
  })

  afterEach(async function () {
    if (group.primaryApplication) {
      await Factory.safeDeinit(group.primaryApplication)
    }
    device.deinit()

    localStorage.clear()

    group = undefined
  })

  it('initializing a group should result with primary application', async function () {
    await group.initialize({
      applicationCreator: (descriptor, deviceInterface) => {
        return Factory.createApplicationWithFakeCrypto(descriptor.identifier, deviceInterface)
      },
    })
    expect(group.primaryApplication).to.be.ok
    expect(group.primaryApplication.identifier).to.be.ok
  })

  it('initializing a group should result with proper descriptor setup', async function () {
    await group.initialize({
      applicationCreator: (descriptor, deviceInterface) => {
        return Factory.createApplicationWithFakeCrypto(descriptor.identifier, deviceInterface)
      },
    })
    const identifier = group.primaryApplication.identifier
    expect(group.descriptorRecord[identifier].identifier).to.equal(identifier)
  })

  it('should persist descriptor record after changes', async function () {
    await group.initialize({
      applicationCreator: (descriptor, device) => {
        return Factory.createInitAppWithFakeCryptoWithOptions({
          device: device,
          identifier: descriptor.identifier,
        })
      },
    })
    const identifier = group.primaryApplication.identifier

    const descriptorRecord = await group.device.getJsonParsedRawStorageValue(RawStorageKey.DescriptorRecord)
    expect(descriptorRecord[identifier].identifier).to.equal(identifier)
    expect(descriptorRecord[identifier].primary).to.equal(true)

    await group.unloadCurrentAndCreateNewDescriptor()
    const descriptorRecord2 = await device.getJsonParsedRawStorageValue(RawStorageKey.DescriptorRecord)
    expect(Object.keys(descriptorRecord2).length).to.equal(2)

    expect(descriptorRecord2[identifier].primary).to.equal(false)
  })

  it('adding new application should incrememnt total descriptor count', async function () {
    await group.initialize({
      applicationCreator: (descriptor, device) => {
        return Factory.createInitAppWithFakeCryptoWithOptions({
          device: device,
          identifier: descriptor.identifier,
        })
      },
    })

    await group.unloadCurrentAndCreateNewDescriptor()

    expect(group.getDescriptors().length).to.equal(2)
  })

  it('should be notified when application changes', async function () {
    let notifyCount = 0
    const expectedCount = 2
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      group.addEventObserver(() => {
        notifyCount++
        if (notifyCount === expectedCount) {
          resolve()
        }
      })
      await group.initialize({
        applicationCreator: (descriptor, device) => {
          return Factory.createInitAppWithFakeCryptoWithOptions({
            device: device,
            identifier: descriptor.identifier,
          })
        },
      })
      await group.unloadCurrentAndCreateNewDescriptor()
    }).then(() => {
      expect(notifyCount).to.equal(expectedCount)
    })
  }).timeout(1000)
})
