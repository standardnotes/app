/**
 * @jest-environment jsdom
 */

import { searchInElement } from './searchInElement'

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    children?: HTMLElement[]
    text?: string
  } = {},
) {
  const element = document.createElement(tag)
  const { text } = options
  if (text) {
    element.textContent = text
  }
  return element
}

const singularSpanInDiv = () => {
  const div = createElement('div')
  const span = createElement('span', {
    text: 'Hello world',
  })
  div.append(span)
  return div
}

function expectRange(range: Range, [startNode, startIdx, endNode, endIdx]: [Node, number, Node, number]) {
  expect(range.startContainer).toBe(startNode)
  expect(range.startOffset).toBe(startIdx)
  expect(range.endContainer).toBe(endNode)
  expect(range.endOffset).toBe(endIdx)
}

describe('searchInElement', () => {
  test('empty query', () => {
    const div = createElement('div')
    const results = searchInElement(div, '', false)
    expect(results.length).toBe(0)
  })

  test('empty text node', () => {
    const span = createElement('span')
    const text = document.createTextNode('')
    span.append(text)
    const results = searchInElement(span, 'hello', false)
    expect(results.length).toBe(0)
  })

  describe('basic search', () => {
    test('scenario 1', () => {
      const div = singularSpanInDiv()
      const span = div.children[0]
      const results = searchInElement(div, 'hello', false)
      expect(results.length).toBe(1)
      const node = span.childNodes[0]
      expectRange(results[0], [node, 0, node, 5])
    })

    test('scenario 2', () => {
      const div = createElement('div')
      const span = createElement('span', { text: 'l' })
      div.append(span)
      const results = searchInElement(div, 'l', false)
      expect(results.length).toBe(1)
      const node = span.childNodes[0]
      expectRange(results[0], [node, 0, node, 1])
    })
  })

  describe('case sensitivity', () => {
    test('valid', () => {
      const div = singularSpanInDiv()
      const span = div.children[0]
      const results = searchInElement(div, 'Hello', true)
      expect(results.length).toBe(1)
      const node = span.childNodes[0]
      expectRange(results[0], [node, 0, node, 5])
    })

    test('invalid', () => {
      const div = singularSpanInDiv()
      const results = searchInElement(div, 'hello', true)
      expect(results.length).toBe(0)
    })
  })

  describe('multiple in one node', () => {
    test('scenario 1', () => {
      const span = createElement('span', { text: 'Elelelo' })
      const node = span.childNodes[0]

      let results = searchInElement(span, 'l', false)
      expect(results.length).toBe(3)
      expectRange(results[0], [node, 1, node, 2])
      expectRange(results[1], [node, 3, node, 4])
      expectRange(results[2], [node, 5, node, 6])
    })

    test('scenario 2', () => {
      const span = createElement('span', { text: 'Elelelo' })
      const node = span.childNodes[0]

      const results = searchInElement(span, 'e', true)
      expect(results.length).toBe(2)
      expectRange(results[0], [node, 2, node, 3])
      expectRange(results[1], [node, 4, node, 5])
    })

    test('scenario 3', () => {
      const span = createElement('span', { text: 'EeEeEe' })
      const node = span.childNodes[0]

      const results = searchInElement(span, 'e', false)
      expect(results.length).toBe(6)
      expectRange(results[0], [node, 0, node, 1])
      expectRange(results[1], [node, 1, node, 2])
      expectRange(results[2], [node, 2, node, 3])
      expectRange(results[3], [node, 3, node, 4])
      expectRange(results[4], [node, 4, node, 5])
      expectRange(results[5], [node, 5, node, 6])
    })

    test('scenario 4', () => {
      const span = createElement('span', { text: 'EeEeEe' })
      const node = span.childNodes[0]

      const results = searchInElement(span, 'e', true)
      expect(results.length).toBe(3)
      expectRange(results[0], [node, 1, node, 2])
      expectRange(results[1], [node, 3, node, 4])
      expectRange(results[2], [node, 5, node, 6])
    })
  })

  test('multiple in multiple nodes', () => {
    const div = createElement('div')
    const span1 = createElement('span', { text: 'Elloello' })
    const span2 = createElement('span', { text: 'Olleolle' })
    div.append(span1, span2)
    const node1 = span1.childNodes[0]
    const node2 = span2.childNodes[0]

    let results = searchInElement(div, 'e', false)
    expect(results.length).toBe(4)
    expectRange(results[0], [node1, 0, node1, 1])
    expectRange(results[1], [node1, 4, node1, 5])
    expectRange(results[2], [node2, 3, node2, 4])
    expectRange(results[3], [node2, 7, node2, 8])
  })

  describe('Single across multiple nodes', () => {
    test('scenario 1', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hello ' })
      const span2 = createElement('span', { text: 'World' })
      div.append(span1, span2)

      const results = searchInElement(div, 'Hello World', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span1.childNodes[0], 0, span2.childNodes[0], 5])
    })

    test('scenario 2', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hello' })
      const span2 = createElement('span', { text: ' ' })
      const span3 = createElement('span', { text: 'World' })
      div.append(span1, span2, span3)

      const results = searchInElement(div, 'lo wo', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span1.childNodes[0], 3, span3.childNodes[0], 2])
    })

    test('scenario 3', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hel' })
      const span2 = createElement('span', { text: 'lo' })
      const span3 = createElement('span', { text: ' ' })
      const span4 = createElement('span', { text: 'Wo' })
      const span5 = createElement('span', { text: 'rld' })
      div.append(span1, span2, span3, span4, span5)

      const results = searchInElement(div, 'lo wo', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span2.childNodes[0], 0, span4.childNodes[0], 2])
    })

    test('scenario 4', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hel' })
      const span2 = createElement('span', { text: 'lo' })
      const span3 = createElement('span', { text: ' ' })
      const span4 = createElement('span', { text: 'Wo' })
      const span5 = createElement('span', { text: 'rld' })
      div.append(span1, span2, span3, span4, span5)

      const results = searchInElement(div, 'lo wo', true)
      expect(results.length).toBe(0)
    })
  })

  describe('Multiple across multiple nodes', () => {
    test('scenario 1', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hel' })
      const span2 = createElement('span', { text: 'lo' })
      const span3 = createElement('span', { text: ' ' })
      const span4 = createElement('span', { text: 'He' })
      const span5 = createElement('span', { text: 'llo' })
      div.append(span1, span2, span3, span4, span5)

      const results = searchInElement(div, 'Hello', false)
      expect(results.length).toBe(2)
      expectRange(results[0], [span1.childNodes[0], 0, span2.childNodes[0], 2])
      expectRange(results[1], [span4.childNodes[0], 0, span5.childNodes[0], 3])
    })

    test('scenario 2', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'Hello' })
      const span2 = createElement('span', { text: ' ' })
      const span3 = createElement('span', { text: 'He' })
      const span4 = createElement('span', { text: 'llo' })
      div.append(span1, span2, span3, span4)

      const results = searchInElement(div, 'Hello', false)
      expect(results.length).toBe(2)
      expectRange(results[0], [span1.childNodes[0], 0, span1.childNodes[0], 5])
      expectRange(results[1], [span3.childNodes[0], 0, span4.childNodes[0], 3])
    })

    test('scenario 3', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'hello' })
      const span2 = createElement('span', { text: ' ' })
      const span3 = createElement('span', { text: 'He' })
      const span4 = createElement('span', { text: 'llo' })
      div.append(span1, span2, span3, span4)

      const results = searchInElement(div, 'Hello', true)
      expect(results.length).toBe(1)
      expectRange(results[0], [span3.childNodes[0], 0, span4.childNodes[0], 3])
    })
  })

  describe('Repeating characters', () => {
    test('scenario 1', () => {
      const span = createElement('span', { text: 'ttest' })

      const results = searchInElement(span, 'test', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span.childNodes[0], 1, span.childNodes[0], 5])
    })

    test('scenario 2', () => {
      const span = createElement('span', { text: 'ttestttest' })

      const results = searchInElement(span, 'test', false)
      expect(results.length).toBe(2)
      expectRange(results[0], [span.childNodes[0], 1, span.childNodes[0], 5])
      expectRange(results[1], [span.childNodes[0], 6, span.childNodes[0], 10])
    })

    test('scenario 3', () => {
      const span = createElement('span', { text: 'ttesttTest' })

      const results = searchInElement(span, 'test', true)
      expect(results.length).toBe(1)
      expectRange(results[0], [span.childNodes[0], 1, span.childNodes[0], 5])
    })

    test('scenario 4', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'tte' })
      const span2 = createElement('span', { text: 'stt' })
      div.append(span1, span2)

      const results = searchInElement(div, 'test', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span1.childNodes[0], 1, span2.childNodes[0], 2])
    })

    test('scenario 5', () => {
      const div = createElement('div')
      const span1 = createElement('span', { text: 'stt' })
      const span2 = createElement('span', { text: 'testt' })
      div.append(span1, span2)

      const results = searchInElement(div, 'test', false)
      expect(results.length).toBe(1)
      expectRange(results[0], [span2.childNodes[0], 0, span2.childNodes[0], 4])
    })
  })
})
