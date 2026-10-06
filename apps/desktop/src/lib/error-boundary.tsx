import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorFallback = (error: Error, reset: () => void) => ReactNode;

type Props = {
  fallback: ErrorFallback;
  onError?: (error: Error) => void;
  resetKeys?: unknown[];
  children?: ReactNode;
};

type State = { error: Error | null };

const changed = (a: unknown[] = [], b: unknown[] = []) =>
  a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    this.props.onError?.(error);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = () => this.setState({ error: null });

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children;
  }
}
