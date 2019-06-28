<template>
  <el-row :gutter="40" class="panel-group">
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
        <div class="card-panel-icon-wrapper icon-example">
          <svg-icon icon-class="example" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">Tests Finished</div>
          <count-to :start-val="0" :end-val="finished" :duration="2600" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('messages')">
        <div class="card-panel-icon-wrapper icon-bug">
          <svg-icon icon-class="bug" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">Tests Failed</div>
          <count-to :start-val="0" :end-val="failed" :duration="3000" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('purchases')">
        <div class="card-panel-icon-wrapper icon-guide">
          <svg-icon icon-class="guide" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">Tests Running</div>
          <count-to :start-val="0" :end-val="running" :duration="3200" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="handleSetLineChartData('shoppings')">
        <div class="card-panel-icon-wrapper icon-eye">
          <svg-icon icon-class="eye" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">Tests Waiting</div>
          <count-to :start-val="0" :end-val="waiting" :duration="3600" class="card-panel-num" />
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import CountTo from 'vue-count-to'
import { fetchTaskList } from '@/api/testSuite'

export default {
  components: {
    CountTo
  },
  data() {
    return {
      finished: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      waiting: 0,
      listQuery: {}
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(newVal) {
      await this.fetchData()
    }
  },
  async created() {
    await this.fetchData()
  },
  methods: {
    handleSetLineChartData(type) {
      this.$emit('handleSetLineChartData', type)
    },
    async fetchData() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.start_date = Date.now() - 604800000
      this.listQuery.end_date = Date.now()
      this.listQuery.organization = organization
      this.listQuery.team = team
      const items = await fetchTaskList(this.listQuery)
      let finished = 0
      let failed = 0
      let running = 0
      let waiting = 0
      for (const i in items) {
        finished += items[i].succeeded + items[i].failed
        failed += items[i].failed
        running += items[i].running
        waiting += items[i].waiting
      }
      this.finished = finished
      this.failed = failed
      this.running = running
      this.waiting = waiting
    }
  }
}
</script>

<style lang="scss" scoped>
.panel-group {
  margin-top: 18px;

  .card-panel-col {
    margin-bottom: 32px;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }
      .icon-example {
        background: #36a3f7;
      }
      .icon-bug {
        background: #f4516c;
      }
      .icon-guide {
        background: #40c9c6;
      }
      .icon-eye {
        background: #36a3f7;
      }
    }
    .icon-example {
      color: #36a3f7;
    }
    .icon-bug {
      color: #f4516c;
    }
    .icon-guide {
      color: #40c9c6;
    }
    .icon-eye {
      color: #36a3f7;
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

@media (max-width:550px) {
  .card-panel-description {
    display: none;
  }

  .card-panel-icon-wrapper {
    float: none !important;
    width: 100%;
    height: 100%;
    margin: 0 !important;

    .svg-icon {
      display: block;
      margin: 14px auto !important;
      float: none !important;
    }
  }
}
</style>
