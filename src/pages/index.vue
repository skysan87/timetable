<template>
  <v-row no-gutters>
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat color="white">
          <v-btn
            outlined
            class="mr-4"
            color="grey darken-2"
            @click="setToday"
          >
            Today
          </v-btn>
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="prev"
          >
            <v-icon small>
              mdi-chevron-left
            </v-icon>
          </v-btn>
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="next"
          >
            <v-icon small>
              mdi-chevron-right
            </v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ $refs.calendar.title }}
          </v-toolbar-title>

          <v-spacer />

          <v-switch v-model="editMode" label="Add/Move Event" class="pr-4" hide-details />

          <v-menu offset-y>
            <template #activator="{ on, attrs }">
              <v-btn
                class="ml-2"
                color="primary"
                large
                v-bind="attrs"
                v-on="on"
              >
                Menu
              </v-btn>
            </template>
            <v-list flat>
              <v-list-item-group>
                <v-list-item @click="$router.push('table')">
                  <v-list-item-title>
                    Table Mode
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="scrollToTime">
                  <v-list-item-title>
                    Now
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="switchPrivate">
                  <v-list-item-title>
                    {{ visiblePrivate ? 'Hide Private' : 'Show Private' }}
                  </v-list-item-title>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>
      <v-sheet class="main-hight">
        <v-calendar
          ref="calendar"
          v-model="focus"
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
    <v-btn
      color="primary"
      fixed
      large
      bottom
      right
      fab
      elevation="4"
      @click="showDialog"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <input-form ref="detail" @clear="closeDetail" @update="updateEvent" @delete="deleteEvent" />
  </v-row>
</template>

<script>
import { Task } from '@/model/Task'
import { TaskDao } from '@/dao/TaskDao'
import { toDateString } from '@/util/TimeUtil'
import InputForm from '@/components/InputForm'

const dao = new TaskDao()
const defaultPeriod = (30 * 60 * 1000) // 30 minutes

export default {
  components: {
    InputForm
  },
  data: () => ({
    events: [],
    focus: '', // YYYY-MM-DD
    editMode: false,
    dragEvent: null,
    dragStart: null,
    createEvent: null,
    createStart: null,
    extendOriginal: null,
    ready: false,
    intervals: { first: 0, minutes: 30, count: 48, height: 48 },
    visiblePrivate: false
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
        task.end = this.createStart + defaultPeriod
        task.event_date = this.getDate(this.createStart)
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
      return this.color2rgb(event.color)
    },
    /**
     * v-calender@change Event
     */
    getEvents ({ start, end }) {
      this.initVisibleEvents()
    },
    getDate (time) {
      // YYYY-MM-DD
      const date = time ? new Date(time) : new Date()
      return toDateString(date)
    },
    updateEvent (event) {
      if (event.id === '') {
        // create
        event.id = Date.now()
        dao.add(event)
          .then(() => {
            if (!this.visiblePrivate && event.private) {
              // do nothing
            } else {
              this.events.push(event)
            }
          })
      } else {
        // update
        dao.update(event)
          .then(() => {
            const index = this.events.findIndex(v => v.id === event.id)
            if (index >= 0) {
              Object.assign(this.events[index], event)
            }
            if (!this.visiblePrivate && event.private) {
              this.events.splice(index, 1)
            }
          })
      }
      this.closeDetail()
    },
    deleteEvent (id) {
      dao.delete(id)
        .then(() => {
          const index = this.events.findIndex(v => v.id === id)
          if (index >= 0) {
            this.events.splice(index, 1)
          }
        })
      this.closeDetail()
    },
    showDetail ({ nativeEvent, event }) {
      if (this.editMode) {
        return
      }

      const openDialog = () => {
        this.$refs.detail.open(event)
        setTimeout(() => {
        }, 100)
      }
      openDialog()

      nativeEvent.stopPropagation()
    },
    closeDetail () {
      // close dialog
    },
    color2rgb (colorCode, opacity = 1.0) {
      const rgb = parseInt(colorCode.substring(1), 16)
      const r = (rgb >> 16) & 0xFF
      const g = (rgb >> 8) & 0xFF
      const b = (rgb >> 0) & 0xFF
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    },
    initVisibleEvents () {
      this.events = []
      const dateString = this.focus === '' ? this.getDate() : this.focus

      dao.init(dateString)
        .then((events) => {
          this.events.push(...events)
        })
        .then(dao.getFreqEvents)
        .then((events) => {
          const updatedEvents = events.map((e) => {
            e.start = e.changeDate(dateString, e.start)
            e.end = e.changeDate(dateString, e.end)
            return e
          })
          this.events.push(...updatedEvents)
        })
        .then(() => {
          if (!this.visiblePrivate) {
            this.events = this.events.filter(e => e.private === this.visiblePrivate)
          }
        })
        .then(() => {
          if (!this.visiblePrivate) {
            this.events = this.events.filter(e => e.private === this.visiblePrivate)
          }
        })
    },
    switchPrivate () {
      this.visiblePrivate = !this.visiblePrivate

      if (!this.visiblePrivate) {
        this.events = this.events.filter(e => e.private === false)
      } else {
        this.events = []
        this.initVisibleEvents()
      }
    },
    setToday () {
      this.focus = ''
    },
    prev () {
      this.$refs.calendar.prev()
    },
    next () {
      this.$refs.calendar.next()
    },
    showDialog () {
      const eventDateString = this.focus === '' ? this.getDate() : this.focus

      const time = new Date()
      const eventDate = new Date(eventDateString)
      eventDate.setHours(time.getHours(), time.getMinutes())

      const defaultTime = this.roundTime(eventDate.getTime()) + defaultPeriod

      const event = new Task('', {
        event_date: eventDateString,
        start: defaultTime,
        end: defaultTime + defaultPeriod,
        timed: true
      })
      this.$refs.detail.open(event)
    }
  }
}
</script>

<style lang="scss">
.main-hight {
  height: calc(100vh - 64px);
  padding-bottom: 6px;
}
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
