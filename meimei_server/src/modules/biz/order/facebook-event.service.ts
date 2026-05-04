import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as crypto from 'crypto'

@Injectable()
export class FacebookEventService {
  private readonly logger = new Logger(FacebookEventService.name)
  
  // 不同环境的 Facebook 配置
  private readonly FACEBOOK_CONFIGS = {
    'store.fafbuy.store': {
      PIXEL_ID: '1499659318285286',
      ACCESS_TOKEN: 'EAAXYvJye51EBRaZBrnMGmcaE5iHvaZCs0KVvr4ahZAsZBaOztkQiKCCrOxTCOtG2Qzx9M7ZA0OzxZBsdsrrefOCPn7tjsl7siFQOVupyWCv1oZBLgeZAa2lWKkdT1WtWbHZBPHMCtYmMWCxf33bGAZBPIjyP0npk2Cf24bfyqdW3gWKyf21ZBHNZC4KOjqCjemf9SQZDZD',
      TEST_CODE: 'TEST91962',
    },
     'flfa.store': {
      PIXEL_ID: '818970384169351',
      ACCESS_TOKEN:'EAAXYvJye51EBRaZBrnMGmcaE5iHvaZCs0KVvr4ahZAsZBaOztkQiKCCrOxTCOtG2Qzx9M7ZA0OzxZBsdsrrefOCPn7tjsl7siFQOVupyWCv1oZBLgeZAa2lWKkdT1WtWbHZBPHMCtYmMWCxf33bGAZBPIjyP0npk2Cf24bfyqdW3gWKyf21ZBHNZC4KOjqCjemf9SQZDZD',
      TEST_CODE: 'TEST44758',
    },
    'default': {
      PIXEL_ID: '818970384169351',
      ACCESS_TOKEN:'EAAXYvJye51EBRaZBrnMGmcaE5iHvaZCs0KVvr4ahZAsZBaOztkQiKCCrOxTCOtG2Qzx9M7ZA0OzxZBsdsrrefOCPn7tjsl7siFQOVupyWCv1oZBLgeZAa2lWKkdT1WtWbHZBPHMCtYmMWCxf33bGAZBPIjyP0npk2Cf24bfyqdW3gWKyf21ZBHNZC4KOjqCjemf9SQZDZD',
      TEST_CODE: 'TEST44758',
    },
  }
  


  /**
   * 发送 Purchase 事件到 Facebook
   * @param orderData 订单数据
   * @param ipAddress 用户 IP 地址
   * @param userAgent 用户代理
   */
  async sendPurchaseEvent(
    orderData: {
      orderNo: string
      totalAmount: number
      currency: string
      items: Array<{
        productName: string
        quantity: number
        salePrice: number
      }>
    },
    ipAddress: string,
    userAgent: string,
    host: string,
  ): Promise<void> {
    try {
      // 异步执行，不阻塞主流程
      this.pushEventToFacebook(orderData, ipAddress, userAgent,host).catch((error) => {
        this.logger.error('发送 Facebook 事件失败:', error)
      })
    } catch (error) {
      this.logger.error('准备发送 Facebook 事件时出错:', error)
    }
  }

  /**
   * 实际推送事件到 Facebook 的方法
   */
  private async pushEventToFacebook(
    orderData: {
      orderNo: string
      totalAmount: number
      currency: string
      items: Array<{
        productName: string
        quantity: number
        salePrice: number
      }>
    },
    ipAddress: string,
    userAgent: string,
    host:string
  ): Promise<void> {
    // 根据 host 获取对应的 Facebook 配置
    const requestHost = host || 'default'
    const config = this.FACEBOOK_CONFIGS[host] || this.FACEBOOK_CONFIGS['store.fafbuy.store']
   // this.logger.log(requestHost ,' 发送 Facebook 事件 - 配置:', JSON.stringify(config))
    const url = `https://graph.facebook.com/v19.0/${config.PIXEL_ID}/events?access_token=${config.ACCESS_TOKEN}`

    // 将金额从分转换为元（如果是以分为单位）
    const valueInDollars = orderData.totalAmount

    //this.logger.log(requestHost,'发送 Facebook 事件 配置',JSON.stringify(config),' \n订单数据',orderData.orderNo,' \n用户IP',ipAddress,' \n用户代理',userAgent)
    const eventData = {
      data: [
        {
          event_name: 'Purchase',
          // 使用当前 UTC 时间戳（秒）
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: host+`/checkout?v=${orderData.orderNo}`,
          user_data: {
            client_ip_address: ipAddress || '',
            client_user_agent: userAgent || '',
          },
          custom_data: {
            currency:  'USD',
            value: Number(valueInDollars.toFixed(2)),
            content_ids: orderData.items.map((item) => item.productName),
            content_type: 'product',
            num_items: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
          }
        },
      ]
    }
    this.logger.log(requestHost, url, '发送 Facebook 事件 - 事件数据:', JSON.stringify(eventData))
    try {
      const response = await axios.post(url, eventData)
      this.logger.log(
        `Facebook 事件发送成功 - 订单号: ${orderData.orderNo}, 响应:`,
        response.data,
      )
    } catch (error: any) {
      this.logger.error(
        `发送 Facebook 事件失败 - 订单号: ${orderData.orderNo}`,
        error.response?.data || error.message,
      )
    }
  }

  /**
   * SHA256 哈希函数（用于用户数据加密）
   */
  private hashData(data: string): string {
    if (!data) return ''
    return crypto
      .createHash('sha256')
      .update(data.trim().toLowerCase())
      .digest('hex')
  }
}
