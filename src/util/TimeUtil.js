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

/**
 * UTCミリ秒を「HH:mm」形式に変更
 * @param {Number} datetime UTCミリ秒
 * @returns {String}
 */
export function convertToClock (datetime) {
  const date = new Date(datetime)
  return `${to2Digit(date.getHours())}:${to2Digit(date.getMinutes())}`
}

/**
 * Date型に変換
 * @param {Number} datetime UTCミリ秒
 * @param {String} clock HH:mm
 * @return {Date}
 */
export function converToDate (datetime, clock) {
  const clocks = clock.split(':')
  const date = new Date(datetime)

  let hour = parseInt(clocks[0])
  if (hour < 0) {
    hour = 0
  } else if (hour > 23) {
    hour = 23
  }

  let minute = parseInt(clocks[1])
  if (minute < 0) {
    minute = 0
  } else if (minute > 59) {
    minute = 59
  }

  date.setHours(hour, minute, 0, 0)
  return date
}
