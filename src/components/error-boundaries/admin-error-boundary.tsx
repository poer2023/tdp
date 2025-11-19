/**
 * Admin Error Boundary
 *
 * Catches errors in admin components and displays a user-friendly fallback UI.
 * Prevents entire admin panel from crashing when a module fails.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

/**
 * Error Boundary for admin components
 *
 * @example
 * ```tsx
 * <AdminErrorBoundary>
 *   <CredentialManagement />
 * </AdminErrorBoundary>
 * ```
 */
export default class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin module error:", error, errorInfo);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // trackError(error, { context: 'admin', ...errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mx-auto max-w-md text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-red-900 dark:text-red-100">
              模块加载失败
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              抱歉,此功能暂时不可用。请稍后重试或联系管理员。
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">
                  错误详情 (仅开发环境)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900 dark:bg-red-900/30 dark:text-red-200">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
