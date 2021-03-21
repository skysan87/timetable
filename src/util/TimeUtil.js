/**
 * 2桁表示
 * @param {Number} num
 * @returns {String}
 */
export function to2Digit (num) {
  return num.toString().padStart(2, '0')
}

/**
 * DateをYYYY-MM-DDに変換
 * @param {Date} date
 * @returns {String} YYYY-MM-DD
 */
export function toDateString (date) {
  return `${date.getFullYear()}-${to2Digit(date.getMonth() + 1)}-${to2Digit(date.getDate())}`
}

/**
 * Dateをhh:mmに変換
 * @param {Date} date
 * @returns {String} hh:mm
 */
export function toTimeString (date) {
  return `${to2Digit(date.getHours())}:${to2Digit(date.getMinutes())}`
}
