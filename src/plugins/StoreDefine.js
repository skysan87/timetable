const event = {
  name: 'event',
  version: 2,
  indexes: [
    // 今日の予定の検索インデックス
    { name: 'todays_event', key: ['type', 'event_date'], option: { unique: false, multiEntry: false } },
    { name: 'event_type', key: ['type'], option: { unique: false, multiEntry: false } }
  ]
}

const config = {
  name: 'config',
  version: 1,
  indexes: []
}

export default [event, config]
