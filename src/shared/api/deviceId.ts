/**
 * Device ID là chuỗi định danh thiết bị, KHÔNG nhạy cảm.
 * Backend cần để hỗ trợ multi-device + token rotation (xem AuthController @RequestHeader X-Device-ID).
 * Lưu localStorage là an toàn vì không phải credential.
 */
const KEY = 'sebook_device_id'

function genUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = genUuid()
    localStorage.setItem(KEY, id)
  }
  return id
}
