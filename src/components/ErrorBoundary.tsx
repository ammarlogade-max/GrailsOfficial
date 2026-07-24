import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { reportError } from "../lib/reportError";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches rendering errors anywhere below it in the tree, reports them to
 * error_logs so the team actually finds out about them, and shows a
 * friendly recovery screen instead of a blank white page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error.message, { stack: error.stack, component: info.componentStack?.split("\n")[1]?.trim() });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="text-center max-w-sm">
            <AlertTriangle size={40} className="mx-auto text-[var(--color-primary)] mb-4" />
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-neutral-500 mb-6">
              We've logged the issue and our team will take a look. Try refreshing the page.
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary mx-auto">
              <RefreshCw size={14} /> Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
