<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import { mapGetters } from 'vuex'
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { debounce } from '@/utils'
import { fetchTaskList } from '@/api/testSuite'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      succeeded: 0,
      failed: 0,
      running: 0,
      waiting: 0,
      chart: null,
      listQuery: {
        start_date: Date.now() - 604800000,
        end_date: Date.now()
      }
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(newVal) {
      if (!newVal) return
      await this.fetchData()
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
    this.__resizeHandler = debounce(() => {
      if (this.chart) {
        this.chart.resize()
      }
    }, 100)
    window.addEventListener('resize', this.__resizeHandler)
    this.fetchData()
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        legend: {
          left: 'center',
          bottom: '10',
          data: [this.$t('stats.succeeded'), this.$t('stats.failed'), this.$t('stats.running'), this.$t('stats.waiting')]
        },
        series: [
          {
            name: 'WEEKLY TEST STATISTICS',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            center: ['50%', '38%'],
            data: [
              { value: 320, name: this.$t('stats.succeeded') },
              { value: 240, name: this.$t('stats.failed') },
              { value: 149, name: this.$t('stats.running') },
              { value: 100, name: this.$t('stats.waiting') }
            ],
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ]
      })
    },
    async fetchData() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team
      const items = await fetchTaskList(this.listQuery)
      let succeeded = 0
      let failed = 0
      let running = 0
      let waiting = 0
      for (const i in items) {
        succeeded += items[i].succeeded
        failed += items[i].failed
        running += items[i].running
        waiting += items[i].waiting
      }
      this.succeeded = succeeded
      this.failed = failed
      this.running = running
      this.waiting = waiting

      this.chart.setOption({
        series: [
          {
            name: 'WEEKLY TEST STATISTICS',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            center: ['50%', '38%'],
            data: [
              { value: this.succeeded, name: this.$t('stats.succeeded') },
              { value: this.failed, name: this.$t('stats.failed') },
              { value: this.running, name: this.$t('stats.running') },
              { value: this.waiting, name: this.$t('stats.waiting') }
            ],
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ]
      })
    }
  }
}
</script>
