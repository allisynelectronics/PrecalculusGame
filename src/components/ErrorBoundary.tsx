import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MATHVERSE crashed:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleResetProgress = () => {
    try {
      localStorage.removeItem('mathverse-save');
    } catch {
      // ignore — localStorage may be unavailable
    }
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1033] to-[#0b0a14] px-6 text-center">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="font-display text-2xl text-rose-300 mb-2">Something broke</h1>
          <p className="text-purple-300 mb-6 max-w-md">
            The adventure hit a snag. You can try continuing, or reset your saved progress if the
            problem keeps happening.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
            >
              Try to Continue
            </button>
            <button
              onClick={this.handleResetProgress}
              className="px-6 py-2 rounded-full border border-rose-400/40 text-rose-200 hover:bg-rose-500/20"
            >
              Reset Progress
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
