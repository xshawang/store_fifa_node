import request from '@/utils/request'

// 查询支付订单列表
export function listPaymentOrder(query) {
  return request({
    url: '/biz/payment/order/list',
    method: 'get',
    params: query,
  })
}

// 查询支付渠道列表
export function listPaymentChannel(query) {
  return request({
    url: '/biz/payment/channel/list',
    method: 'get',
    params: query,
  })
}

// 获取支付渠道详情
export function getPaymentChannel(id) {
  return request({
    url: `/biz/payment/channel/${id}`,
    method: 'get',
  })
}

// 新增支付渠道
export function addPaymentChannel(data) {
  return request({
    url: '/biz/payment/channel',
    method: 'post',
    data: data,
  })
}

// 修改支付渠道
export function updatePaymentChannel(data) {
  return request({
    url: '/biz/payment/channel',
    method: 'put',
    data: data,
  })
}

// 删除支付渠道
export function delPaymentChannel(ids) {
  return request({
    url: `/biz/payment/channel/${ids}`,
    method: 'delete',
  })
}
