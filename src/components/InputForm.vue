<template>
  <v-dialog v-model="isShown" persistent max-width="600px">
    <v-card class="mx-auto" flat>
      <v-list-item two-line>
        <v-list-item-content>
          <v-list-item-title class="headline">
            Event
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-card-text>
        <v-form
          ref="form"
          @submit="update"
        >
          <v-text-field
            v-model="dummyEvent.name"
            label="Name"
          />
          <v-checkbox
            v-model="isFrequent"
            label="Frequent"
          />
          <!-- TODO: コンポーネント化 -->
          <v-row>
            <!-- Start Time -->
            <v-col cols="6">
              <v-menu
                ref="startMenu"
                v-model="startMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                :return-value.sync="startTime"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template #activator="{ on, attrs }">
                  <v-text-field
                    v-model="startTime"
                    label="Start"
                    prepend-icon="mdi-clock-time-four-outline"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  />
                </template>
                <v-time-picker
                  v-if="startMenu"
                  v-model="startTime"
                  :allowed-minutes="[0, 15, 30, 45]"
                  :max="endTime"
                  full-width
                  @click:minute="$refs.startMenu.save(startTime)"
                />
              </v-menu>
            </v-col>
            <!-- End Time -->
            <v-col cols="6">
              <v-menu
                ref="endMenu"
                v-model="endMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                :return-value.sync="endTime"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template #activator="{ on, attrs }">
                  <v-text-field
                    v-model="endTime"
                    label="End"
                    prepend-icon="mdi-clock-time-four-outline"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  />
                </template>
                <v-time-picker
                  v-if="endMenu"
                  v-model="endTime"
                  :allowed-minutes="[0, 15, 30, 45]"
                  :min="startTime"
                  full-width
                  @click:minute="$refs.endMenu.save(endTime)"
                />
              </v-menu>
            </v-col>
          </v-row>
          <v-btn
            class="mr-4 my-1"
            @click="clear"
          >
            Close
          </v-btn>
          <v-btn
            color="success"
            class="mr-4 my-1"
            @click="update"
          >
            Update
          </v-btn>
          <v-btn
            class="mr-4 my-1"
            color="error"
            @click="deleteEvent"
          >
            Delete
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { Task } from '@/model/Task'

/**
 * 2桁表示
 * @param {Number} num
 * @returns {String}
 */
const to2Digit = (num) => {
  return num.toString().padStart(2, '0')
}

/**
 * UTCミリ秒を「HH:mm」形式に変更
 * @param {Number} datetime UTCミリ秒
 * @returns {String}
 */
const convertToClock = (datetime) => {
  const date = new Date(datetime)
  return `${to2Digit(date.getHours())}:${to2Digit(date.getMinutes())}`
}

/**
 * Date型に変換
 * @param {Number} datetime UTCミリ秒
 * @param {String} clock HH:mm
 * @return {Date}
 */
const converToDate = (datetime, clock) => {
  const clocks = clock.split(':')
  const date = new Date(datetime)
  date.setHours(parseInt(clocks[0]), parseInt(clocks[1]), 0, 0)
  return date
}

export default {
  name: 'InputForm',
  data: () => ({
    dummyEvent: new Task('', {}),
    isShown: false,
    startTime: null,
    endTime: null,
    startMenu: false,
    endMenu: false
  }),
  computed: {
    isFrequent: {
      get () {
        return this.dummyEvent.type === Task.TYPE_FREQUENT
      },
      set (value) {
        this.dummyEvent.type = value ? Task.TYPE_FREQUENT : Task.TYPE_EVENT
      }
    }
  },
  methods: {
    open (event) {
      this.isShown = true
      Object.assign(this.dummyEvent, event)
      this.startTime = convertToClock(this.dummyEvent.start)
      this.endTime = convertToClock(this.dummyEvent.end)
    },
    update (event) {
      event.preventDefault()
      this.dummyEvent.start = converToDate(this.dummyEvent.start, this.startTime)
      this.dummyEvent.end = converToDate(this.dummyEvent.end, this.endTime)
      this.$emit('update', this.dummyEvent)
      this.isShown = false
      this.dummyEvent = new Task('', {})
    },
    clear () {
      this.$emit('clear')
      this.isShown = false
      this.dummyEvent = new Task('', {})
    },
    deleteEvent () {
      if (confirm('Do you delete this event?')) {
        this.$emit('delete', this.dummyEvent.id)
        this.isShown = false
        this.dummyEvent = new Task('', {})
      }
    }
  }
}
</script>
