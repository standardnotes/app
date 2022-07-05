import { GetDeprecatedFeatures } from './DeprecatedFeatures'

it('all deprecated features should have deprecated flag true', async () => {
  for (const feature of GetDeprecatedFeatures()) {
    expect(feature.deprecated).toEqual(true)
  }
})
