import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#020617", color: "#f8d7da", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: "900px", width: "100%" }}>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Something went wrong</h1>
            <p>There was a problem rendering the app. Please refresh the page.</p>
            <pre style={{ whiteSpace: "pre-wrap", color: "#ffccd5" }}>{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
