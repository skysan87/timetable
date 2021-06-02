<template>
  <v-row>
    <!-- Start Time -->
    <v-col cols="6">
      <v-menu
        ref="startMenu"
        v-model="startMenu"
        :close-on-content-click="false"
        :nudge-right="40"
        :return-value.sync="start"
        transition="scale-transition"
        offset-y
        max-width="290px"
        min-width="290px"
      >
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="start"
            label="Start"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            v-bind="attrs"
            v-on="on"
          />
        </template>
        <v-time-picker
          v-if="startMenu"
          v-model="start"
          :allowed-minutes="[0, 15, 30, 45]"
          :max="end"
          full-width
          @click:minute="saveStartTime(start)"
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
        :return-value.sync="end"
        transition="scale-transition"
        offset-y
        max-width="290px"
        min-width="290px"
      >
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="end"
            label="End"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            v-bind="attrs"
            v-on="on"
          />
        </template>
        <v-time-picker
          v-if="endMenu"
          v-model="end"
          :allowed-minutes="[0, 15, 30, 45]"
          :min="start"
          full-width
          @click:minute="saveEndTime(end)"
        />
      </v-menu>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'TimeRange',

  props: {
    range: {
      type: Object,
      default: () => ({ start: null, end: null })
    }
  },

  data: () => ({
    startMenu: false,
    endMenu: false
  }),

  computed: {
    start: {
      get () {
        return this.range.start
      },
      set (val) {
        this.$emit('update:range', { start: val, end: this.range.end })
      }
    },
    end: {
      get () {
        return this.range.end
      },
      set (val) {
        this.$emit('update:range', { start: this.range.start, end: val })
      }
    }
  },
  methods: {
    saveStartTime (val) {
      this.$refs.startMenu.save(val)
    },
    saveEndTime (val) {
      this.$refs.endMenu.save(val)
    }
  }
}
</script>
