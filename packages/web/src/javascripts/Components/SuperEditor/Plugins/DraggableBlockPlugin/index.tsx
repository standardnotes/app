/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $createListNode, $isListNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { eventFiles } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGEND_COMMAND,
  DROP_COMMAND,
  LexicalEditor,
  LexicalNode,
} from 'lexical'
import { DragEvent as ReactDragEvent, TouchEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BlockIcon } from '@standardnotes/icons'

import { isHTMLElement } from '../../Lexical/Utils/guard'
import { Point } from '../../Lexical/Utils/point'
import { ContainsPointReturn, Rect } from '../../Lexical/Utils/rect'

const DRAGGABLE_BLOCK_MENU_LEFT_SPACE = -2
const TARGET_LINE_HALF_HEIGHT = 2
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
let draggedNodeKey = ''
const TEXT_BOX_HORIZONTAL_PADDING = 24

const Downward = 1
const Upward = -1
const Indeterminate = 0

let prevIndex = Infinity

function getCurrentIndex(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex
  }

  return Math.floor(keysLength / 2)
}

function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
}

function elementContainingEventLocation(
  anchorElem: HTMLElement,
  element: HTMLElement,
  eventLocation: Point,
): { contains: ContainsPointReturn; element: HTMLElement } {
  const anchorElementRect = anchorElem.getBoundingClientRect()

  const elementDomRect = Rect.fromDOM(element)
  const { marginTop, marginBottom } = window.getComputedStyle(element)

  const rect = elementDomRect.generateNewRect({
    bottom: elementDomRect.bottom + parseFloat(marginBottom),
    left: anchorElementRect.left,
    right: anchorElementRect.right,
    top: elementDomRect.top - parseFloat(marginTop),
  })

  const children = Array.from(element.children)

  const recursableTags = ['UL', 'OL', 'LI']
  const shouldRecurseIntoChildren = recursableTags.includes(element.tagName)

  if (shouldRecurseIntoChildren) {
    for (const child of children) {
      const isLeaf = child.children.length === 0
      if (isLeaf) {
        continue
      }
      if (!recursableTags.includes(child.tagName)) {
        continue
      }
      const childResult = elementContainingEventLocation(anchorElem, child as HTMLElement, eventLocation)

      if (childResult.contains.result) {
        return childResult
      }
    }
  }

  return { contains: rect.contains(eventLocation), element: element }
}

function getBlockElement(anchorElem: HTMLElement, editor: LexicalEditor, eventLocation: Point): HTMLElement | null {
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  let blockElem: HTMLElement | null = null

  editor.getEditorState().read(() => {
    let index = getCurrentIndex(topLevelNodeKeys.length)
    let direction = Indeterminate

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index]
      const elem = editor.getElementByKey(key)
      if (elem === null) {
        break
      }
      const { contains, element } = elementContainingEventLocation(anchorElem, elem, eventLocation)

      if (contains.result) {
        blockElem = element
        prevIndex = index
        break
      }

      if (direction === Indeterminate) {
        if (contains.reason.isOnTopSide) {
          direction = Upward
        } else if (contains.reason.isOnBottomSide) {
          direction = Downward
        } else {
          // stop search block element
          direction = Infinity
        }
      }

      index += direction
    }
  })

  return blockElem
}

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`)
}

function setMenuPosition(targetElem: HTMLElement | null, floatingElem: HTMLElement, anchorElem: HTMLElement) {
  if (!targetElem) {
    floatingElem.style.opacity = '0'
    return
  }

  const targetRect = targetElem.getBoundingClientRect()
  const targetStyle = window.getComputedStyle(targetElem)
  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()

  const top =
    targetRect.top + (parseInt(targetStyle.lineHeight, 10) - floatingElemRect.height) / 2 - anchorElementRect.top

  const left = DRAGGABLE_BLOCK_MENU_LEFT_SPACE

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}

function setDragImage(dataTransfer: DataTransfer, draggableBlockElem: HTMLElement) {
  const { transform } = draggableBlockElem.style

  // Remove dragImage borders
  draggableBlockElem.style.transform = 'translateZ(0)'
  dataTransfer.setDragImage(draggableBlockElem, 0, 0)

  setTimeout(() => {
    draggableBlockElem.style.transform = transform
  })
}

function setTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement,
) {
  const targetStyle = window.getComputedStyle(targetBlockElem)
  const { top: targetBlockElemTop, height: targetBlockElemHeight } = targetBlockElem.getBoundingClientRect()
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect()

  let lineTop = targetBlockElemTop
  // At the bottom of the target
  if (mouseY - targetBlockElemTop > targetBlockElemHeight / 2) {
    lineTop += targetBlockElemHeight + parseFloat(targetStyle.marginBottom)
  } else {
    lineTop -= parseFloat(targetStyle.marginTop)
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT
  const left = TEXT_BOX_HORIZONTAL_PADDING - DRAGGABLE_BLOCK_MENU_LEFT_SPACE

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - DRAGGABLE_BLOCK_MENU_LEFT_SPACE) * 2}px`
  targetLineElem.style.opacity = '.6'
}

function hideTargetLine(targetLineElem: HTMLElement | null) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
  }
}

function useDraggableBlockMenu(editor: LexicalEditor, anchorElem: HTMLElement, isEditable: boolean): JSX.Element {
  const scrollerElem = anchorElem.parentElement

  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)
  const dragDataRef = useRef<string | null>(null)

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      const target = event.target
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null)
        return
      }

      if (isOnMenu(target)) {
        return
      }

      const _draggableBlockElem = getBlockElement(anchorElem, editor, new Point(event.clientX, event.clientY))

      setDraggableBlockElem(_draggableBlockElem)
    }

    function onMouseLeave() {
      setDraggableBlockElem(null)
    }

    scrollerElem?.addEventListener('mousemove', onMouseMove)
    scrollerElem?.addEventListener('mouseleave', onMouseLeave)

    return () => {
      scrollerElem?.removeEventListener('mousemove', onMouseMove)
      scrollerElem?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [scrollerElem, anchorElem, editor])

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem)
    }
  }, [anchorElem, draggableBlockElem])

  const insertDraggedNode = useCallback(
    (draggedNode: LexicalNode, targetNode: LexicalNode, targetBlockElem: HTMLElement, pageY: number) => {
      let nodeToInsert = draggedNode
      const targetParent = targetNode.getParent()
      const sourceParent = draggedNode.getParent()

      if ($isListNode(sourceParent) && !$isListNode(targetParent)) {
        const newList = $createListNode(sourceParent.getListType())
        newList.append(draggedNode)
        nodeToInsert = newList
      }

      const { top, height } = targetBlockElem.getBoundingClientRect()
      const shouldInsertAfter = pageY - top > height / 2
      if (shouldInsertAfter) {
        targetNode.insertAfter(nodeToInsert)
      } else {
        targetNode.insertBefore(nodeToInsert)
      }
    },
    [],
  )

  useEffect(() => {
    function onDragover(event: DragEvent): boolean {
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { pageY, target } = event
      if (!isHTMLElement(target)) {
        return false
      }
      if (!draggedNodeKey) {
        return false
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(event.pageX, pageY))
      const targetLineElem = targetLineRef.current
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem)
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault()
      return true
    }

    function onDrop(event: DragEvent): boolean {
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }

      const { target, dataTransfer, pageY } = event
      if (!isHTMLElement(target)) {
        return false
      }

      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return false
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(event.pageX, pageY))
      if (!targetBlockElem) {
        return false
      }

      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)
      if (!targetNode) {
        return false
      }
      if (targetNode === draggedNode) {
        return true
      }

      insertDraggedNode(draggedNode, targetNode, targetBlockElem, event.pageY)

      setDraggableBlockElem(null)

      return true
    }

    function onDragEnd(): boolean {
      hideTargetLine(targetLineRef.current)
      draggedNodeKey = ''
      return true
    }

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGEND_COMMAND,
        () => {
          return onDragEnd()
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return onDrop(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [anchorElem, editor, insertDraggedNode])

  function onDragStart(event: ReactDragEvent<HTMLDivElement>): void {
    const dataTransfer = event.dataTransfer
    if (!dataTransfer || !draggableBlockElem) {
      return
    }
    setDragImage(dataTransfer, draggableBlockElem)
    let nodeKey = ''
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (node) {
        nodeKey = node.getKey()
      }
    })
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey)
    draggedNodeKey = nodeKey
  }

  function onDragEnd(): void {
    hideTargetLine(targetLineRef.current)
    draggedNodeKey = ''
  }

  function onTouchStart(): void {
    if (!draggableBlockElem) {
      return
    }
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (!node) {
        return
      }
      const nodeKey = node.getKey()
      dragDataRef.current = nodeKey
    })
  }

  function onTouchMove(event: TouchEvent) {
    const { pageX, pageY } = event.targetTouches[0]
    const rootElement = editor.getRootElement()
    if (rootElement) {
      const { top, bottom } = rootElement.getBoundingClientRect()
      const scrollOffset = 20
      if (pageY - top < scrollOffset) {
        rootElement.scrollTop -= scrollOffset
      } else if (bottom - pageY < scrollOffset) {
        rootElement.scrollTop += scrollOffset
      }
    }
    const targetBlockElem = getBlockElement(anchorElem, editor, new Point(pageX, pageY))
    const targetLineElem = targetLineRef.current
    if (targetBlockElem === null || targetLineElem === null) {
      return
    }
    setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem)
  }

  function onTouchEnd(event: TouchEvent): void {
    hideTargetLine(targetLineRef.current)

    editor.update(() => {
      const { pageX, pageY } = event.changedTouches[0]

      const dragData = dragDataRef.current || ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, new Point(pageX, pageY))
      if (!targetBlockElem) {
        return
      }
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)

      if (!targetNode) {
        return
      }
      if (targetNode === draggedNode) {
        return
      }

      insertDraggedNode(draggedNode, targetNode, targetBlockElem, pageY)
    })

    setDraggableBlockElem(null)
  }

  return createPortal(
    <>
      <div
        className="icon draggable-block-menu"
        ref={menuRef}
        draggable={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={isEditable ? 'icon' : ''}>
          <BlockIcon className="pointer-events-none text-text" />
        </div>
      </div>
      <div className="draggable-block-target-line" ref={targetLineRef} />
    </>,
    anchorElem,
  )
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return useDraggableBlockMenu(editor, anchorElem, editor._editable)
}
