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

export default {
  name: 'InputForm',
  data: () => ({
    dummyEvent: new Task('', {}),
    isShown: false
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
    },
    update (event) {
      event.preventDefault()
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
