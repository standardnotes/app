import anyTest, { TestFn } from 'ava'
import { createDriver, Driver } from './driver'

const test = anyTest as TestFn<Driver>

test.beforeEach(async (t) => {
  t.context = await createDriver()
})

test.afterEach.always(async (t) => {
  await t.context.stop()
})

test('has auto-updates enabled by default', async (t) => {
  t.true(await t.context.updates.autoUpdateEnabled())
})

test('reloads the menu after checking for an update', async (t) => {
  await t.context.updates.check()
  t.true(await t.context.appMenu.hasReloaded())
})
