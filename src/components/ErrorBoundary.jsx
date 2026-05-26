import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] render crashed:', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="error-boundary">
        <div className="error-boundary-icon">⚠</div>
        <div className="error-boundary-title">Something went wrong</div>
        <p className="error-boundary-body">
          The app hit an unexpected error rendering this view. Your progress is
          safe — it's stored locally. Try resetting this view, or reload the page.
        </p>
        <pre className="error-boundary-detail">{String(this.state.error?.message ?? this.state.error)}</pre>
        <div className="error-boundary-actions">
          <button className="btn btn-ghost" onClick={this.handleReset}>Try again</button>
          <button className="btn btn-primary" onClick={this.handleReload}>Reload page</button>
        </div>
      </div>
    )
  }
}
