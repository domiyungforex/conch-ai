"use client";

import { Component, type ReactNode } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { crashed: boolean; message: string }

export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { crashed: true, message };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    console.error("[ChatErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ crashed: false, message: "" });

  render() {
    if (this.state.crashed) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Chat failed to load</h2>
            <p className="text-sm text-slate-400 max-w-sm mt-2">{this.state.message}</p>
          </div>
          <Button variant="secondary" onClick={this.reset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
