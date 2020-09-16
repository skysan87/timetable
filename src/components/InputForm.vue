<template>
  <v-card v-show="isNotBlank" flat class="mx-auto">
    <v-list-item two-line>
      <v-list-item-content>
        <v-list-item-title class="headline">Event</v-list-item-title>
        <!-- <v-list-item-subtitle></v-list-item-subtitle> -->
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
        <v-btn
          class="mr-4 my-1"
          @click="clear"
        >
          Clear
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
</template>

<script>
import { Task } from '@/model/Task'

export default {
  props: {
    event: {
      type: Object,
      default () {
        return new Task('', {})
      }
    }
  },
  data: () => ({
    dummyEvent: new Task('', {})
  }),
  computed: {
    isNotBlank () {
      return !!this.event
    }
  },
  watch: {
    event (newEvent) {
      if (newEvent) {
        // Copy
        Object.assign(this.dummyEvent, newEvent)
      } else {
        this.dummyEvent = new Task('', {})
      }
    }
  },
  methods: {
    update (event) {
      event.preventDefault()
      this.$emit('update', this.dummyEvent)
    },
    clear () {
      this.$emit('clear')
    },
    deleteEvent () {
      if (confirm('Do you delete this event?')) {
        this.$emit('delete', this.dummyEvent.id)
      }
    }
  }
}
</script>
