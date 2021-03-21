<template>
  <v-row no-gutters>
    <v-col>
      <v-data-table
        :headers="headers"
        :items="tasks"
        :sort-by="['start', 'end']"
        hide-default-footer
        fixed-header
        disable-pagination
      >
        <template #top>
          <v-toolbar
            flat
          >
            <v-toolbar-title>
              <v-btn
                fab
                text
                small
                color="grey darken-2"
                @click="$router.push('/')"
              >
                <v-icon small>
                  mdi-chevron-left
                </v-icon>
              </v-btn>
            </v-toolbar-title>
            <v-divider
              class="mx-4"
              inset
              vertical
            />
            <v-row no-gutters>
              <v-col cols="9">
                <v-text-field
                  v-model="taskName"
                  class="ml-1"
                  solo
                  label="Add Task..."
                  hide-details
                  @keydown.enter="addTask"
                />
              </v-col>
              <v-col cols="2">
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
                <v-btn
                  class="ml-2"
                  color="primary"
                  large
                  hide-details
                  @click="addTask"
                >
                  Add
                </v-btn>
              </v-col>
            </v-row>
          </v-toolbar>
        </template>
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
          <v-icon
            small
            @click="deleteTask(item.id)"
          >
            mdi-delete
          </v-icon>
        </template>
        <template #no-data>
          No Task
        </template>
      </v-data-table>
    </v-col>
    <input-form ref="detail" @update="updateTask" @delete="deleteTask" />
  </v-row>
</template>

<script>
// TODO:
// - Actionsに下に追加ボタン
// - スクロール時にヘッダー固定
// - スクロール調整

import { Task } from '@/model/Task'
import { TaskDao } from '@/dao/TaskDao'
import { toDateString, toTimeString } from '@/util/TimeUtil'
import orderBy from 'lodash.orderBy'
import InputForm from '@/components/InputForm'

const dao = new TaskDao()
const defaultPeriod = (30 * 60 * 1000) // 30 minutes

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
      { text: 'title', value: 'name', sortable: false },
      { text: 'Start', value: 'start_time', sortable: false },
      { text: 'End', value: 'end_time', sortable: false },
      { text: 'Actions', value: 'actions', sortable: false }
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
    initialize () {
      this.tasks = []

      // NOTE: 当日のみ(定期的な予定は含まない)
      dao.init(this.dateString)
        .then((tasks) => {
          this.tasks.push(...tasks)
        })
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
      targetItem.start = nextItem.start
      targetItem.end = nextItem.start + targetDuration

      nextItem.start = task.start
      nextItem.end = task.start + nextDuration

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

      const defaultTime = this.roundTime(taskDate.getTime()) + defaultPeriod

      const task = new Task('', {
        event_date: this.dateString,
        start: defaultTime,
        end: defaultTime + defaultPeriod,
        timed: true
      })
      this.$refs.detail.open(task)
    },

    updateTask (task) {
      dao.update(task)
        .then(() => {
          const index = this.tasks.findIndex(v => v.id === task.id)
          if (index >= 0) {
            Object.assign(this.tasks[index], task)
          }
        })
    },

    deleteTask (id) {
      dao.delete(id)
        .then(() => {
          const index = this.tasks.findIndex(v => v.id === id)
          if (index >= 0) {
            this.tasks.splice(index, 1)
          }
        })
    },

    addTask () {
      if (!this.taskName || this.taskName === '') {
        return
      }

      // レコードがあれば最後のイベントを参照
      const lastTask = (this.tasks.length > 0)
        ? this.orderedTasks[this.tasks.length - 1]
        : null

      const time = lastTask !== null ? new Date(lastTask.end) : new Date()
      const taskDate = new Date(this.dateString)
      taskDate.setHours(time.getHours(), time.getMinutes())

      const startTime = this.roundTime(taskDate.getTime())
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

      dao.add(task)
        .then(() => {
          this.taskName = ''
          this.tasks.push(task)
        })
    }
  }
}
</script>
