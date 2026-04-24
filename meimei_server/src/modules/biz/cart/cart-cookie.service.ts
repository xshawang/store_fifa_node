import { Injectable } from '@nestjs/common'

@Injectable()
export class CookieService {
  /**
   * 从 cookie 字符串中解析指定的 cookie 值
   */
  parseCookie(cookieString: string, cookieName: string): string | null {
    if (!cookieString) {
      return null
    }

    const cookies = cookieString.split(';')
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=')
      if (name.trim() === cookieName) {
        return valueParts.join('=').trim()
      }
    }
    return null
  }

  /**
   * 从 _shopify_essential cookie 中提取用户标识
   * 该 cookie 格式为: :<encoded_value>:
   */
  extractUserIdFromShopifyEssential(shopifyEssential: string): string {
    if (!shopifyEssential) {
      return null
    }

    // _shopify_essential 格式通常是 :value: 或类似结构
    // 我们提取中间的主要部分作为用户标识
    const match = shopifyEssential.match(/^:(.+):$/)
    if (match && match[1]) {
      // 取前 100 个字符作为 userId 标识
      return match[1].substring(0, 200)
    }

    // 如果不是预期格式，返回整个值的 hash 或截取
    return shopifyEssential.substring(0, 200)
  }

 
  /**
   * 从完整的 cookie 字符串中提取用户 ID
   */
  extractKeyFromCookie(cookieString: string, key: string): string | null {
    return decodeURIComponent(this.parseCookie(cookieString, key))
  }
//   extractUserIdFromCookie(cookieString: string): string | null {
//     const shopifyEssential = this.parseCookie(cookieString, '_shopify_essential')
//     if (shopifyEssential) {
//       return this.extractUserIdFromShopifyEssential(shopifyEssential)
//     }

//     // 如果没有 _shopify_essential，尝试使用 _shopify_s
//     const shopifyS = this.parseCookie(cookieString, '_shopify_s')
//     if (shopifyS) {
//       return shopifyS.substring(0, 200)
//     }

//     // 如果都没有，尝试使用 _shopify_analytics
//     const shopifyAnalytics = this.parseCookie(cookieString, '_shopify_analytics')
//     if (shopifyAnalytics) {
//       return this.extractUserIdFromShopifyEssential(shopifyAnalytics)
//     }

//     return null
//   }
// }
