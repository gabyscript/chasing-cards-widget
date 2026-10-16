export const describedBy = (...ids: (string | false | null | undefined)[]) =>
  ids.filter(Boolean).join(' ') || undefined
