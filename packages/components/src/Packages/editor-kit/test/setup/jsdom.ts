import { JSDOM } from 'jsdom'
import { htmlTemplate } from './../helpers'

const { window } = new JSDOM(htmlTemplate, {
  resources: 'usable',
  url: 'http://localhost',
})

global.window.alert = jest.fn()
global.window.confirm = jest.fn()
global.window.open = jest.fn()
global.document = window.document
