<template>
  <v-row>
    <v-col cols="9">
      <v-sheet height="32">
        <v-toolbar flat color="white">
          <!-- TODO:Set WorkTime -->
          <v-switch v-model="editMode" label="Add/Edit Event" />
          <v-spacer />
        </v-toolbar>
      </v-sheet>
      <v-sheet height="85vh">
        <v-calendar
          ref="calendar"
          v-model="value"
          type="day"
          :first-interval="intervals.first"
          :interval-minutes="intervals.minutes"
          :interval-count="intervals.count"
          :interval-height="intervals.height"
          :events="events"
          :event-color="getEventColor"
          :event-ripple="false"
          @change="getEvents"
          @click:event="showDetail"
          @mousedown:event="startDrag"
          @mousedown:time="addEvent"
          @mousemove:time="mouseMove"
          @mouseup:time="endDrag"
          @mouseleave.native="cancelDrag"
        >
          <template #day-body>
            <div class="v-current-time" :style="{ top: nowY }" />
          </template>
          <template #event="{ event, timed }">
            <div class="v-event-draggable">
              {{ event.name }}
            </div>
            <div v-if="timed" class="v-event-drag-bottom" @mousedown.stop="extendBottom(event)" />
          </template>
        </v-calendar>
      </v-sheet>
    </v-col>
    <v-col cols="3">
      <input-form :event="selectedEvent" @clear="selectedEvent = null" @update="updateEvent" @delete="deleteEvent" />
    </v-col>
  </v-row>
</template>

<script>
import { Task } from '@/model/Task'
import { TaskDao } from '@/dao/TaskDao'
import InputForm from '@/components/InputForm'

const dao = new TaskDao()

export default {
  components: {
    InputForm
  },
  data: () => ({
    events: [],
    value: '',
    editMode: false,
    dragEvent: null,
    dragStart: null,
    createEvent: null,
    createStart: null,
    extendOriginal: null,
    selectedEvent: null,
    colors: ['#2196F3', '#3F51B5', '#673AB7', '#00BCD4', '#4CAF50', '#FF9800', '#757575'],
    ready: false,
    // 08:30 〜 19:30
    intervals: { first: 17, minutes: 30, count: 20, height: 48 }
  }),
  computed: {
    cal () {
      return this.ready ? this.$refs.calendar : null
    },
    nowY () {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px'
    }
  },
  mounted () {
    this.ready = true
    this.scrollToTime()
    this.updateTimeLine()
  },
  methods: {
    getCurrentTime () {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0
    },
    scrollToTime () {
      const time = this.getCurrentTime()
      const first = Math.max(0, time - (time % 30) - 30)

      this.cal.scrollToTime(first)
    },
    updateTimeLine () {
      setInterval(() => this.cal.updateTimes(), 60 * 1000)
    },
    startDrag ({ event, timed }) {
      if (!this.editMode) {
        return
      }
      if (event && timed) {
        this.dragEvent = event
        this.dragTime = null
        this.extendOriginal = null
      }
    },
    addEvent (tms) {
      if (!this.editMode) {
        return
      }

      const mouse = this.toTime(tms)

      if (this.dragEvent && this.dragTime === null) {
        const start = this.dragEvent.start

        this.dragTime = mouse - start
      } else {
        this.createStart = this.roundTime(mouse)
        const task = new Task(Date.now(), {})
        task.name = ''
        task.start = this.createStart
        task.end = this.createStart + (30 * 60 * 1000)
        task.event_date = this.getDate()
        task.timed = true
        this.createEvent = task

        dao.add(task)
          .then(() => {
            this.events.push(task)
          })
      }
    },
    /**
     * change Event EndTime
     */
    extendBottom (event) {
      if (!this.editMode) {
        return
      }
      this.createEvent = event
      this.createStart = event.start
      this.extendOriginal = event.end
    },
    mouseMove (tms) {
      if (!this.editMode) {
        return
      }

      const mouse = this.toTime(tms)

      if (this.dragEvent && this.dragTime !== null) {
        const start = this.dragEvent.start
        const end = this.dragEvent.end
        const duration = end - start
        const newStartTime = mouse - this.dragTime
        const newStart = this.roundTime(newStartTime)
        const newEnd = newStart + duration

        this.dragEvent.start = newStart
        this.dragEvent.end = newEnd
      } else if (this.createEvent && this.createStart !== null) {
        const mouseRounded = this.roundTime(mouse, false)
        const min = Math.min(mouseRounded, this.createStart)
        const max = Math.max(mouseRounded, this.createStart)

        this.createEvent.start = min
        this.createEvent.end = max
      }
    },
    endDrag () {
      if (!this.editMode) {
        return
      }

      if (this.dragEvent && this.dragTime !== null) {
        dao.update(this.dragEvent)
      } else if (this.createEvent && this.createStart !== null) {
        dao.update(this.createEvent)
      }
      this.dragTime = null
      this.dragEvent = null
      this.createEvent = null
      this.createStart = null
      this.extendOriginal = null
    },
    cancelDrag () {
      if (!this.editMode) {
        return
      }

      if (this.createEvent) {
        if (this.extendOriginal) {
          this.createEvent.end = this.extendOriginal
        } else {
          const i = this.events.indexOf(this.createEvent)
          if (i !== -1) {
            this.events.splice(i, 1)
          }
        }
      }

      this.createEvent = null
      this.createStart = null
      this.dragTime = null
      this.dragEvent = null
    },
    roundTime (time, down = true) {
      const roundTo = 15 // minutes
      const roundDownTime = roundTo * 60 * 1000

      return down
        ? time - (time % roundDownTime)
        : time + (roundDownTime - (time % roundDownTime))
    },
    toTime (tms) {
      return new Date(
        tms.year,
        tms.month - 1,
        tms.day,
        tms.hour,
        tms.minute
      ).getTime()
    },
    getEventColor (event) {
      if (this.selectedEvent && this.selectedEvent.id === event.id) {
        return '#3F51B5'
      } else {
        return '#2196F3'
      }
    },
    /**
     * v-calender@change Event
     */
    getEvents ({ start, end }) {
      dao.init(this.getDate())
        .then((events) => {
          this.events = events
        })
    },
    getDate () {
      // YYYY-MM-DD
      return new Date().toISOString().slice(0, 10)
    },
    updateEvent (event) {
      dao.update(event)
        .then(() => {
          const index = this.events.findIndex(v => v.id === event.id)
          if (index >= 0) {
            Object.assign(this.events[index], event)
          }
        })
    },
    deleteEvent (id) {
      dao.delete(id)
        .then(() => {
          const index = this.events.findIndex(v => v.id === id)
          if (index >= 0) {
            this.events.splice(index, 1)
            this.selectedEvent = null
          }
        })
    },
    showDetail ({ nativeEvent, event }) {
      this.selectedEvent = event
      nativeEvent.stopPropagation()
    }
  }
}
</script>

<style lang="scss">
.v-current-time {
  height: 2px;
  background-color: #ea4335;
  position: absolute;
  left: -1px;
  right: 0;
  pointer-events: none;

  &.first::before {
    content: '';
    position: absolute;
    background-color: #ea4335;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: -5px;
    margin-left: -6.5px;
  }
}

.v-event-draggable {
  padding-left: 6px;
}

.v-event-timed {
  user-select: none;
  -webkit-user-select: none;
}

.v-event-drag-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 4px;
  cursor: ns-resize;

  &::after {
    display: none;
    position: absolute;
    left: 50%;
    height: 4px;
    border-top: 1px solid white;
    border-bottom: 1px solid white;
    width: 16px;
    margin-left: -8px;
    opacity: 0.8;
    content: '';
  }

  &:hover::after {
    display: block;
  }
}
</style>