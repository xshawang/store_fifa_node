/**
 * 全局配置常量
 * 集中管理所有硬编码的域名、URL、CDN等配置
 */

export const AppConfig = {
  // ==================== 域名配置 ====================
  // 美元转雷亚尔汇率
  USD_TO_BRL_RATE:5,
  // 主站域名
  MAIN_DOMAIN: 'store.fafbuy.store',
  MAIN_DOMAIN_HTTPS: 'https://store.fafbuy.store',
  
  // Shopify 相关域名
  SHOPIFY_CDN: 'https://cdn.shopify.com',
  SHOPIFY_APP: 'https://shop.app',
  SHOPIFY_SERVER_APP: 'https://server.shop.app',
  
  // ==================== URL 配置 ====================
  
  // 支付相关 URL
  CHECKOUT_PAY_BASE_URL: 'https://store.fafbuy.store/checkout/pay',
  CHECKOUT_WEB_URL: 'https://store.fafbuy.store/checkouts',
  
  // ==================== CDN 资源配置 ====================
  
  // Shopify CDN 资源路径模板
  SHOPIFY_CDN_FILES: 'https://cdn.shopify.com/s/files/1/0591/0478/8538',
  SHOPIFY_CDN_ASSETS: 'https://cdn.shopify.com/shop-assets/static_uploads/shoplift',
  SHOPIFY_CDN_CHECKOUT: 'https://store.fifa.com/cdn/shopifycloud/checkout-web/assets',
  
  // 字体资源
  FONTS: {
    GT_STANDARD_REGULAR: 'https://cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MRegular.woff2',
    GT_STANDARD_MEDIUM: 'https://cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MMedium.woff2',
    GT_STANDARD_SEMIBOLD: 'https://cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MSemibold.woff2',
  },
  
  // ==================== Cookie 配置 ====================
  
  // Shopify 用户标识 Cookie
  SHOPIFY_USER_COOKIE_KEY: '_shopify_y',
  
  // ==================== GraphQL ID 前缀 ====================
  
  // Shopify GraphQL ID 格式
  GRAPHQL_ID_PREFIX: {
    CHECKOUT: 'gid://shopify/Checkout/',
    LINE_ITEM: 'gid://shopify/LineItem/',
    PRODUCT_VARIANT: 'gid://shopify/ProductVariant/',
  },
  
  // ==================== SVG 命名空间 ====================
  
  // SVG XML 命名空间
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
  
  // ==================== 购物车页面资源 ====================
  
  // 购物车页面引用的 CSS/JS 资源
  CART_PAGE_RESOURCES: {
    CSS: [
      '//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/quantity-popover.css',
      '//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/component-card.css',
    ],
    JS: [
      '//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/cart.js',
      '//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/quantity-popover.js',
    ],
  },
  
  // ==================== 响应头配置 ====================
  
  // Preconnect 响应头配置
  PRECONNECT_LINKS: [
    '<https://cdn.shopify.com>; rel="preconnect"',
    '<https://cdn.shopify.com>; rel="preconnect"; crossorigin',
  ],
  
  // ==================== 辅助方法 ====================
  
  /**
   * 生成完整的支付 URL
   * @param orderNo 订单号
   * @returns 完整的支付 URL
   */
  getPayUrl(orderNo: string): string {
    return `${this.CHECKOUT_PAY_BASE_URL}?v=${orderNo}`;
  },
  
  /**
   * 生成完整的结账 URL
   * @param orderNo 订单号
   * @returns 完整的结账 URL
   */
  getCheckoutUrl(orderNo: string): string {
    return `${this.CHECKOUT_WEB_URL}/${orderNo}`;
  },
  
  /**
   * 生成 Shopify GraphQL ID
   * @param type ID 类型 (checkout, lineItem, productVariant)
   * @param id 实际 ID
   * @returns GraphQL ID
   */
  generateGraphqlId(type: 'checkout' | 'lineItem' | 'productVariant', id: string | number): string {
    const prefix = this.GRAPHQL_ID_PREFIX[
      type === 'checkout' ? 'CHECKOUT' : type === 'lineItem' ? 'LINE_ITEM' : 'PRODUCT_VARIANT'
    ];
    return `${prefix}${id}`;
  },
  
  /**
   * 构建 CDN 资源 URL
   * @param path 资源路径
   * @param version 版本号（可选）
   * @returns 完整的 CDN URL
   */
  buildCdnUrl(path: string, version?: string): string {
    const baseUrl = `${this.SHOPIFY_CDN_FILES}${path}`;
    return version ? `${baseUrl}?v=${version}` : baseUrl;
  },
};

/**
 * 配置类型定义
 */
export type AppConfigType = typeof AppConfig;
