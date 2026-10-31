import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { feedbackApi } from "../services/api";
import { notify } from "../lib/notify";

type Position = { left: number; top: number };
type FeedbackCategory = "suggestion" | "issue" | "other";

const buttonSize = 56;
const screenPadding = 12;
const storageKey = "itsync-feedback-button-position";

function clampPosition(position: Position): Position {
  return {
    left: Math.max(
      screenPadding,
      Math.min(position.left, window.innerWidth - buttonSize - screenPadding),
    ),
    top: Math.max(
      screenPadding,
      Math.min(position.top, window.innerHeight - buttonSize - screenPadding),
    ),
  };
}

function getFeedbackCategory(
  value: FormDataEntryValue | null,
): FeedbackCategory | null {
  return value === "suggestion" || value === "issue" || value === "other"
    ? value
    : null;
}

function getInitialPosition(): Position {
  const savedPosition = localStorage.getItem(storageKey);
  if (savedPosition) {
    try {
      const parsed: unknown = JSON.parse(savedPosition);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "left" in parsed &&
        "top" in parsed &&
        typeof parsed.left === "number" &&
        typeof parsed.top === "number"
      ) {
        return clampPosition({ left: parsed.left, top: parsed.top });
      }
      localStorage.removeItem(storageKey);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }
  return clampPosition({
    left: window.innerWidth - buttonSize - 24,
    top: window.innerHeight - buttonSize - 96,
  });
}

export default function FeedbackWidget() {
  const [position, setPosition] = useState(getInitialPosition);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const handleResize = () => setPosition((current) => clampPosition(current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: position.left,
      top: position.top,
    };
    dragged.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) dragged.current = true;
    if (dragged.current) {
      setPosition(
        clampPosition({ left: start.left + deltaX, top: start.top + deltaY }),
      );
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current?.pointerId === event.pointerId)
      dragStart.current = null;
  };

  const handleOpen = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = getFeedbackCategory(formData.get("category"));
    if (!category) {
      notify.error("Select a feedback type before sending.");
      return;
    }
    setIsSubmitting(true);

    try {
      await feedbackApi.send({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        category,
        message: String(formData.get("message") ?? ""),
      });
      setIsOpen(false);
      notify.success("Feedback sent. Thanks for helping us improve ITSync.");
    } catch (submitError) {
      notify.error(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Contact us and share feedback"
        title="Drag to move · Click to contact us"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleOpen}
        style={{ left: position.left, top: position.top, touchAction: "none" }}
        className="fixed z-[60] flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-primary-600 text-white shadow-xl shadow-primary-900/20 transition-colors hover:bg-primary-700 active:cursor-grabbing"
      >
        <MessageCircle size={23} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-dialog-title"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary-700">
                    We value your feedback
                  </p>
                  <h2
                    id="feedback-dialog-title"
                    className="mt-1 text-2xl font-semibold text-slate-900"
                  >
                    Contact us
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Share a suggestion, report an issue, or tell us how we can
                    improve ITSync.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close feedback form"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Name{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                    <input
                      name="name"
                      autoComplete="name"
                      maxLength={120}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Email{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Feedback type
                  <select
                    name="category"
                    defaultValue="suggestion"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="issue">Report an issue</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Message
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={5}
                    placeholder="Tell us what you think..."
                    className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </label>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={16} />
                    {isSubmitting ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
