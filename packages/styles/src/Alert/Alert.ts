type AlertButtonStyle = 'small' | 'outlined' | 'contrast' | 'neutral' | 'info' | 'warning' | 'danger' | 'success'

type AlertButton = {
  text: string
  style: AlertButtonStyle
  action: () => void
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
        <button id='button-${index}' class='sn-button small ${buttonDesc.style}'>
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
      <div class='sk-button-group'>
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
    const titleTemplate = this.title ? `<div class='sk-h3 sk-panel-section-title'>${this.title}</div>` : ''
    const messageTemplate = this.text ? `<p class='sk-p'>${this.text}</p>` : ''

    const template = `
      <div class="sk-modal">
        <div class="sk-modal-background"></div>
        <div class="sk-modal-content">
          <div class="sn-component">
            <div class="sk-panel" style='max-width: 500px;'>
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
          buttonDesc.action && buttonDesc.action()
          this.dismiss()
        }
        if (index === 0) {
          buttonElem.focus()
        }
      })
    }
  }
}
