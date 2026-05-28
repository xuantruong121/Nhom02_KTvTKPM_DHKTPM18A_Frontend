export const SESSION_EXPIRED_EVENT = 'sebook:session-expired'

export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}
