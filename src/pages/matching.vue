<template>
  <div class="d-flex flex-column" style="height: 100vh;">
    <header style="height: 40px" class="blue lighten-3 d-flex justify-space-between">
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

      <div class="d-flex justify-center flex-column">
        <span class="pr-2">{{ dateString }}</span>
      </div>
    </header>
    <main class="flex-grow-1 d-flex justify-center" style="overflow-x: scroll; overflow-y: hidden;">
      <v-card
        style="min-width: 420px; max-width: 420px;"
        class="d-flex flex-column grey lighten-4 ma-2 pa-2 select-none"
        elevation="0"
      >
        <div class="flex-grow-0 flex-shrink-0">
          <span class="text-h5">To-Do List</span>
          <v-text-field
            v-model="taskName"
            label="Add Task..."
            hide-details
            @keydown.enter="addTask($event.keyCode === 13)"
          />
        </div>

        <div style="overflow-y: auto;" class="flex-shrink-1">
          <div class="ma-2" />
          <div
            v-for="(task,index) in displayTasks"
            :key="index"
            class="ma-1 pa-2 white select-none d-flex items-center"
            style="height: 36px;"
            :class="{ active: targetTask.id === task.id }"
            draggable="true"
            @dragstart="dragTask(task)"
            @dragover.prevent="dragOverTask(task)"
            @dragend="dragEndHandler"
          >
            <div class="flex-grow-1 no-wrap" :title="task.name">
              {{ task.name }}
            </div>
            <div class="icon" @click="editTask(task)">
              <v-icon small>
                mdi-pencil
              </v-icon>
            </div>
            <div class="icon" @click="deleteTask(task.id)">
              <v-icon small>
                mdi-delete-outline
              </v-icon>
            </div>
          </div>
          <div v-if="displayTasks.length == 0" class="ma-2 pa-2">
            No Task
          </div>
        </div>
      </v-card>

      <v-card
        style="min-width: 400px;"
        class="grey lighten-4 ma-2 pa-2 d-flex flex-column"
        elevation="0"
      >
        <div class="mb-2 text-h5 flex-grow-0 flex-shrink-0 d-flex justify-space-between">
          <div>
            Timetable
            <edit-timetable-dialog :range="range" @update="updateRange" />
          </div>

          <v-btn color="primary" depressed @click="autoMatching">
            AUTO
          </v-btn>
        </div>
        <div style="overflow-y: auto;" class="flex-shrink-1">
          <div class="ma-2" />
          <div
            v-for="(time,index) in timetable"
            :key="index"
            class="grey lighten-4 select-none d-flex"
          >
            <div class="timetable-label">
              <span class="timetable-label__text">{{ time.label }}</span>
            </div>
            <div
              class="timetable-row mx-1 flex-grow-1"
              :class="{ 'border-top': index === 0, 'light-blue lighten-1': time.isEnter }"
              style="min-width: 400px; max-width: 400px; height: 48px;"
              @dragenter="dragEnter(time.id)"
              @dragover.prevent
              @dragleave="dragLeave(time.id)"
              @drop.prevent="drop(time.id)"
            >
              <div
                v-if="time.task !== null"
                class="pa-2 scheduled deep-purple accent-1 select-none d-flex"
                draggable="true"
                @dragstart="dragTask(time.task)"
                @dragover.prevent
                @dragend="dragEndHandler"
              >
                <div class="flex-grow-1 no-wrap" :title="time.task.name">
                  {{ time.task.name }}
                </div>
                <div class="icon icon--white" @click="cancelSchedule(time.id, time.task)">
                  <v-icon small color="white">
                    mdi-cancel
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </main>
    <input-form ref="detail" @update="updateTask" @delete="deleteTask" />
  </div>
</template>

<script>
import { Task } from '@/model/Task'
import { TaskDao } from '@/dao/TaskDao'
import { toDateString, toTimeString, converToDate } from '@/util/TimeUtil'
import EditTimetableDialog from '@/components/EditTimetableDialog'
import InputForm from '@/components/InputForm'

const dao = new TaskDao()

export default {
  components: {
    EditTimetableDialog,
    InputForm
  },
  data () {
    return {
      targetTask: '',
      categories: [],
      tasks: [],
      timetable: [],
      taskName: '',
      dateString: toDateString(new Date()),
      range: { start: '00:00', end: '24:00' }
    }
  },
  computed: {
    displayTasks () {
      return this.tasks.filter(task => task.event_date === Task.EMPTY_KEY)
    }
  },
  created () {
    this.initialize()
  },
  methods: {
    async initialize () {
      this.createTimetable()

      this.tasks = []
      // NOTE: 当日のみ(定期的な予定は含まない)
      const scheduledTask = await dao.init(this.dateString)
      this.tasks.push(...scheduledTask)

      const pendingTask = await dao.init(Task.EMPTY_KEY)
      this.tasks.push(...pendingTask)

      // 登録済のタスクをタイムテーブルに表示
      this.showScheduledTask()
    },
    /**
     * ドラッグ終了イベント
     * ドロップしなかった場合も実行される
     */
    dragEndHandler () {
      this.targetTask = ''
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
      event.stopPropagation() // バブリングキャンセル
    },
    /**
     * タスクのドラッグ開始イベント
     * @param {Object} task ドラッグ中のタスク
     */
    dragTask (task) {
      this.targetTask = task
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
    },
    /**
     * ドラッグした要素が重なった時のイベント
     * @param {Object} overTask ドラッグ中のタスクの下にあるタスク
     */
    dragOverTask (overTask) {
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'

      // タスクの並び替え
      if (overTask.id !== this.targetTask.id) {
        const deleteIndex = this.tasks.findIndex(task => task.id === this.targetTask.id)
        const addIndex = this.tasks.findIndex(task => task.id === overTask.id)
        this.tasks.splice(deleteIndex, 1)
        this.tasks.splice(addIndex, 0, this.targetTask)
      }
    },
    /**
     * タイムテーブル上へドラッグ要素が入るイベント
     * @param {Number} timeId 挿入先のtimeId
     */
    dragEnter (timeId) {
      const time = this.timetable.find(t => t.id === timeId)
      time.isEnter = true
    },
    /**
     * タイムテーブル上からドラッグ要素が外れるイベント
     * @param {Number} timeId 挿入先のtimeId
     */
    dragLeave (timeId) {
      const time = this.timetable.find(t => t.id === timeId)
      time.isEnter = false
    },
    /**
     * ドロップ時、タイムテーブルにタスクを登録する
     * @param {Number} timeId 挿入先のtimeId
     */
    async drop (timeId) {
      const time = this.timetable.find(t => t.id === timeId)
      time.isEnter = false

      if (this.targetTask !== '') {
        const targetTaskId = this.targetTask.id

        // ドラッグ元のタスクをタイムテーブルから削除
        this.timetable.forEach((t) => {
          if (t.task !== null && t.task.id === targetTaskId) {
            t.task = null
          }
        })

        // すでに登録されている場合は上書き
        const distTask = this.tasks.find(t => t.start === timeId)
        // 上書きされたタスクはタイムテーブルから除外
        await this.cancelTask(distTask)

        // ドロップしたタスクの更新
        const dropedTask = this.tasks.find(task => task.id === targetTaskId)
        if (dropedTask) {
          dropedTask.event_date = this.dateString
          dropedTask.start = time.start
          dropedTask.end = time.end
          await dao.update(dropedTask)
          time.task = dropedTask
        }
      } else {
        time.task = null
      }
    },
    /**
     * 未設定のタスクを追加
     * @param {boolean} executable 実行可能か
     */
    async addTask (executable) {
      if (!executable) {
        // 日本語変換中は無視
        return
      }
      if (!this.taskName || this.taskName === '') {
        return
      }

      const task = new Task(Date.now(), {
        name: this.taskName,
        event_date: Task.EMPTY_KEY,
        start: 0,
        end: 0,
        timed: true
      })

      await dao.add(task)
      this.tasks.push(task)
      this.taskName = ''
    },
    editTask (task) {
      this.$refs.detail.open(task)
    },
    async updateTask (task) {
      await dao.update(task)

      const index = this.tasks.findIndex(v => v.id === task.id)
      if (index >= 0) {
        Object.assign(this.tasks[index], task)
      }
    },
    /**
     * 未設定のタスクを削除
     * @param {Number} taskId
     */
    async deleteTask (taskId) {
      if (!taskId || taskId === '') {
        return
      }

      await dao.delete(taskId)

      const index = this.tasks.findIndex(v => v.id === taskId)
      if (index >= 0) {
        this.tasks.splice(index, 1)
      }
    },
    /**
     * 設定済のタスクをキャンセル
     */
    async cancelTask (task) {
      if (!task) {
        return
      }
      task.event_date = Task.EMPTY_KEY
      task.start = 0
      task.end = 0
      await dao.update(task)
    },
    /**
     * タイムテーブルから設定したタスクをキャンセル
     * @param {Number} timeId タイムテーブルId
     * @param {Object} task キャンセルするタスク
     */
    async cancelSchedule (timeId, task) {
      await this.cancelTask(task)

      const time = this.timetable.find(t => t.id === timeId)
      time.task = null
    },
    async autoMatching () {
      if (!confirm('Do you want to enable auto-matching?')) {
        return
      }
      const pendingTasks = this.tasks.filter(task => task.event_date === Task.EMPTY_KEY)

      const updateTasks = []
      this.timetable.forEach((time) => {
        if (time.task === null && pendingTasks.length > 0) {
          const task = pendingTasks[0]

          task.event_date = this.dateString
          task.start = time.start
          task.end = time.end
          updateTasks.push(task)

          time.task = task
          pendingTasks.splice(0, 1)
        }
      })
      await dao.updateAll(updateTasks)
    },
    /**
     * 表示する時間の設定を変更
     */
    updateRange (val) {
      if (!val) {
        return
      }

      this.range = val

      this.createTimetable()

      this.showScheduledTask()
    },
    /**
     * 登録済のタスクをタイムテーブルに表示
     */
    showScheduledTask () {
      this.timetable.forEach((time) => {
        time.task = this.tasks.find(task => task.start === time.id) ?? null
      })
    },
    /**
     * タイムテーブルデータの作成
     */
    createTimetable () {
      const now = Date.parse(this.dateString)
      const startTime = converToDate(now, this.range.start)
      const endTime = converToDate(now, this.range.end)

      const blockMinutes = 30
      const blockCount = (endTime - startTime) / (60 * 1000 * blockMinutes)

      this.timetable = []

      for (let i = 0; i < blockCount; i++) {
        const timeNum = startTime.getTime()

        this.timetable.push({
          id: timeNum,
          label: `${toTimeString(startTime)}`,
          start: timeNum,
          end: timeNum + (blockMinutes * 60 * 1000),
          isEnter: false,
          task: null
        })

        startTime.setMinutes(startTime.getMinutes() + blockMinutes)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$border-color: map-get($light-blue, 'lighten-3');

.icon {
  height: 22px;
  width: 22px;
  border-radius: 50%;
  background-color: transparent;
  text-align: center;
  vertical-align: middle;
  transition: background-color 0.3s;
  &:hover {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.1);
  }
  &--white:hover {
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.3);
  }
  & i {
    display: inline-block;
    width: 100%;
    height: 100%;
  }
}

.scheduled {
  width: 100%;
  height: 100%;
}

.select-none {
  user-select: none;
}

.timetable-row {
  background-color: map-get($light-blue , 'lighten-4');
  border-bottom: 2px solid $border-color;
  border-right: 2px solid $border-color;
  border-left: 2px solid $border-color;
}

.border-top {
  border-top: 2px solid $border-color;
}

.no-wrap {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timetable-label {
  position: relative;
  min-width: 32px;
  text-align: center;
  font-size: 12px;

  &__text {
    position: absolute;
    top: -9px;
    right: 2px;
  }
}
</style>
