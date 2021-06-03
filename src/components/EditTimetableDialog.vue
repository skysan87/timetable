<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #activator="{ on, attrs }">
      <v-btn
        color="grey darken-2"
        text
        fab
        small
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          mdi-table-edit
        </v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">Timetable Setting</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <time-range :range.sync="tmpRange" />
        </v-container>
        <strong class="red--text">{{ errorMsg }}</strong>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="mr-4 my-1" elevation="0" @click="cancel">
          Cancel
        </v-btn>
        <v-btn color="mr-4 my-1 success" elevation="0" @click="save">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TimeRange from '@/components/TimeRange'

export default {
  name: 'EditTimeTableDialog',

  components: {
    TimeRange
  },

  props: {
    range: {
      type: Object, // ex) { start: '09:00', end: '18:00' }
      default: () => ({ start: null, end: null })
    }
  },

  data: () => ({
    dialog: false,
    rangeValue: null,
    errorMsg: ''
  }),

  computed: {
    tmpRange: {
      get () {
        return this.rangeValue ?? this.range
      },
      set (val) {
        this.rangeValue = val
      }
    }
  },

  methods: {
    save () {
      if (!this.rangeValue || !this.rangeValue.start || !this.rangeValue.end) {
        this.errorMsg = 'All values are required.'
        return
      }

      this.$emit('update', this.rangeValue)
      this.close()
    },

    cancel () {
      this.close()
      this.rangeValue = this.range
    },

    close () {
      this.errorMsg = ''
      this.dialog = false
    }
  }
}
</script>
