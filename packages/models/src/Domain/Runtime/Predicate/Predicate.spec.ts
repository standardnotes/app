/* eslint-disable @typescript-eslint/no-explicit-any */

import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import {
  compoundPredicateFromArguments,
  includesPredicateFromArguments,
  notPredicateFromArguments,
  predicateFromArguments,
  predicateFromDSLString,
} from './Generators'
import { IncludesPredicate } from './IncludesPredicate'
import { Predicate } from './Predicate'
import { CompoundPredicate } from './CompoundPredicate'
import { NotPredicate } from './NotPredicate'
import { ContentType } from '@standardnotes/domain-core'

interface Item extends ItemInterface {
  content_type: string
  updated_at: Date
}

interface Note extends Item {
  title: string
  text: string
  tags: Tag[]
}

interface Tag extends Item {
  title: string
}

function createNote(content: Record<string, unknown>, tags?: Tag[]): Note {
  return {
    ...content,
    content_type: ContentType.TYPES.Note,
    tags,
  } as jest.Mocked<Note>
}

function createTag(title: string): Tag {
  return {
    title,
    content_type: ContentType.TYPES.Tag,
  } as jest.Mocked<Tag>
}

function createItem(content: Record<string, unknown>, updatedAt?: Date): Item {
  return {
    ...content,
    updated_at: updatedAt,
    content_type: ContentType.TYPES.Any,
  } as jest.Mocked<Note>
}

const createNoteContent = (title = 'Hello', desc = 'World') => {
  const params = {
    title: title,
    text: desc,
  }
  return params
}

const tags = [createTag('foo'), createTag('bar'), createTag('far')]

describe('predicates', () => {
  it('string comparisons should be case insensitive', () => {
    const string = '!["Not notes", "title", "startsWith", "foo"]'
    const predicate = predicateFromDSLString(string)

    const matchingItem1 = createTag('foo')

    expect(predicate.matchesItem(matchingItem1)).toEqual(true)

    const matchingItem2 = {
      title: 'Foo',
    } as jest.Mocked<Note>

    expect(predicate.matchesItem(matchingItem2)).toEqual(true)
  })

  describe('includes operator', () => {
    let item: Note
    beforeEach(() => {
      item = createNote(createNoteContent(), tags)
    })

    it('includes string', () => {
      expect(new Predicate<Note>('title', 'includes', 'ello').matchesItem(item)).toEqual(true)
    })
  })

  describe('or operator', () => {
    let item: Note
    const title = 'Hello'
    beforeEach(() => {
      item = createNote(createNoteContent(title))
    })

    it('both matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('or', [
          { keypath: 'title', operator: '=', value: 'Hello' },
          { keypath: 'content_type', operator: '=', value: ContentType.TYPES.Note },
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('first matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('or', [
          { keypath: 'title', operator: '=', value: 'Hello' },
          { keypath: 'content_type', operator: '=', value: 'Wrong' },
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('second matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('or', [
          { keypath: 'title', operator: '=', value: 'Wrong' },
          { keypath: 'content_type', operator: '=', value: ContentType.TYPES.Note },
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('both nonmatching', () => {
      expect(
        compoundPredicateFromArguments<Note>('or', [
          { keypath: 'title', operator: '=', value: 'Wrong' },
          { keypath: 'content_type', operator: '=', value: 'Wrong' },
        ]).matchesItem(item),
      ).toEqual(false)
    })
  })

  describe('includes operator', () => {
    let item: Note
    const title = 'Foo'
    beforeEach(() => {
      item = createNote(createNoteContent(title), tags)
    })

    it('all matching', () => {
      const predicate = new IncludesPredicate<Note>('tags', new Predicate<Note>('title', 'in', ['sobar', 'foo']))

      expect(predicate.matchesItem(item)).toEqual(true)
    })
  })

  describe('and operator', () => {
    let item: Note
    const title = 'Foo'
    beforeEach(() => {
      item = createNote(createNoteContent(title))
    })

    it('all matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('and', [
          { keypath: 'title', operator: '=', value: title },
          { keypath: 'content_type', operator: '=', value: ContentType.TYPES.Note },
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('one matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('and', [
          { keypath: 'title', operator: '=', value: 'Wrong' },
          { keypath: 'content_type', operator: '=', value: ContentType.TYPES.Note },
        ]).matchesItem(item),
      ).toEqual(false)
    })

    it('none matching', () => {
      expect(
        compoundPredicateFromArguments<Note>('and', [
          { keypath: 'title', operator: '=', value: '123' },
          { keypath: 'content_type', operator: '=', value: '456' },
        ]).matchesItem(item),
      ).toEqual(false)
    })

    it('explicit compound syntax', () => {
      const compoundProd = new CompoundPredicate('and', [
        new Predicate<Note>('title', '=', title),
        new Predicate('content_type', '=', ContentType.TYPES.Note),
      ])
      expect(compoundProd.matchesItem(item)).toEqual(true)
    })
  })

  describe('not operator', function () {
    let item: Note
    beforeEach(() => {
      item = createNote(createNoteContent(), tags)
    })

    it('basic not predicate', () => {
      expect(
        new NotPredicate<Note>(
          new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'far')),
        ).matchesItem(item),
      ).toEqual(false)
    })

    it('recursive compound predicate', () => {
      expect(
        new CompoundPredicate<Note>('and', [
          new NotPredicate<Note>(new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'far'))),
          new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'foo')),
        ]).matchesItem(item),
      ).toEqual(false)
    })

    it('matching basic operator', () => {
      expect(
        notPredicateFromArguments<Note>({
          keypath: 'title',
          operator: '=',
          value: 'Not This Title',
        }).matchesItem(item),
      ).toEqual(true)
    })

    it('nonmatching basic operator', () => {
      expect(
        notPredicateFromArguments<Note>({
          keypath: 'title',
          operator: '=',
          value: 'Hello',
        }).matchesItem(item),
      ).toEqual(false)
    })

    it('matching compound', () => {
      expect(
        new CompoundPredicate<Note>('and', [
          new NotPredicate<Note>(new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'boo'))),
          new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'foo')),
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('matching compound includes', () => {
      const andPredicate = new CompoundPredicate<Note>('and', [
        predicateFromArguments('title', 'startsWith', 'H'),
        includesPredicateFromArguments<Note>('tags', {
          keypath: 'title',
          operator: '=',
          value: 'falsify',
        }),
      ])
      expect(new NotPredicate<Note>(andPredicate).matchesItem(item)).toEqual(true)
    })

    it('nonmatching compound includes', () => {
      expect(
        new NotPredicate<Note>(
          new CompoundPredicate<Note>('and', [
            new Predicate<Note>('title', 'startsWith', 'H'),
            new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'foo')),
          ]),
        ).matchesItem(item),
      ).toEqual(false)
    })

    it('nonmatching compound or', () => {
      expect(
        new NotPredicate<Note>(
          new CompoundPredicate<Note>('or', [
            new Predicate<Note>('title', 'startsWith', 'H'),
            new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'falsify')),
          ]),
        ).matchesItem(item),
      ).toEqual(false)
    })

    it('matching compound or', () => {
      expect(
        new NotPredicate<Note>(
          new CompoundPredicate<Note>('or', [
            new Predicate<Note>('title', 'startsWith', 'Z'),
            new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'falsify')),
          ]),
        ).matchesItem(item),
      ).toEqual(true)
    })
  })

  describe('regex', () => {
    it('matching', () => {
      const item = createNote(createNoteContent('abc'))
      const onlyLetters = new Predicate<Note>('title', 'matches', '^[a-zA-Z]+$')
      expect(onlyLetters.matchesItem(item)).toEqual(true)
    })

    it('nonmatching', () => {
      const item = createNote(createNoteContent('123'))
      const onlyLetters = new Predicate<Note>('title', 'matches', '^[a-zA-Z]+$')
      expect(onlyLetters.matchesItem(item)).toEqual(false)
    })
  })

  describe('deep recursion', () => {
    let item: Note
    const title = 'Hello'
    beforeEach(() => {
      item = createNote(createNoteContent(title))
    })

    it('matching', () => {
      expect(
        new CompoundPredicate<Note>('and', [
          new Predicate<Note>('title', '=', 'Hello'),
          new CompoundPredicate<Note>('or', [
            new Predicate<Note>('title', '=', 'Wrong'),
            new Predicate<Note>('title', '=', 'Wrong again'),
            new Predicate<Note>('title', '=', 'Hello'),
          ]),
        ]).matchesItem(item),
      ).toEqual(true)
    })

    it('nonmatching', () => {
      expect(
        new CompoundPredicate<Note>('and', [
          new Predicate<Note>('title', '=', 'Hello'),
          new CompoundPredicate<Note>('or', [
            new Predicate<Note>('title', '=', 'Wrong'),
            new Predicate<Note>('title', '=', 'Wrong again'),
            new Predicate<Note>('title', '=', 'All wrong'),
          ]),
        ]).matchesItem(item),
      ).toEqual(false)
    })
  })

  describe('inequality operator', () => {
    let item: Item
    const body = 'Hello'
    const numbers = ['1', '2', '3']

    beforeEach(() => {
      item = createItem({ body, numbers })
    })

    it('matching', () => {
      expect(new Predicate<any>('body', '!=', 'NotBody').matchesItem(item)).toEqual(true)
    })

    it('nonmatching', () => {
      expect(new Predicate<any>('body', '!=', body).matchesItem(item)).toEqual(false)
    })

    it('matching array', () => {
      expect(new Predicate<any>('numbers', '!=', ['1']).matchesItem(item)).toEqual(true)
    })

    it('nonmatching array', () => {
      expect(new Predicate<any>('numbers', '!=', ['1', '2', '3']).matchesItem(item)).toEqual(false)
    })
  })

  describe('equals operator', () => {
    let item: Item
    const body = 'Hello'
    const numbers = ['1', '2', '3']

    beforeEach(() => {
      item = createItem({ body, numbers })
    })

    it('matching', () => {
      expect(new Predicate<any>('body', '=', body).matchesItem(item)).toEqual(true)
    })

    it('nonmatching', () => {
      expect(new Predicate<any>('body', '=', 'NotBody').matchesItem(item)).toEqual(false)
    })

    it('false and undefined should be equivalent', () => {
      expect(new Predicate<any>('undefinedProperty', '=', false).matchesItem(item)).toEqual(true)
    })

    it('nonmatching array', () => {
      expect(new Predicate<any>('numbers', '=', ['1']).matchesItem(item)).toEqual(false)
    })

    it('matching array', () => {
      expect(new Predicate<any>('numbers', '=', ['1', '2', '3']).matchesItem(item)).toEqual(true)
    })

    it('nested keypath', () => {
      expect(new Predicate<any>('numbers.length', '=', numbers.length).matchesItem(item)).toEqual(true)
    })
  })

  describe('date comparison', () => {
    let item: Item
    const date = new Date()

    beforeEach(() => {
      item = createItem({}, date)
    })

    it('nonmatching date value', () => {
      const date = new Date()
      date.setSeconds(date.getSeconds() + 1)
      const predicate = new Predicate('updated_at', '>', date)
      expect(predicate.matchesItem(item)).toEqual(false)
    })

    it('matching date value', () => {
      const date = new Date()
      date.setSeconds(date.getSeconds() + 1)
      const predicate = new Predicate('updated_at', '<', date)
      expect(predicate.matchesItem(item)).toEqual(true)
    })

    it('matching days ago value', () => {
      expect(new Predicate('updated_at', '>', '30.days.ago').matchesItem(item)).toEqual(true)
    })

    it('nonmatching days ago value', () => {
      expect(new Predicate('updated_at', '<', '30.days.ago').matchesItem(item)).toEqual(false)
    })

    it('hours ago value', () => {
      expect(new Predicate('updated_at', '>', '1.hours.ago').matchesItem(item)).toEqual(true)
    })

    it('nonmatching hours ago value', () => {
      expect(new Predicate('updated_at', '<', '1.hours.ago').matchesItem(item)).toEqual(false)
    })

    it('months ago value', () => {
      expect(new Predicate('updated_at', '>', '1.months.ago').matchesItem(item)).toEqual(true)
    })

    it('nonmatching months ago value', () => {
      expect(new Predicate('updated_at', '<', '1.months.ago').matchesItem(item)).toEqual(false)
    })

    it('years ago value', () => {
      expect(new Predicate('updated_at', '>', '1.years.ago').matchesItem(item)).toEqual(true)
    })

    it('nonmatching years ago value', () => {
      expect(new Predicate('updated_at', '<', '1.years.ago').matchesItem(item)).toEqual(false)
    })

    it('string date value', () => {
      item = createItem({}, new Date('01/01/2022'))
      expect(new Predicate('updated_at', '<', '01/02/2022').matchesItem(item)).toEqual(true)
    })

    it('nonmatching string date value', () => {
      item = createItem({}, new Date('01/01/2022'))
      expect(new Predicate('updated_at', '>', '01/02/2022').matchesItem(item)).toEqual(false)
    })
  })

  describe('nonexistent properties', () => {
    let item: Item

    beforeEach(() => {
      item = createItem({})
    })

    it('nested keypath', () => {
      expect(new Predicate<any>('foobar.length', '=', 0).matchesItem(item)).toEqual(false)
    })

    it('inequality operator', () => {
      expect(new Predicate<any>('foobar', '!=', 'NotFoo').matchesItem(item)).toEqual(true)
    })

    it('equals operator', () => {
      expect(new Predicate<any>('foobar', '=', 'NotFoo').matchesItem(item)).toEqual(false)
    })

    it('less than operator', () => {
      expect(new Predicate<any>('foobar', '<', 3).matchesItem(item)).toEqual(false)
    })

    it('greater than operator', () => {
      expect(new Predicate<any>('foobar', '>', 3).matchesItem(item)).toEqual(false)
    })

    it('less than or equal to operator', () => {
      expect(new Predicate<any>('foobar', '<=', 3).matchesItem(item)).toEqual(false)
    })

    it('includes operator', () => {
      expect(new Predicate<any>('foobar', 'includes', 3).matchesItem(item)).toEqual(false)
    })
  })

  describe('toJson', () => {
    it('basic predicate', () => {
      const predicate = new Predicate<Note>('title', 'startsWith', 'H')
      const json = predicate.toJson()

      expect(json).toStrictEqual({
        keypath: 'title',
        operator: 'startsWith',
        value: 'H',
      })
    })

    it('compound and', () => {
      const predicate = new CompoundPredicate<Note>('and', [
        new Predicate<Note>('title', 'startsWith', 'H'),
        new Predicate<Note>('title', '=', 'Hello'),
      ])
      const json = predicate.toJson()

      expect(json).toStrictEqual({
        operator: 'and',
        value: [
          {
            keypath: 'title',
            operator: 'startsWith',
            value: 'H',
          },
          {
            keypath: 'title',
            operator: '=',
            value: 'Hello',
          },
        ],
      })
    })

    it('not', () => {
      const predicate = new NotPredicate<Note>(new Predicate<Note>('title', 'startsWith', 'H'))
      const json = predicate.toJson()

      expect(json).toStrictEqual({
        operator: 'not',
        value: {
          keypath: 'title',
          operator: 'startsWith',
          value: 'H',
        },
      })
    })

    it('not compound', () => {
      const predicate = new NotPredicate<Note>(
        new CompoundPredicate<Note>('or', [
          new Predicate<Note>('title', 'startsWith', 'H'),
          new IncludesPredicate<Note>('tags', new Predicate<Tag>('title', '=', 'falsify')),
        ]),
      )

      const json = predicate.toJson()

      expect(json).toStrictEqual({
        operator: 'not',
        value: {
          operator: 'or',
          value: [
            {
              keypath: 'title',
              operator: 'startsWith',
              value: 'H',
            },
            {
              keypath: 'tags',
              operator: 'includes',
              value: {
                keypath: 'title',
                operator: '=',
                value: 'falsify',
              },
            },
          ],
        },
      })
    })
  })

  describe('generators', () => {
    it('includes predicate', () => {
      const json = ['B-tags', 'tags', 'includes', ['title', 'startsWith', 'b']]
      const predicate = predicateFromDSLString('!' + JSON.stringify(json)) as IncludesPredicate<Item>

      expect(predicate).toBeInstanceOf(IncludesPredicate)
      expect(predicate.predicate).toBeInstanceOf(Predicate)
      expect((predicate.predicate as Predicate<Item>).keypath).toEqual('title')
      expect((predicate.predicate as Predicate<Item>).operator).toEqual('startsWith')
    })

    it('includes string should be mapped to normal predicate', () => {
      const json = ['TODO', 'title', 'includes', 'TODO']
      const predicate = predicateFromDSLString('!' + JSON.stringify(json)) as Predicate<Item>

      expect(predicate).toBeInstanceOf(Predicate)
      expect(predicate.keypath).toEqual('title')
      expect(predicate.operator).toEqual('includes')
    })

    it('complex compound and', () => {
      const json = [
        'label',
        'ignored_keypath',
        'and',
        [
          ['', 'not', ['tags', 'includes', ['title', '=', 'boo']]],
          ['tags', 'includes', ['title', '=', 'foo']],
        ],
      ]

      const predicate = predicateFromDSLString('!' + JSON.stringify(json)) as CompoundPredicate<Item>

      expect(predicate).toBeInstanceOf(CompoundPredicate)

      expect(predicate.predicates).toHaveLength(2)

      const notPredicate = predicate.predicates[0] as NotPredicate<Item>
      expect(notPredicate).toBeInstanceOf(NotPredicate)

      const includesPredicate = predicate.predicates[1]
      expect(includesPredicate).toBeInstanceOf(IncludesPredicate)

      expect(notPredicate.predicate).toBeInstanceOf(IncludesPredicate)
      expect((notPredicate.predicate as IncludesPredicate<Item>).predicate).toBeInstanceOf(Predicate)
    })

    it('nested compound or', () => {
      const json = [
        'label',
        'ignored_keypath',
        'and',
        [
          ['title', '=', 'Hello'],
          [
            'this_field_ignored',
            'or',
            [
              ['title', '=', 'Wrong'],
              ['title', '=', 'Wrong again'],
              ['title', '=', 'All wrong'],
            ],
          ],
        ],
      ]

      const predicate = predicateFromDSLString('!' + JSON.stringify(json)) as CompoundPredicate<Item>

      expect(predicate).toBeInstanceOf(CompoundPredicate)

      expect(predicate.predicates).toHaveLength(2)

      expect(predicate.predicates[0]).toBeInstanceOf(Predicate)

      const orPredicate = predicate.predicates[1] as CompoundPredicate<Item>
      expect(orPredicate).toBeInstanceOf(CompoundPredicate)
      expect(orPredicate.predicates).toHaveLength(3)
      expect(orPredicate.operator).toEqual('or')

      for (const subPredicate of orPredicate.predicates) {
        expect(subPredicate).toBeInstanceOf(Predicate)
      }
    })
  })
})
