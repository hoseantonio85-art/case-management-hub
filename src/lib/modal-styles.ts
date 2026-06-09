// Shared fixed-size shell for large working modals.
// CounterpartyModal and AssessmentModal must stay identical in width and height.
// Header gradients are allowed; modal/backdrop glow is not.
// Do not replace AssessmentModal with max-w-5xl, w-[96vw], max-h-only, or content-based height.
export const largeModalContentClass =
  "fixed left-1/2 top-1/2 z-50 flex h-[calc(100dvh-32px)] w-[1320px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border bg-white p-0 shadow-lg";
