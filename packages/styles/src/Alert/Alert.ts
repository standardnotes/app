type AlertButtonStyle = 'default' | 'contrast' | 'neutral' | 'info' | 'warning' | 'danger' | 'success'

const getColorsForNormalVariant = (style: AlertButtonStyle) => {
  switch (style) {
    case 'default':
      return 'bg-default text-text'
    case 'contrast':
      return 'bg-default text-contrast'
    case 'neutral':
      return 'bg-default text-neutral'
    case 'info':
      return 'bg-default text-info'
    case 'warning':
      return 'bg-default text-warning'
    case 'danger':
      return 'bg-default text-danger'
    case 'success':
      return 'bg-default text-success'
  }
}

const getColorsForPrimaryVariant = (style: AlertButtonStyle) => {
  switch (style) {
    case 'default':
      return 'bg-default text-foreground'
    case 'contrast':
      return 'bg-contrast text-text'
    case 'neutral':
      return 'bg-neutral text-neutral-contrast'
    case 'info':
      return 'bg-info text-info-contrast'
    case 'warning':
      return 'bg-warning text-warning-contrast'
    case 'danger':
      return 'bg-danger text-danger-contrast'
    case 'success':
      return 'bg-success text-success-contrast'
  }
}

type AlertButton = {
  text: string
  style: AlertButtonStyle
  action?: () => void
  primary?: boolean
}

export class SKAlert {
  private title?: string
  private text: string
  private buttons: AlertButton[]
  private element!: HTMLDivElement
  private onElement!: HTMLElement

  constructor({ title, text, buttons }: { title?: string; text: string; buttons?: AlertButton[] }) {
    this.title = title
    this.text = text
    this.buttons = buttons || []
  }

  buttonsString() {
    const genButton = function (buttonDesc: AlertButton, index: number) {
      return `
        <button id='button-${index}' class='font-bold px-4 py-1.5 rounded text-base lg:text-sm ${
        buttonDesc.primary ? 'no-border ' : 'border-solid border-border border '
      } ${
        buttonDesc.primary
          ? 'hover:brightness-125 focus:outline-none focus:brightness-125 '
          : 'focus:bg-contrast focus:outline-none hover:bg-contrast '
      } ${
        buttonDesc.primary ? getColorsForPrimaryVariant(buttonDesc.style) : getColorsForNormalVariant(buttonDesc.style)
      }'>
          <div class='sk-label'>${buttonDesc.text}</div>
        </button>
      `
    }

    const buttonString = this.buttons
      .map(function (buttonDesc, index) {
        return genButton(buttonDesc, index)
      })
      .join('')

    const str = `
      <div class='flex items-center justify-end gap-2 w-full'>
        ${buttonString}
      </div>
    `
    return str
  }

  templateString() {
    let buttonsTemplate: string
    let panelStyle: string
    if (this.buttons) {
      buttonsTemplate = `
        <div class="sk-panel-row" style='margin-top: 8px;'>
          ${this.buttonsString()}
        </div>
      `
      panelStyle = ''
    } else {
      buttonsTemplate = ''
      panelStyle = 'style="padding-bottom: 8px"'
    }
    const titleTemplate = this.title
      ? `<div class='mb-1 font-bold text-lg flex items-center justify-between'>
          ${this.title}
          <button id="close-button" class="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
            <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.2459 5.92925C15.5704 5.60478 15.5704 5.07872 15.2459 4.75425C14.9214 4.42978 14.3954 4.42978 14.0709 4.75425L10.0001 8.82508L5.92925 4.75425C5.60478 4.42978 5.07872 4.42978 4.75425 4.75425C4.42978 5.07872 4.42978 5.60478 4.75425 5.92925L8.82508 10.0001L4.75425 14.0709C4.42978 14.3954 4.42978 14.9214 4.75425 15.2459C5.07872 15.5704 5.60478 15.5704 5.92925 15.2459L10.0001 11.1751L14.0709 15.2459C14.3954 15.5704 14.9214 15.5704 15.2459 15.2459C15.5704 14.9214 15.5704 14.3954 15.2459 14.0709L11.1751 10.0001L15.2459 5.92925Z" /></svg>
          </button>
         </div>`
      : ''
    const messageTemplate = this.text
      ? `<p class='sk-p text-base lg:text-sm' style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">${this.text}</p>`
      : ''

    const template = `
      <div class="sk-modal">
        <div class="sk-modal-background"></div>
        <div class="sk-modal-content">
          <div class="sn-component">
            <div class="sk-panel" style='max-width: min(95vw, 500px);'>
              <div class="sk-panel-content" ${panelStyle}>
                <div class="sk-panel-section">
                  ${titleTemplate}

                  <div class="sk-panel-row">
                    ${messageTemplate}
                  </div>

                  ${buttonsTemplate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    return template
  }

  dismiss() {
    this.onElement.removeChild(this.element)
  }

  primaryButton() {
    let primary = this.buttons.find((button) => button.primary === true)
    if (!primary) {
      primary = this.buttons[this.buttons.length - 1]
    }
    return primary
  }

  present(onElement?: HTMLElement) {
    if (!onElement) {
      onElement = document.body
    }

    this.onElement = onElement

    this.element = document.createElement('div')
    this.element.className = 'sn-component'
    this.element.innerHTML = this.templateString().trim()

    onElement.appendChild(this.element)

    if (this.buttons && this.buttons.length) {
      this.buttons.forEach((buttonDesc, index) => {
        const buttonElem = this.element.querySelector(`#button-${index}`) as HTMLButtonElement
        buttonElem.onclick = () => {
          if (buttonDesc.action) {
            buttonDesc.action()
          }
          this.dismiss()
        }
        if (index === 0) {
          buttonElem.focus()
        }
      })
    }

    const closeButton = this.element.querySelector<HTMLButtonElement>('#close-button')
    if (closeButton) {
      closeButton.onclick = () => {
        this.dismiss()
      }
    }
  }
}
