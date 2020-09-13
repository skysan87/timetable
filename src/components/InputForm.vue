<template>
  <v-form
    v-show="isNotBlank"
    ref="form"
    @submit="update"
  >
    <v-text-field
      v-model="dummyEvent.name"
      label="Name"
    />
    <v-btn
      color="error"
      class="mr-4"
      @click="deleteEvent"
    >
      Delete
    </v-btn>
    <v-btn
      color="warning"
      class="mr-4"
      @click="clear"
    >
      Clear
    </v-btn>
    <v-btn
      color="success"
      class="mr-4"
      @click="update"
    >
      OK
    </v-btn>
  </v-form>
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
