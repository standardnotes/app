import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNLogoIcon } from '@standardnotes/icons'
import { useCallback, useEffect, useState } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import MenuPaneSelector from '../AccountMenu/MenuPaneSelector'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { runtime } from 'webextension-polyfill'
import { BlocksEditorComposer } from '../SuperEditor/BlocksEditorComposer'
import { BlocksEditor } from '../SuperEditor/BlocksEditor'
import ImportPlugin from '../SuperEditor/Plugins/ImportPlugin/ImportPlugin'
import getSelectionHTML from '@standardnotes/extension/src/utils/getSelectionHTML'
import getFullPageHTML from '@standardnotes/extension/src/utils/getFullPageHTML'
import getArticleHTML from '@standardnotes/extension/src/utils/getArticleHTML'
import { $createParagraphNode, $createRangeSelection, LexicalEditor } from 'lexical'
import { $generateNodesFromDOM } from '../SuperEditor/Lexical/Utils/generateNodesFromDOM'
import { RuntimeMessage, RuntimeMessageTypes } from '@standardnotes/extension/src/types/message'

type Props = {
  viewControllerManager: ViewControllerManager
  applicationGroup: ApplicationGroup
}

const ExtensionView = ({ viewControllerManager, applicationGroup }: Props) => {
  const application = useApplication()

  const user = application.getUser()

  const [menuPane, setMenuPane] = useState<AccountMenuPane>()

  const activateRegisterPane = useCallback(() => {
    setMenuPane(AccountMenuPane.Register)
  }, [setMenuPane])

  const activateSignInPane = useCallback(() => {
    setMenuPane(AccountMenuPane.SignIn)
  }, [setMenuPane])

  const [isSigningOut, setIsSigningOut] = useState(false)

  const showSignOutConfirmation = useCallback(() => {
    setIsSigningOut(true)
  }, [setIsSigningOut])

  const [clippedContent, setClippedContent] = useState('')
  const [, setConvertedSuperContent] = useState<string>()

  useEffect(() => {
    runtime.onMessage.addListener((message: RuntimeMessage) => {
      if (message.type === RuntimeMessageTypes.ClipSelection) {
        setClippedContent(message.payload)
      }
    })
  }, [])

  const superContentConversionFn = useCallback((editor: LexicalEditor, text: string) => {
    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(text, 'text/html')
      const nodesToInsert = $generateNodesFromDOM(editor, dom).map((node) => {
        const type = node.getType()

        if (type === 'text' || type === 'link') {
          const paragraphNode = $createParagraphNode()
          paragraphNode.append(node)
          return paragraphNode
        }

        return node
      })
      const selection = $createRangeSelection()
      const newLineNode = $createParagraphNode()
      selection.insertNodes([newLineNode, ...nodesToInsert])
    })
  }, [])

  return (
    <>
      <div className="flex items-center bg-info p-1 px-3 py-2 text-base font-semibold text-info-contrast">
        <SNLogoIcon className="mr-2 h-6 w-6 fill-info-contrast stroke-info-contrast [fill-rule:evenodd]" />
        Standard Notes
      </div>
      {!user && !menuPane && !clippedContent && (
        <Menu a11yLabel="User account menu" isOpen={true}>
          <MenuItem onClick={activateRegisterPane}>
            <Icon type="user" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
            Create free account
          </MenuItem>
          <MenuItem onClick={activateSignInPane}>
            <Icon type="signIn" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
            Sign in
          </MenuItem>
        </Menu>
      )}
      {!!menuPane && (
        <MenuPaneSelector
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={applicationGroup}
          menuPane={menuPane}
          setMenuPane={setMenuPane}
          closeMenu={() => setMenuPane(undefined)}
        />
      )}
      {user && !isSigningOut && !clippedContent && (
        <div>
          <Menu a11yLabel="Extension menu" isOpen={true}>
            <div className="px-3 py-2 text-base font-semibold">Web Clipper</div>
            <MenuItem
              onClick={async () => {
                const pageContent = await getFullPageHTML()
                setClippedContent(pageContent)
              }}
            >
              Clip full page
            </MenuItem>
            <MenuItem
              onClick={async () => {
                const articleContent = await getArticleHTML()
                setClippedContent(articleContent)
              }}
            >
              Clip article
            </MenuItem>
            <MenuItem
              onClick={async () => {
                const selectionContent = await getSelectionHTML()
                setClippedContent(selectionContent)
              }}
            >
              Clip current selection
            </MenuItem>
            <MenuItem>Select nodes to clip</MenuItem>
            <div className="border-t border-border px-3 pt-2 pb-1 text-base font-semibold">Account</div>
            <div className="px-3 pb-1 text-sm text-foreground">
              <div>You're signed in as:</div>
              <div className="wrap my-0.5 font-bold">{user.email}</div>
              <span className="text-neutral">{application.getHost()}</span>
            </div>
            <MenuItem onClick={showSignOutConfirmation}>
              <Icon type="signOut" className="mr-2 h-6 w-6 text-neutral" />
              Sign out
            </MenuItem>
          </Menu>
        </div>
      )}
      {isSigningOut && !clippedContent && (
        <Menu a11yLabel="Sign out confirmation" isOpen={true}>
          <div className="px-3 pt-2 pb-1 text-base font-semibold">Sign out</div>
          <div className="px-3 pb-2 text-sm text-foreground">
            <div>Are you sure you want to sign out?</div>
          </div>
          <MenuItem onClick={() => setIsSigningOut(false)}>Cancel</MenuItem>
          <MenuItem onClick={() => application.user.signOut()} className="!text-danger">
            Sign out
          </MenuItem>
        </Menu>
      )}
      {!!clippedContent && (
        <div className="px-3">
          <BlocksEditorComposer initialValue={undefined}>
            <BlocksEditor readonly>
              <ImportPlugin
                text={clippedContent}
                format="html"
                onChange={(value) => setConvertedSuperContent(value)}
                customConversionFn={superContentConversionFn}
              />
            </BlocksEditor>
          </BlocksEditorComposer>
        </div>
      )}
    </>
  )
}

export default ExtensionView
