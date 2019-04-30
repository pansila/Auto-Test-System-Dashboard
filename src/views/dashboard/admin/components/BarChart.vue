<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { debounce } from '@/utils'
import { fetchTaskList } from '@/api/testSuite'

const animationDuration = 3000

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
      succeeded: [],
      failed: [],
      chart: null,
      days: ['-6d', '-5d', '-4d', '-3d', '-2d', '-1d', '0d'],
      listQuery: {
        start_date: Date.now() - 604800000,
        end_date: Date.now()
      }
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
          trigger: 'axis',
          axisPointer: { // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          top: 10,
          left: '2%',
          right: '2%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [{
          type: 'category',
          data: this.days,
          axisTick: {
            alignWithLabel: true
          }
        }],
        yAxis: [{
          type: 'value',
          axisTick: {
            show: false
          }
        }],
        series: [{
          name: 'Succeeded',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: this.succeeded,
          animationDuration
        }, {
          name: 'Failed',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: this.failed,
          animationDuration
        }]
      })
    },
    async fetchData() {
      const items = await fetchTaskList(this.listQuery)
      for (const i in items) {
        this.succeeded[i] = items[i].succeeded
        this.failed[i] = items[i].failed
      }
      this.chart.setOption({
        series: [{
          name: 'Succeeded',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: this.succeeded,
          animationDuration
        }, {
          name: 'Failed',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: this.failed,
          animationDuration
        }]
      })
    }
  }
}
</script>
