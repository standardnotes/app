import { bracketSyntaxForBlock, createBlockTextWithSyntaxAndContent, stringIndicesForBlock } from './NoteBlocks'

describe('NoteBlock', () => {
  it('should generate bracketSyntaxForBlock', () => {
    const block = { id: '123' }
    const result = bracketSyntaxForBlock(block)

    expect(result).toEqual({ open: '<Block id=123>', close: '</Block id=123>' })
  })

  it('should generate stringIndicesForBlock', () => {
    const block = { id: '123' }
    const text = '<Block id=123>content</Block id=123>'
    const result = stringIndicesForBlock(text, block)

    expect(result).toEqual({
      open: { start: 0, end: 13 },
      content: { start: 14, end: 20 },
      close: { start: 21, end: 35 },
    })
  })

  it('should generate stringIndicesForBlock with no content', () => {
    const block = { id: '123' }
    const text = '<Block id=123></Block id=123>'
    const result = stringIndicesForBlock(text, block)

    expect(result).toEqual({
      open: { start: 0, end: 13 },
      content: { start: -1, end: -1 },
      close: { start: 14, end: 28 },
    })
  })

  it('should generate stringIndicesForBlock with no content and no close tag', () => {
    const block = { id: '123' }
    const text = '<Block id=123>'
    const result = stringIndicesForBlock(text, block)

    expect(result).toEqual(undefined)
  })

  it('should generate stringIndicesForBlock with no content and no close tag and no open tag', () => {
    const block = { id: '123' }
    const text = 'content'
    const result = stringIndicesForBlock(text, block)

    expect(result).toEqual(undefined)
  })

  it('should generate stringIndicesForBlock with no content and no close tag and no open tag and no content', () => {
    const block = { id: '123' }
    const text = ''
    const result = stringIndicesForBlock(text, block)

    expect(result).toEqual(undefined)
  })

  it('should createBlockTextWithSyntaxAndContent', () => {
    const block = { id: '123' }
    const content = 'content'
    const result = createBlockTextWithSyntaxAndContent(block, content, 0, false)

    expect(result).toEqual('<Block id=123>\ncontent\n</Block id=123>')
  })

  it('should createBlockTextWithSyntaxAndContent with no content', () => {
    const block = { id: '123' }
    const content = ''
    const result = createBlockTextWithSyntaxAndContent(block, content, 0, false)

    expect(result).toEqual('<Block id=123>\n\n</Block id=123>')
  })

  it('should createBlockTextWithSyntaxAndContent with content using block syntax', () => {
    const block = { id: '123' }
    const content = '<Block id=123>'
    const result = createBlockTextWithSyntaxAndContent(block, content, 0, false)

    expect(result).toEqual('<Block id=123>\n<Block id=123>\n</Block id=123>')
  })
})
