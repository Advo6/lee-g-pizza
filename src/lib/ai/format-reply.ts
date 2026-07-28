/** Normalizes chat replies for readable line breaks in the UI */
export function polishChatReply(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n---\n/g, "\n\n")
    .replace(/^---\n/gm, "")
    .replace(/\n---$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
