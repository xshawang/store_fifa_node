<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="产品ID" prop="productId">
        <el-input v-model="queryParams.productId" placeholder="请输入产品ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="品牌" prop="brand">
        <el-input v-model="queryParams.brand" placeholder="请输入品牌" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类别" prop="category">
        <el-input v-model="queryParams.category" placeholder="请输入类别" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['biz:product:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['biz:product:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['biz:product:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="productList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="产品ID" align="center" prop="productId" />
      <el-table-column label="产品名称" align="center" prop="productName" :show-overflow-tooltip="true" />
      <el-table-column label="品牌" align="center" prop="brand" />
      <el-table-column label="类别" align="center" prop="category" />
      <el-table-column label="价格" align="center" prop="price">
        <template #default="scope">
          <span>${{ scope.row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="图片" align="center" prop="imageUrl" width="100">
        <template #default="scope">
          <el-image v-if="scope.row.imageUrl" :src="scope.row.imageUrl" :preview-src-list="[scope.row.imageUrl]" style="width: 50px; height: 50px" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:product:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:product:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改产品对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="productRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="产品ID" prop="productId">
              <el-input v-model="form.productId" placeholder="请输入产品ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别" prop="category">
              <el-input v-model="form.category" placeholder="请输入类别" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input v-model="form.price" placeholder="请输入价格" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="产品URL" prop="productUrl">
              <el-input v-model="form.productUrl" placeholder="请输入产品URL" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="图片URL" prop="imageUrl">
              <el-input v-model="form.imageUrl" placeholder="请输入图片URL" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="集合" prop="collection">
              <el-input v-model="form.collection" placeholder="请输入集合" />
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

<script setup name="Product">
import { listProduct, getProduct, addProduct, updateProduct, delProduct } from '@/api/biz/product'

const { proxy } = getCurrentInstance()

const productList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productId: null,
    productName: null,
    brand: null,
    category: null,
    status: null,
  },
  rules: {
    productId: [{ required: true, message: '产品ID不能为空', trigger: 'blur' }],
    productName: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  },
})

const { queryParams, form, rules } = toRefs(data)

/** 查询产品列表 */
function getList() {
  loading.value = true
  listProduct(queryParams.value).then((response) => {
    productList.value = response.rows
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
    id: null,
    productId: null,
    productName: null,
    handle: null,
    productUrl: null,
    price: null,
    compareAtPrice: null,
    currency: 'USD',
    brand: null,
    category: null,
    productType: null,
    gender: null,
    nation: null,
    tournament: null,
    colour: null,
    size: null,
    sku: null,
    skuId: null,
    variantId: null,
    barcode: null,
    imageUrl: null,
    description: null,
    availability: null,
    collection: null,
    status: 1,
  }
  proxy.resetForm('productRef')
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
  title.value = '添加产品'
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value
  getProduct(id).then((response) => {
    form.value = response.data
    open.value = true
    title.value = '修改产品'
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs['productRef'].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateProduct(form.value).then((response) => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addProduct(form.value).then((response) => {
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
  const delIds = row.id || ids.value
  proxy.$modal
    .confirm('是否确认删除产品编号为"' + delIds + '"的数据项？')
    .then(function () {
      return delProduct(delIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

getList()
</script>
