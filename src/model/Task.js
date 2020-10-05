export class Task {
  static TYPE_EVENT = 'event'
  static TYPE_FREQUENT = 'frequent'

  constructor (id, params) {
    this.id = id
    this.type = params.type || Task.TYPE_EVENT
    this.name = params.name || ''
    this.event_date = params.event_date || null
    this.start = params.start || 0
    this.end = params.end || 0
    this.timed = params.timed || false
    if (this.type === Task.TYPE_FREQUENT) {
      this.start = this.convertToToday(this.start)
      this.end = this.convertToToday(this.end)
    }
  }

  getData () {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      event_date: this.event_date,
      start: this.start,
      end: this.end,
      timed: this.timed
    }
  }

  get color () {
    return this.type === Task.TYPE_EVENT ? '#2196F3' : '#006400'
  }

  convertToToday (offset) {
    const date = new Date(offset)
    const today = new Date()
    today.setHours(date.getHours()
      , date.getMinutes()
      , 0
      , 0
    )
    return today.getTime()
  }
}
