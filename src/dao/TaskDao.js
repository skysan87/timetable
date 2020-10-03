import DB from '@/plugins/DB'
import { Task } from '@/model/Task'

export class TaskDao {
  init (date) {
    return new Promise((resolve, reject) => {
      const db = DB.getInstance()
      try {
        const tx = db.transaction('event', 'readonly')
        const store = tx.objectStore('event')
        const index = store.index('todays_event')
        const key = IDBKeyRange.only([Task.TYPE_EVENT, date])
        const req = index.openCursor(key)
        const events = []
        req.onsuccess = (e) => {
          if (req.result === null) {
            resolve(events)
          } else {
            const cursor = req.result
            events.push(new Task(cursor.value.id, cursor.value))
            cursor.continue()
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  getFreqEvents () {
    return new Promise((resolve, reject) => {
      const db = DB.getInstance()
      try {
        const tx = db.transaction('event', 'readonly')
        const store = tx.objectStore('event')
        const index = store.index('event_type')
        const key = IDBKeyRange.only([Task.TYPE_FREQUENT])
        const req = index.openCursor(key)
        const events = []
        req.onsuccess = (e) => {
          if (req.result === null) {
            resolve(events)
          } else {
            const cursor = req.result
            events.push(new Task(cursor.value.id, cursor.value))
            cursor.continue()
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  add (task) {
    return new Promise((resolve, reject) => {
      const db = DB.getInstance()
      try {
        const tx = db.transaction('event', 'readwrite')
        tx.objectStore('event').add(task.getData())
        tx.oncomplete = (e) => {
          resolve(task)
        }
        tx.onerror = (e) => {
          reject(e)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  update (task) {
    return new Promise((resolve, reject) => {
      const db = DB.getInstance()
      try {
        const tx = db.transaction('event', 'readwrite')
        const store = tx.objectStore('event')
        const req = store.put(task.getData()) // upsert
        req.onsuccess = (e) => {
          resolve(null)
        }
        req.onerror = (e) => {
          reject(new Error(e.message))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  delete (id) {
    return new Promise((resolve, reject) => {
      const db = DB.getInstance()
      try {
        const tx = db.transaction('event', 'readwrite')
        const store = tx.objectStore('event')
        const req = store.delete(id)
        req.onsuccess = (e) => {
          resolve(null)
        }
        req.onerror = (e) => {
          reject(new Error(e.message))
        }
      } catch (error) {
        reject(error)
      }
    })
  }
}
