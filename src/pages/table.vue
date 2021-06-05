<template>
  <v-row no-gutters>
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat color="blue lighten-3">
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="$router.push('/')"
          >
            <v-icon>
              mdi-chevron-left
            </v-icon>
          </v-btn>

          <v-divider
            class="mx-2"
            inset
            vertical
          />

          <v-row no-gutters>
            <v-col cols="7">
              <v-text-field
                v-model="taskName"
                class="ml-1"
                solo
                label="Add Task..."
                hide-details
                @keydown.enter="addTask($event.keyCode === 13)"
              />
            </v-col>
            <v-col cols="3">
              <v-select
                v-model="taskDuration"
                class="ml-2"
                :items="taskDurationList"
                label="Duration"
                solo
                hide-details
              />
            </v-col>
            <v-col cols="1">
              <v-menu
                offset-y
              >
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
                <v-list dense>
                  <v-list-item-group>
                    <v-list-item @click="addTask(true)">
                      <v-list-item-title>
                        Add to the end
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="showDialog">
                      <v-list-item-title>
                        Edit time
                      </v-list-item-title>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-menu>
            </v-col>
          </v-row>
        </v-toolbar>
      </v-sheet>
      <v-sheet class="main-height">
        <v-data-table
          :headers="headers"
          :items="orderedTasks"
          hide-default-footer
          disable-pagination
          disable-sort
        >
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.start_time="{ item }">
            <span>
              {{ item.start | timeFormat }}
            </span>
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.end_time="{ item }">
            <span>
              {{ item.end | timeFormat }}
            </span>
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.actions="{ item }">
            <v-icon
              small
              class="mr-2"
              :disabled="firstIndex(item)"
              @click="changeOrder(item, -1)"
            >
              mdi-arrow-up-thick
            </v-icon>
            <v-icon
              small
              class="mr-2"
              :disabled="lastIndex(item)"
              @click="changeOrder(item, 1)"
            >
              mdi-arrow-down-thick
            </v-icon>
            <v-icon
              small
              class="mr-2"
              @click="editTask(item)"
            >
              mdi-pencil
            </v-icon>
          </template>
          <template #no-data>
            No Task
          </template>
        </v-data-table>
      </v-sheet>
    </v-col>
    <input-form ref="detail" @update="updateTask" @delete="deleteTask" />
  </v-row>
</template>

<script>
import { Task } from '@/model/Task'
import { TaskDao } from '@/dao/TaskDao'
import { toDateString, toTimeString } from '@/util/TimeUtil'
import orderBy from 'lodash/orderBy'
import InputForm from '@/components/InputForm'

const dao = new TaskDao()

export default {
  components: {
    InputForm
  },

  filters: {
    timeFormat (value) {
      if (!value) {
        return ''
      }
      return toTimeString(new Date(value))
    }
  },

  data: () => ({
    headers: [
      { text: 'Title', value: 'name', sortable: false, divider: true, align: 'start' },
      { text: 'Start', value: 'start_time', sortable: false, divider: true, width: 100, align: 'center' },
      { text: 'End', value: 'end_time', sortable: false, divider: true, width: 100, align: 'center' },
      { text: 'Actions', value: 'actions', sortable: false, divider: true, width: 150, align: 'center' }
    ],
    tasks: [],
    dateString: toDateString(new Date()),
    taskName: '',
    taskDuration: 30,
    taskDurationList: [
      { text: '15 min', value: 15 },
      { text: '30 min', value: 30 },
      { text: '45 min', value: 45 },
      { text: '60 min', value: 60 }
    ]
  }),

  computed: {
    orderedTasks () {
      return orderBy(this.tasks, ['start', 'end'])
    }
  },

  created () {
    this.initialize()
  },

  methods: {
    async initialize () {
      this.tasks = []

      // NOTE: 当日のみ(定期的な予定は含まない)
      const tasks = await dao.init(this.dateString)
      this.tasks.push(...tasks)
    },

    firstIndex (task) {
      const orderedIntex = this.orderedTasks
        .findIndex(r => r.id === task.id)

      return orderedIntex === 0
    },

    lastIndex (task) {
      const orderedIntex = this.orderedTasks
        .findIndex(r => r.id === task.id)

      return orderedIntex === (this.tasks.length - 1)
    },

    changeOrder (task, offset) {
      const targetItem = new Task(task.id, task)

      const ordered = this.orderedTasks
      const index = ordered.findIndex(r => r.id === task.id)
      // 次の時間の予定を取得
      const nextTmp = ordered[index + offset]
      const nextItem = new Task(nextTmp.id, nextTmp)

      // 次の予定と並び替え
      const targetDuration = targetItem.end - targetItem.start
      const nextDuration = nextItem.end - nextItem.start

      // 開始時間を入れ替える
      if (offset < 0) {
        targetItem.start = nextItem.start
        targetItem.end = nextItem.start + targetDuration

        nextItem.start = targetItem.end
        nextItem.end = targetItem.end + nextDuration
      } else {
        nextItem.start = targetItem.start
        nextItem.end = targetItem.start + nextDuration

        targetItem.start = nextItem.end
        targetItem.end = nextItem.end + targetDuration
      }

      this.updateTask(targetItem)

      this.updateTask(nextItem)
    },

    editTask (task) {
      this.$refs.detail.open(task)
    },

    roundTime (time, down = true) {
      const roundTo = 15 // minutes
      const roundDownTime = roundTo * 60 * 1000

      return down
        ? time - (time % roundDownTime)
        : time + (roundDownTime - (time % roundDownTime))
    },

    showDialog () {
      const time = new Date()
      const taskDate = new Date(this.dateString)
      taskDate.setHours(time.getHours(), time.getMinutes())

      const defaultTime = this.roundTime(taskDate.getTime(), false)

      const task = new Task('', {
        name: this.taskName,
        event_date: this.dateString,
        start: defaultTime,
        end: defaultTime + (this.taskDuration * 60 * 1000),
        timed: true
      })
      this.$refs.detail.open(task)
    },

    async updateTask (task) {
      if (task.id === '') {
        // create
        task.id = Date.now()
        await dao.add(task)

        this.tasks.push(task)
        this.taskName = ''
      } else {
        // update
        await dao.update(task)

        const index = this.tasks.findIndex(v => v.id === task.id)
        if (index >= 0) {
          Object.assign(this.tasks[index], task)
        }
      }
    },

    async deleteTask (id) {
      if (!id || id === '') {
        return
      }

      await dao.delete(id)

      const index = this.tasks.findIndex(v => v.id === id)
      if (index >= 0) {
        this.tasks.splice(index, 1)
      }
    },

    calcStartTime () {
      // レコードがあれば最後のイベントを参照
      const lastTask = (this.tasks.length > 0)
        ? this.orderedTasks[this.tasks.length - 1]
        : null

      let nextStartTime
      if (lastTask !== null) {
        nextStartTime = new Date(lastTask.end)
      } else {
        const now = new Date()
        nextStartTime = new Date(this.roundTime(now.getTime(), false))
      }

      return nextStartTime.getTime()
    },

    async addTask (executable) {
      if (!executable) {
        // 日本語変換中は無視
        return
      }
      if (!this.taskName || this.taskName === '') {
        return
      }

      const startTime = this.calcStartTime()
      const endTime = startTime + (this.taskDuration * 60 * 1000)

      // 登録できる上限
      const limit = new Date(this.dateString)
      limit.setHours(23, 45)

      if (endTime > limit) {
        alert('You can\'t add any more.')
        return
      }

      const task = new Task(Date.now(), {
        name: this.taskName,
        event_date: this.dateString,
        start: startTime,
        end: endTime,
        timed: true
      })

      await dao.add(task)

      this.taskName = ''
      this.tasks.push(task)
    }
  }
}
</script>

<style lang="scss" scoped>
.main-height {
  height: calc(100vh - 64px);
  padding-bottom: 6px;
  overflow: auto;
}
</style>
