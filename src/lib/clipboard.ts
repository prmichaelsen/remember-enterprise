/**
 * Share utility — uses native share sheet on mobile, clipboard on desktop.
 */

export async function shareOrCopyUrl(
  url: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  // Try native share API (mobile)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ url })
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return 'cancelled'
      }
      // Fall through to clipboard
    }
  }

  // Try clipboard API (desktop)
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return 'copied'
    } catch {
      // Fall through to legacy
    }
  }

  // Legacy fallback
  try {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return 'copied'
  } catch {
    return 'failed'
  }
}
