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
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="queryParams.email"
          placeholder="请输入邮箱"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="queryParams.phone"
          placeholder="请输入电话"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="请选择订单状态" clearable style="width: 150px">
          <el-option label="待支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
          <el-option label="退款中" :value="5" />
          <el-option label="已退款" :value="6" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付状态" prop="paymentStatus">
        <el-select v-model="queryParams.paymentStatus" placeholder="请选择支付状态" clearable style="width: 150px">
          <el-option label="未支付" :value="0" />
          <el-option label="支付中" :value="1" />
          <el-option label="已支付" :value="2" />
          <el-option label="支付失败" :value="3" />
          <el-option label="已退款" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
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
      <el-table-column label="订单ID" align="center" prop="orderId" width="200" />
      <el-table-column label="订单编号" align="center" prop="orderNo" :show-overflow-tooltip="true" width="250">
        <template #default="scope">
          <el-button link type="primary" @click="handleViewDetail(scope.row.orderNo)">
            {{ scope.row.orderNo }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="用户ID" align="center" prop="userId" :show-overflow-tooltip="true" width="350" />
      <el-table-column label="订单状态" align="center" prop="orderStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.orderStatus === 0" type="info">待支付</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 1" type="success">已支付</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 2" type="primary">已发货</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 3" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 4" type="danger">已取消</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 5" type="warning">退款中</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 6" type="info">已退款</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付状态" align="center" prop="paymentStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.paymentStatus === 0" type="info">未支付</el-tag>
          <el-tag v-else-if="scope.row.paymentStatus === 1" type="warning">支付中</el-tag>
          <el-tag v-else-if="scope.row.paymentStatus === 2" type="success">已支付</el-tag>
          <el-tag v-else-if="scope.row.paymentStatus === 3" type="danger">支付失败</el-tag>
          <el-tag v-else-if="scope.row.paymentStatus === 4" type="info">已退款</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单金额" align="center" prop="totalAmount" width="120">
        <template #default="scope">
          {{ (scope.row.totalAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="货币" align="center" prop="currency" width="80" />
      <el-table-column label="邮箱" align="center" prop="email" :show-overflow-tooltip="true" width="200" />
      <el-table-column label="电话" align="center" prop="phone" :show-overflow-tooltip="true" width="150" />
      <el-table-column label="支付编号" align="center" prop="paymentTransactionId" :show-overflow-tooltip="true" width="250">
        <template #default="scope">
          <el-button v-if="scope.row.paymentTransactionId" link type="primary" @click="handleViewPayments(scope.row.orderNo)">
            {{ scope.row.paymentTransactionId }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
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

    <!-- 订单详情弹窗 -->
    <el-dialog title="订单详情" v-model="detailOpen" width="900px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag v-if="detailData.orderStatus === 0" type="info">待支付</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 1" type="success">已支付</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 2" type="primary">已发货</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 3" type="success">已完成</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 4" type="danger">已取消</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 5" type="warning">退款中</el-tag>
          <el-tag v-else-if="detailData.orderStatus === 6" type="info">已退款</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ detailData.totalAmount }} {{ detailData.currency }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag v-if="detailData.paymentStatus === 0" type="info">未支付</el-tag>
          <el-tag v-else-if="detailData.paymentStatus === 1" type="warning">支付中</el-tag>
          <el-tag v-else-if="detailData.paymentStatus === 2" type="success">已支付</el-tag>
          <el-tag v-else-if="detailData.paymentStatus === 3" type="danger">支付失败</el-tag>
          <el-tag v-else-if="detailData.paymentStatus === 4" type="info">已退款</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>收货信息</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="收货人">{{ detailData.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="国家/地区">{{ detailData.country }} {{ detailData.countryCode ? '(' + detailData.countryCode + ')' : '' }}</el-descriptions-item>
        <el-descriptions-item label="邮政编码">{{ detailData.postalCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="省份/州">{{ detailData.province || '-' }}</el-descriptions-item>
        <el-descriptions-item label="城市">{{ detailData.city || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址" :span="2">{{ detailData.address1 }} {{ detailData.address2 }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>订单商品</el-divider>
      <el-table :data="detailData.items" border>
        <el-table-column label="产品图片" align="center" prop="productImage" width="100">
          <template #default="scope">
            <el-image v-if="scope.row.productImage" :src="scope.row.productImage" style="width: 60px; height: 60px" fit="contain" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="center" prop="productName" :show-overflow-tooltip="true" />
        <el-table-column label="规格编号" align="center" prop="skuCode" width="120" />
        <el-table-column label="尺码" align="center" prop="size" width="80" />
        <el-table-column label="数量" align="center" prop="quantity" width="80" />
        <el-table-column label="售价" align="center" prop="salePrice" width="100">
          <template #default="scope">
            {{ scope.row.salePrice}}
          </template>
        </el-table-column>
        <el-table-column label="小计" align="center" prop="subtotalAmount" width="100">
          <template #default="scope">
            {{ scope.row.subtotalAmount }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 支付信息弹窗 -->
    <el-dialog title="支付信息" v-model="paymentOpen" width="1000px" append-to-body>
      <el-table :data="paymentData" border>
        <el-table-column label="支付编号" align="center" prop="paymentNo" :show-overflow-tooltip="true" width="200" />
        <el-table-column label="订单编号" align="center" prop="orderNo" :show-overflow-tooltip="true" width="200" />
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
        <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付渠道" align="center" prop="paymentChannel" width="150" />
        <el-table-column label="支付方式" align="center" prop="paymentMethod" width="120" />
        <el-table-column label="第三方支付编号" align="center" prop="thirdPaymentNo" :show-overflow-tooltip="true" width="200" />
        <el-table-column label="支付时间" align="center" prop="paidTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.paidTime) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="OrderManagement">
import { listOrder, getOrderDetail, getOrderPayments } from '@/api/biz/order'

const { proxy } = getCurrentInstance()

const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])

const detailOpen = ref(false)
const detailData = ref({
  orderNo: '',
  orderStatus: 0,
  paymentStatus: 0,
  totalAmount: 0,
  currency: 'USD',
  fullName: '',
  email: '',
  phone: '',
  countryCode: '',
  address1: '',
  address2: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  items: []
})

const paymentOpen = ref(false)
const paymentData = ref([])

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  email: undefined,
  phone: undefined,
  orderStatus: 1,  // 默认已支付
  paymentStatus: 2,  // 默认支付成功
  startTime: undefined,
  endTime: undefined,
})

/** 查询列表 */
function getList() {
  loading.value = true
  listOrder(proxy.addDateRange(queryParams.value, dateRange.value)).then((response) => {
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
  queryParams.value.orderStatus = 1  // 重置为默认值
  queryParams.value.paymentStatus = 2  // 重置为默认值
  proxy.resetForm('queryRef')
  handleQuery()
}

/** 查看订单详情 */
function handleViewDetail(orderNo) {
  getOrderDetail(orderNo).then((response) => {
    console.log('订单详情响应:', response)
    // 后端返回 { order: {...}, items: [...], deliver: {...} }
    const detail = response.data || response
    
    if (detail && detail.order) {
      // 合并订单信息和配送信息
      detailData.value = {
        ...detail.order,
        items: detail.items || [],
        // 使用配送信息覆盖订单中的收货信息
        ...(detail.deliver ? {
          fullName: detail.deliver.recipientName,
          phone: detail.deliver.recipientPhone,
          email: detail.deliver.recipientEmail,
          country: detail.deliver.country,
          countryCode: detail.deliver.countryCode,
          province: detail.deliver.province,
          city: detail.deliver.city,
          postalCode: detail.deliver.postalCode,
          address1: detail.deliver.addressLine1,
          address2: detail.deliver.addressLine2,
        } : {})
      }
    } else if (detail && detail.items) {
      // 如果返回的直接就是 { order字段, items }
      detailData.value = detail
    } else {
      // 兼容其他情况
      detailData.value = {
        ...detail,
        items: detail.items || []
      }
    }
    
    detailOpen.value = true
  }).catch(error => {
    console.error('获取订单详情失败:', error)
    proxy.$modal.msgError('获取订单详情失败')
  })
}

/** 查看支付信息 */
function handleViewPayments(orderNo) {
  getOrderPayments(orderNo).then((response) => {
    paymentData.value = response.data
    paymentOpen.value = true
  })
}

getList()
</script>
