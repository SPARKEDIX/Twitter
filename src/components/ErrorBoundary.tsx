import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

/**
 * Catches render-time errors so a single bad tweet can't blank the app.
 * Must be a class component - React has no hook equivalent of
 * `componentDidCatch`.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error in render tree:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary" role="alert">
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__message">
          {this.state.message ?? 'An unexpected error occurred while rendering this page.'}
        </p>
        <div className="error-boundary__actions">
          <button type="button" className="error-boundary__btn" onClick={this.handleReset}>
            Try again
          </button>
          <button
            type="button"
            className="error-boundary__btn error-boundary__btn--ghost"
            onClick={() => window.location.assign('/')}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
