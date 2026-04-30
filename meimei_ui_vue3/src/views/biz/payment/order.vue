<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="支付编号" prop="paymentNo">
        <el-input
          v-model="queryParams.paymentNo"
          placeholder="请输入支付编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px">
          <el-option label="待支付" :value="0" />
          <el-option label="支付中" :value="1" />
          <el-option label="支付成功" :value="2" />
          <el-option label="支付失败" :value="3" />
          <el-option label="已取消" :value="4" />
          <el-option label="已退款" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付时间" style="width: 308px">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="支付ID" align="center" prop="id" width="100" />
      <el-table-column label="支付编号" align="center" prop="paymentNo" :show-overflow-tooltip="true" width="220" />
      <el-table-column label="订单编号" align="center" prop="orderNo" :show-overflow-tooltip="true" width="220" />
      <el-table-column label="用户ID" align="center" prop="userId" :show-overflow-tooltip="true" width="150" />
      <el-table-column label="支付金额" align="center" prop="amount" width="100">
        <template #default="scope">
          {{ scope.row.amount }}
        </template>
      </el-table-column>
      <el-table-column label="货币" align="center" prop="currency" width="80" />
      <el-table-column label="支付状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="info">待支付</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="warning">支付中</el-tag>
          <el-tag v-else-if="scope.row.status === 2" type="success">支付成功</el-tag>
          <el-tag v-else-if="scope.row.status === 3" type="danger">支付失败</el-tag>
          <el-tag v-else-if="scope.row.status === 4" type="info">已取消</el-tag>
          <el-tag v-else-if="scope.row.status === 5" type="info">已退款</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付渠道" align="center" prop="paymentChannel" width="150" />
      <el-table-column label="支付方式" align="center" prop="paymentMethod" width="120" />
      <el-table-column label="第三方支付编号" align="center" prop="thirdPaymentNo" :show-overflow-tooltip="true" width="200" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" align="center" prop="paidTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.paidTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup name="PaymentOrderList">
import { listPaymentOrder } from '@/api/biz/payment'
import dayjs from 'dayjs'

const { proxy } = getCurrentInstance()

const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  paymentNo: undefined,
  status: undefined,
  startTime: undefined,
  endTime: undefined,
})

/** 查询列表 */
function getList() {
  loading.value = true
  // 默认查询当天的支付信息
  if (!dateRange.value || dateRange.value.length === 0) {
    const today = dayjs().format('YYYY-MM-DD')
    queryParams.value.startTime = `${today} 00:00:00`
    queryParams.value.endTime = `${today} 23:59:59`
  } else {
    const dates = proxy.addDateRange(queryParams.value, dateRange.value)
    queryParams.value.startTime = dates.startTime
    queryParams.value.endTime = dates.endTime
  }
  
  listPaymentOrder(queryParams.value).then((response) => {
    dataList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  queryParams.value.status = undefined
  queryParams.value.orderNo = undefined
  queryParams.value.paymentNo = undefined
  proxy.resetForm('queryRef')
  handleQuery()
}

getList()
</script>
