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
          <v-row>
            <v-col cols="6">
              <v-checkbox
                v-model="isFrequent"
                label="Frequent"
              />
            </v-col>
            <v-col cols="6">
              <v-checkbox
                v-model="dummyEvent.private"
                label="Private"
              />
            </v-col>
          </v-row>
          <time-range :range.sync="tmpRange" :minute-span="15" :show24h="false" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          class="mr-4 my-1"
          elevation="0"
          @click="clear"
        >
          Close
        </v-btn>
        <v-btn
          color="success"
          class="mr-4 my-1"
          elevation="0"
          @click="update"
        >
          Update
        </v-btn>
        <v-btn
          class="mr-4 my-1"
          color="error"
          elevation="0"
          @click="deleteEvent"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { Task } from '@/model/Task'
import { convertToClock, converToDate } from '@/util/TimeUtil'
import TimeRange from '@/components/TimeRange'

export default {
  name: 'InputForm',
  components: {
    TimeRange
  },
  data: () => ({
    dummyEvent: new Task('', {}),
    isShown: false,
    tmpRange: { start: null, end: null }
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
      this.tmpRange.start = convertToClock(this.dummyEvent.start)
      this.tmpRange.end = convertToClock(this.dummyEvent.end)
    },
    update (event) {
      event.preventDefault()
      this.dummyEvent.start = converToDate(this.dummyEvent.start, this.tmpRange.start).getTime()
      this.dummyEvent.end = converToDate(this.dummyEvent.end, this.tmpRange.end).getTime()
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
