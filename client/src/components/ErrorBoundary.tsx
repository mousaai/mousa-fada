import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex items-center justify-center min-h-screen p-8"
          style={{ background: "oklch(0.97 0.01 80)", fontFamily: "'Tajawal', sans-serif" }}
        >
          <div className="flex flex-col items-center w-full max-w-md text-center">
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: "oklch(0.92 0.03 80)" }}
            >
              <AlertTriangle size={40} style={{ color: "oklch(0.65 0.12 60)" }} />
            </div>

            {/* Title */}
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "oklch(0.35 0.05 60)" }}
            >
              عذراً، حدث خطأ غير متوقع
            </h2>

            {/* Subtitle */}
            <p
              className="text-base mb-8"
              style={{ color: "oklch(0.55 0.04 60)" }}
            >
              م. اليازية تعتذر عن هذا الخلل المؤقت. يرجى إعادة تحميل الصفحة للمتابعة.
            </p>

            {/* Dev-only error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="w-full mb-6 text-right">
                <summary
                  className="cursor-pointer text-sm mb-2"
                  style={{ color: "oklch(0.55 0.04 60)" }}
                >
                  تفاصيل الخطأ (للمطورين فقط)
                </summary>
                <div
                  className="p-4 rounded-lg overflow-auto text-left"
                  style={{ background: "oklch(0.93 0.02 80)" }}
                >
                  <pre className="text-xs" style={{ color: "oklch(0.4 0.05 60)" }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            {/* Reload button */}
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold",
                "cursor-pointer transition-opacity hover:opacity-90 active:scale-95"
              )}
              style={{
                background: "oklch(0.72 0.12 60)",
                color: "oklch(0.98 0.01 80)",
              }}
            >
              <RotateCcw size={18} />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
