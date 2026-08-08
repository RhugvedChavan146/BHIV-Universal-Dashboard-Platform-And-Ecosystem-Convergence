import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { logger } from "@bhiv/utils";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error in dashboard zone:", error, { errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[150px] bg-slate-900/50 border border-red-500/30 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
          <AlertTriangle className="text-red-400" size={24} />
          <h3 className="text-sm font-semibold text-slate-200">
            {this.props.fallbackTitle ?? "Zone Crashed"}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-tight">
            {this.state.error?.message ?? "An unexpected rendering error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            <RefreshCcw size={12} />
            Reload Zone
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
