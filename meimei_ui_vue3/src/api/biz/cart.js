import request from '@/utils/request'

// 获取购物车信息（Shopify 格式）
export function getCartInfo() {
  return request({
    url: '/cart.js',
    method: 'get',
  })
}

// 添加商品到购物车
export function addToCart(data) {
  return request({
    url: '/cart/add',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

// 查询购物车列表
export function listCart(query) {
  return request({
    url: '/api/cart/list',
    method: 'get',
    params: query,
  })
}

// 更新购物车数量
export function updateCart(data) {
  return request({
    url: '/cart',
    method: 'put',
    data: data,
  })
}

// 删除购物车项
export function delCart(cartIds) {
  return request({
    url: '/cart/' + cartIds,
    method: 'delete',
  })
}

// 清空购物车
export function clearCart() {
  return request({
    url: '/cart/clear',
    method: 'post',
  })
}
