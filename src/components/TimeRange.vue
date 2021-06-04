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

/**
 * 分の単位の範囲を取得
 * @param {Number} span 15, 30
 */
const getMinutesRange = (span) => {
  const step = 60 / span
  return Array.from({ length: step }, (v, k) => k * span)
}

/**
 * 分単位の時間差を計算
 * @param {Number} startHour 開始:時
 * @param {Number} startMinute 開始:分
 * @param {Number} endHour 終了:時
 * @param {Number} endMinute 終了:分
 */
const timediffMinutes = (startHour, startMinute, endHour, endMinute) => {
  const start = new Date(2020, 1, 1, startHour, startMinute, 0, 0)
  const end = new Date(2020, 1, 1, endHour, endMinute, 0, 0)

  return (end - start) / (1000 * 60)
}

export default {
  name: 'TimeRange',

  props: {
    range: {
      type: Object,
      default: () => ({ start: null, end: null })
    },
    minuteSpan: {
      type: Number,
      default: 15
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
        const sm = this.startMinute
        const eh = this.endHour
        const em = this.endMinute
        return Array.from({ length: 24 }, (v, k) => k)
          .filter((h) => {
            return timediffMinutes(h, sm, eh, em) >= this.minuteSpan
          })
      }
    },
    startMRange: {
      get () {
        const sh = this.startHour
        const eh = this.endHour
        const em = this.endMinute
        return getMinutesRange(this.minuteSpan).filter((m) => {
          return timediffMinutes(sh, m, eh, em) >= this.minuteSpan
        })
      }
    },
    endHRange: {
      get () {
        const sh = this.startHour
        const sm = this.startMinute
        const em = this.endMinute
        return Array.from({ length: 24 }, (v, k) => k)
          .filter((h) => {
            return timediffMinutes(sh, sm, h, em) >= this.minuteSpan
          })
      }
    },
    endMRange: {
      get () {
        const sh = this.startHour
        const sm = this.startMinute
        const eh = this.endHour
        return getMinutesRange(this.minuteSpan).filter((m) => {
          return timediffMinutes(sh, sm, eh, m) >= this.minuteSpan
        })
      }
    },
    enable24h: {
      get () {
        return this.endHour === 24
      },
      set (val) {
        const starttime = (!val && this.startHour === 23) ? '23:00' : this.range.start
        const endtime = val ? '24:00' : `23:${this.minuteSpan}`
        this.$emit('update:range', { start: starttime, end: endtime })
      }
    }
  }
}
</script>
