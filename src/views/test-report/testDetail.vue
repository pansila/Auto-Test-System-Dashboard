<template>
  <div class="page-container">
    <robot-result :data="data" :columns="columns" :stat-columns="statColumns" />
  </div>
</template>

<script>
import { fetchTestDetail } from '@/api/testSuite'
import robotResult from './components/robotResult'

export default {
  name: 'TestDetail',
  components: { robotResult },
  data() {
    return {
      columns: [
        {
          label: 'Step Name',
          key: 'name',
          expand: true,
          align: 'left',
          minWidth: '50',
          headerAlign: 'center'
        },
        {
          label: 'Step Content',
          key: 'content',
          align: 'left',
          minWidth: '200',
          headerAlign: 'center'
        },
        {
          label: 'Status',
          width: '100',
          key: 'status'
        },
        {
          label: 'Duration',
          minWidth: '30',
          key: 'duration'
        }
      ],
      statColumns: [
        {
          label: 'Test Suite',
          key: 'suite'
        },
        {
          label: 'Total',
          key: 'total'
        },
        {
          label: 'Pass',
          key: 'pass'
        },
        {
          label: 'Fail',
          key: 'fail'
        },
        {
          label: 'Pass/Fail',
          key: 'ratio'
        }
      ],
      data: ''
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      try {
        this.data = await fetchTestDetail(this.$route.query.task_id)
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style scoped>
  .page-container{
    margin: 30px;
  }
</style>
