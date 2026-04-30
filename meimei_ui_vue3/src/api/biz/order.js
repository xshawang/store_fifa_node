import request from '@/utils/request'

// 查询订单列表
export function listOrder(query) {
  return request({
    url: '/biz/order/list',
    method: 'get',
    params: query,
  })
}

// 获取订单详情（包含订单项）
export function getOrderDetail(orderNo) {
  return request({
    url: `/biz/order/detail/${orderNo}`,
    method: 'get',
  })
}

// 获取订单支付信息
export function getOrderPayments(orderNo) {
  return request({
    url: `/biz/order/payments/${orderNo}`,
    method: 'get',
  })
}
