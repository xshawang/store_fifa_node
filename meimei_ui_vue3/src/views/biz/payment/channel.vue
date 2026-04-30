<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="渠道编码" prop="channelCode">
        <el-input
          v-model="queryParams.channelCode"
          placeholder="请输入渠道编码"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="渠道名称" prop="channelName">
        <el-input
          v-model="queryParams.channelName"
          placeholder="请输入渠道名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channelType">
        <el-input
          v-model="queryParams.channelType"
          placeholder="请输入渠道类型"
          clearable
          style="width: 150px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="isActive">
        <el-select v-model="queryParams.isActive" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['biz:channel:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:channel:remove']"
        >删除</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="渠道编码" align="center" prop="channelCode" width="150" />
      <el-table-column label="渠道名称" align="center" prop="channelName" width="150" />
      <el-table-column label="渠道类型" align="center" prop="channelType" width="120" />
      <el-table-column label="API地址" align="center" prop="apiBaseUrl" :show-overflow-tooltip="true" width="200" />
      <el-table-column label="最小金额" align="center" prop="minAmount" width="100">
        <template #default="scope">
          {{ scope.row.minAmount }}
        </template>
      </el-table-column>
      <el-table-column label="最大金额" align="center" prop="maxAmount" width="100">
        <template #default="scope">
          {{ scope.row.maxAmount }}
        </template>
      </el-table-column>
      <el-table-column label="费率" align="center" prop="feeRate" width="80">
        <template #default="scope">
          {{ (scope.row.feeRate * 100).toFixed(2) }}%
        </template>
      </el-table-column>
      <el-table-column label="优先级" align="center" prop="priority" width="80" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="状态" align="center" prop="isActive" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.isActive === 1" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:channel:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:channel:remove']">删除</el-button>
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

    <!-- 添加或修改支付渠道对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="channelRef" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="渠道编码" prop="channelCode">
              <el-input v-model="form.channelCode" placeholder="请输入渠道编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input v-model="form.channelName" placeholder="请输入渠道名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="渠道类型" prop="channelType">
              <el-input v-model="form.channelType" placeholder="如：CREDIT_CARD, QRIS, ALIPAY" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点编码" prop="siteCode">
              <el-input v-model="form.siteCode" placeholder="请输入站点编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="平台密钥" prop="platformKey">
              <el-input v-model="form.platformKey" placeholder="请输入平台密钥" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台秘钥" prop="platformSecret">
              <el-input v-model="form.platformSecret" placeholder="请输入平台秘钥" type="password" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="API地址" prop="apiBaseUrl">
              <el-input v-model="form.apiBaseUrl" placeholder="请输入API基础URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="API版本" prop="apiVersion">
              <el-input v-model="form.apiVersion" placeholder="如：v1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="通知URL" prop="notifyUrl">
              <el-input v-model="form.notifyUrl" placeholder="请输入通知URL" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="支持币种" prop="supportedCurrencies">
              <el-input 
                v-model="supportedCurrenciesText" 
                type="textarea" 
                :rows="3" 
                placeholder='请输入JSON数组，例如: ["USD", "IDR", "EUR"]' 
              />
              <div style="color: #999; font-size: 12px; margin-top: 5px;">格式：JSON数组，如 ["USD", "IDR", "EUR"]</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="支持的支付方式" prop="supportedMethods">
              <el-input 
                v-model="supportedMethodsText" 
                type="textarea" 
                :rows="3" 
                placeholder='请输入JSON数组，例如: ["CREDIT_CARD", "VISA", "MASTERCARD"]' 
              />
              <div style="color: #999; font-size: 12px; margin-top: 5px;">格式：JSON数组，如 ["CREDIT_CARD", "VISA", "MASTERCARD"]</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="最小金额" prop="minAmount">
              <el-input-number v-model="form.minAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大金额" prop="maxAmount">
              <el-input-number v-model="form.maxAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="费率" prop="feeRate">
              <el-input-number v-model="form.feeRate" :min="0" :max="1" :step="0.001" :precision="4" controls-position="right" style="width: 100%" />
              <span style="margin-left: 10px; color: #999;">(如：0.029 表示 2.9%)</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="form.priority" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用" prop="isActive">
              <el-radio-group v-model="form.isActive">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PaymentChannel">
import { listPaymentChannel, getPaymentChannel, addPaymentChannel, updatePaymentChannel, delPaymentChannel } from '@/api/biz/payment'

const { proxy } = getCurrentInstance()

const dataList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

// 用于textarea显示的JSON字符串
const supportedCurrenciesText = ref('')
const supportedMethodsText = ref('')

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    channelCode: undefined,
    channelName: undefined,
    channelType: undefined,
    isActive: undefined,
  },
  rules: {
    channelCode: [{ required: true, message: '渠道编码不能为空', trigger: 'blur' }],
    channelName: [{ required: true, message: '渠道名称不能为空', trigger: 'blur' }],
    channelType: [{ required: true, message: '渠道类型不能为空', trigger: 'blur' }],
    platformKey: [{ required: true, message: '平台密钥不能为空', trigger: 'blur' }],
    platformSecret: [{ required: true, message: '平台秘钥不能为空', trigger: 'blur' }],
    apiBaseUrl: [{ required: true, message: 'API地址不能为空', trigger: 'blur' }],
    notifyUrl: [{ required: true, message: '通知URL不能为空', trigger: 'blur' }],
  },
})

const { queryParams, form, rules } = toRefs(data)

/** 查询列表 */
function getList() {
  loading.value = true
  listPaymentChannel(queryParams.value).then((response) => {
    dataList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    channelCode: undefined,
    channelName: undefined,
    channelType: undefined,
    platformKey: undefined,
    platformSecret: undefined,
    siteCode: undefined,
    apiBaseUrl: undefined,
    apiVersion: 'v1',
    notifyUrl: undefined,
    minAmount: 0,
    maxAmount: 999999.99,
    feeRate: 0,
    isActive: 1,
    priority: 0,
    sortOrder: 0,
    config: undefined,
    remark: undefined,
    supportedCurrencies: [],
    supportedMethods: [],
  }
  supportedCurrenciesText.value = ''
  supportedMethodsText.value = ''
  proxy.resetForm('channelRef')
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = '添加支付渠道'
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value
  getPaymentChannel(id).then((response) => {
    form.value = response.data
    
    // 将数组转换为JSON字符串显示
    if (form.value.supportedCurrencies && Array.isArray(form.value.supportedCurrencies)) {
      supportedCurrenciesText.value = JSON.stringify(form.value.supportedCurrencies, null, 2)
    } else {
      supportedCurrenciesText.value = ''
    }
    
    if (form.value.supportedMethods && Array.isArray(form.value.supportedMethods)) {
      supportedMethodsText.value = JSON.stringify(form.value.supportedMethods, null, 2)
    } else {
      supportedMethodsText.value = ''
    }
    
    open.value = true
    title.value = '修改支付渠道'
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs['channelRef'].validate((valid) => {
    if (valid) {
      // 将JSON字符串转换为数组
      try {
        if (supportedCurrenciesText.value) {
          form.value.supportedCurrencies = JSON.parse(supportedCurrenciesText.value)
        } else {
          form.value.supportedCurrencies = []
        }
      } catch (e) {
        proxy.$modal.msgError('支持币种格式错误，请输入有效的JSON数组')
        return
      }
      
      try {
        if (supportedMethodsText.value) {
          form.value.supportedMethods = JSON.parse(supportedMethodsText.value)
        } else {
          form.value.supportedMethods = []
        }
      } catch (e) {
        proxy.$modal.msgError('支持的支付方式格式错误，请输入有效的JSON数组')
        return
      }
      
      if (form.value.id != undefined) {
        updatePaymentChannel(form.value).then((response) => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addPaymentChannel(form.value).then((response) => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const dataIds = row.id || ids.value
  proxy.$modal
    .confirm('是否确认删除编号为"' + dataIds + '"的数据项？')
    .then(function () {
      return delPaymentChannel(dataIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

getList()
</script>
