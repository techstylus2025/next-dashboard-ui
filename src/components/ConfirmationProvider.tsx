"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Trash2 } from "lucide-react";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmationContextValue = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    const resolve = resolver.current;
    if (!resolve) return;
    resolver.current = null;
    setOptions(null);
    resolve(confirmed);
  }, []);

  const confirm = useCallback(
    (nextOptions: ConfirmationOptions) =>
      new Promise<boolean>((resolve) => {
        if (resolver.current) {
          resolve(false);
          return;
        }
        resolver.current = resolve;
        setOptions(nextOptions);
      }),
    []
  );
  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  useEffect(() => {
    if (!options) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButton.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resolveConfirmation(false);
      } else if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === cancelButton.current) {
          event.preventDefault();
          confirmButton.current?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === confirmButton.current
        ) {
          event.preventDefault();
          cancelButton.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [options, resolveConfirmation]);

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      {options ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              resolveConfirmation(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <h2
                  id="confirmation-dialog-title"
                  className="text-base font-semibold tracking-tight text-slate-950"
                >
                  {options.title}
                </h2>
                <p
                  id="confirmation-dialog-description"
                  className="mt-1.5 text-sm leading-6 text-slate-600"
                >
                  {options.description}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelButton}
                type="button"
                onClick={() => resolveConfirmation(false)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmButton}
                type="button"
                onClick={() => resolveConfirmation(true)}
                className="min-h-10 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              >
                {options.confirmLabel ?? "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmation must be used within ConfirmationProvider.");
  }
  return context;
}
