import React from 'react'
import { c } from 'ttag'

type State = {
  error?: Error
}

type Props = {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-danger">
          <span>{c('B2.NavSharedUI.Error').t`Something went wrong rendering this component:`} </span>
          <span className="font-bold">{this.state.error.message}</span>
        </div>
      )
    }

    return this.props.children
  }
}
