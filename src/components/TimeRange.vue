<template>
  <v-row>
    <!-- Start Time -->
    <v-col cols="6">
      <div class="d-flex" style="height: 26px;">
        <span>Start</span>
      </div>
      <v-row no-gutters>
        <v-col cols="6">
          <v-select
            v-model="startHour"
            :items="startHRange"
            label="Hour"
            hide-details
            outlined
          />
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="startMinute"
            :items="startMRange"
            label="Minute"
            hide-details
            outlined
          />
        </v-col>
      </v-row>
    </v-col>
    <!-- End Time -->
    <v-col cols="6">
      <div class="d-flex justify-space-between mb-0" style="height: 26px;">
        <span>End</span>
        <v-checkbox
          v-model="enable24h"
          class="pa-0 ma-0"
          label="24:00"
          dense
          hide-details
        />
      </div>
      <v-row v-show="!enable24h" no-gutters>
        <v-col cols="6">
          <v-select
            v-model="endHour"
            :items="endHRange"
            label="Hour"
            hide-details
            outlined
          />
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="endMinute"
            :items="endMRange"
            label="Minute"
            hide-details
            outlined
          />
        </v-col>
      </v-row>
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

  computed: {
    startHour: {
      get () {
        return this.range.start !== null
          ? parseInt(this.range.start.split(':')[0])
          : 0
      },
      set (val) {
        const time = `${val}:${this.startMinute}`
        this.$emit('update:range', { start: time, end: this.range.end })
      }
    },
    startMinute: {
      get () {
        return this.range.start !== null
          ? parseInt(this.range.start.split(':')[1])
          : 0
      },
      set (val) {
        const time = `${this.startHour}:${val}`
        this.$emit('update:range', { start: time, end: this.range.end })
      }
    },
    endHour: {
      get () {
        return this.range.end !== null
          ? parseInt(this.range.end.split(':')[0])
          : 1
      },
      set (val) {
        const time = `${val}:${this.endMinute}`
        this.$emit('update:range', { start: this.range.start, end: time })
      }
    },
    endMinute: {
      get () {
        return this.range.end !== null
          ? parseInt(this.range.end.split(':')[1])
          : 0
      },
      set (val) {
        const time = `${this.endHour}:${val}`
        this.$emit('update:range', { start: this.range.start, end: time })
      }
    },
    startHRange: {
      get () {
        const count = (this.endHour !== 24) ? this.endHour + 1 : this.endHour
        return Array.from({ length: count }, (v, k) => k)
      }
    },
    startMRange: {
      get () {
        if (this.startHour === this.endHour) {
          return Array.from({ length: 4 }, (v, k) => k * 15)
            .filter(t => t < this.endMinute)
        } else {
          return Array.from({ length: 4 }, (v, k) => k * 15)
        }
      }
    },
    endHRange: {
      get () {
        // 差が1時間以内
        if (this.endHour - this.startHour <= 1 && this.endMinute <= this.startMinute) {
          return Array.from({ length: 24 }, (v, k) => k)
            .filter(t => t > this.startHour)
        } else {
          return Array.from({ length: 24 }, (v, k) => k)
            .filter(t => t >= this.startHour)
        }
      }
    },
    endMRange: {
      get () {
        if (this.startHour === this.endHour) {
          return Array.from({ length: 4 }, (v, k) => k * 15)
            .filter(t => t > this.startMinute)
        } else {
          return Array.from({ length: 4 }, (v, k) => k * 15)
        }
      }
    },
    enable24h: {
      get () {
        return this.endHour === 24
      },
      set (val) {
        const time = val ? '24:00' : '23:30'
        this.$emit('update:range', { start: this.range.start, end: time })
      }
    }
  }
}
</script>
