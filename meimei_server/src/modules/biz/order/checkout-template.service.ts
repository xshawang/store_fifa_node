import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import { usdToBrl } from './../../../common/utils'


/**
 * Checkout HTML 模板服务
 * 负责读取 Checkout.html 模板并注入订单数据
 */
@Injectable()
export class CheckoutTemplateService implements OnModuleInit {
  private readonly logger = new Logger(CheckoutTemplateService.name)
  private templatePath: string
  private templateCache: string | null = null

  private templatePathBr :string
  private templateCacheBr : string|null = null
  async onModuleInit() {
    // 模板文件路径：项目根目录/scripts/Checkout.html
    this.templatePath = path.join(
      process.cwd(),
      'scripts',
      'payment_pt.html'
    )
    
    // 预加载模板到缓存
    try {
      this.templateCache = await fs.readFile(this.templatePath, 'utf-8')
      this.logger.log(`✅ Checkout 模板已加载并缓存: ${this.templatePath}`)
    } catch (error) {
      this.logger.error(`❌ 无法加载 Checkout 模板: ${error.message}`)
      throw error
    }

     this.templatePathBr = path.join(
      process.cwd(),
      'scripts',
      'payment_pt_br.html'
    )
    
    // 预加载模板到缓存
    try {
      this.templateCacheBr = await fs.readFile(this.templatePathBr, 'utf-8')
      this.logger.log(`✅ Checkout 模板已加载并缓存: ${this.templatePathBr}`)
    } catch (error) {
      this.logger.error(`❌ 无法加载 Checkout 模板: ${error.message}`)
      throw error
    }
  }

  /**
   * 生成包含订单数据的 Checkout HTML
   */
  async generateCheckoutHtml(orderData: {
    orderNo: string
    orderId: number
    totalAmount: number
    itemCount: number
    currency: string
    items: Array<{
      productName: string
      variantName: string
      quantity: number
      salePrice: number
      subtotalAmount: number
      productImage: string
      productUrl: string
    }>
  }): Promise<string> {
      let html = this.templateCache
    if(orderData.currency === 'BRL') {
      if (!this.templateCacheBr) {
        throw new Error('模板未加载,请检查模板文件是否存在')
      }
      let html = this.templateCacheBr
    }else {
      if (!this.templateCache) {
        throw new Error('模板未加载,请检查模板文件是否存在')
      }
    }
  

    this.logger.log(`✅ 准备生成 Checkout HTML,订单:`,JSON.stringify(orderData),`currency: ${orderData.currency}`)
    // 1. 替换支付 URL 配置(注入订单编号)
    html = this.replacePayUrlConfig(html, orderData.orderNo)
  
   
  
    // 3. 替换页面标题(包含订单编号后8位)
    html = this.replacePageTitle(html, orderData.orderNo)
  
    // 4. 替换购物车产品列表区域
    html = this.replaceProductRowGroup(html, orderData)
  
    // 5. 替换费用摘要区域
    html = this.replaceCostSummary(html, orderData)
  
    this.logger.log(`✅ 已生成 Checkout HTML,订单号: ${orderData.orderNo}`)
      
    return html
  }

  /**
   * 替换支付 URL 配置
   * 将原来的从 URL 参数读取改为直接使用订单编号
   */
  private replacePayUrlConfig(html: string, orderNo: string): string {
    const encodedOrderNo = encodeURIComponent(orderNo)
    
    // 原始配置代码块（需要替换的部分）
    const oldConfig = `// 从当前浏览器URL解析参数
    const currentUrl = new URL(window.location.href);
    const vParam = currentUrl.searchParams.get('v');
    
    // 设置全局支付基础地址
    window.CHECKOUT_PAY_BASE_URL = 'https://store.fif.com/checkout/pay';
    
    // 构建完整的支付URL（包含v参数）
    if (vParam) {
      window.CHECKOUT_PAY_URL = window.CHECKOUT_PAY_BASE_URL + '?v=' + encodeURIComponent(vParam);
    } else {
      window.CHECKOUT_PAY_URL = window.CHECKOUT_PAY_BASE_URL;
    }`

    // 新的配置代码（直接注入订单编号）
    const newConfig = `// 订单编号已由服务端注入
    window.CHECKOUT_ORDER_NO = '${orderNo}';
    window.CHECKOUT_PAY_BASE_URL = 'https://store.fif.com/checkout/pay';
    window.CHECKOUT_PAY_URL = window.CHECKOUT_PAY_BASE_URL + '?v=${encodedOrderNo}';
    
    console.log('[Checkout Config] Order No:', window.CHECKOUT_ORDER_NO);
    console.log('[Checkout Config] Pay URL:', window.CHECKOUT_PAY_URL);`

    if (html.includes(oldConfig)) {
      html = html.replace(oldConfig, newConfig)
      this.logger.debug('✅ 已替换支付 URL 配置')
    } else {
      this.logger.warn('⚠️ 未找到支付 URL 配置代码块，使用备用方案')
      // 备用方案：在 </head> 前注入
      const injectScript = `
<script>
  window.CHECKOUT_ORDER_NO = '${orderNo}';
  window.CHECKOUT_PAY_BASE_URL = 'https://store.fif.com/checkout/pay';
  window.CHECKOUT_PAY_URL = window.CHECKOUT_PAY_BASE_URL + '?v=${encodedOrderNo}';
  console.log('[Checkout Config] Order No (injected):', window.CHECKOUT_ORDER_NO);
</script>`
      html = html.replace('</head>', `${injectScript}\n</head>`)
    }

    return html
  }
 
  /**
   * 替换购物车产品列表区域(使用 rowgroup 结构)
   * 策略: 提取完整的 rowgroup 代码块作为模板，直接用字符串替换商品信息
   */
  private replaceProductRowGroup(html: string, orderData: any): string {
    try {
      // 标记常量
      const headerRowgroupClass = '_6zbcq56 _6zbcq55 _1fragem3c _1fragem4b _6zbcq51f _6zbcq51e _1fragemz3'
      const productRowgroupClass = '_6zbcq56 _6zbcq55 _1fragem3c _1fragem4b'
      
      // 1. 找到表头 rowgroup
      const headerMarker = `<div role="rowgroup" class="${headerRowgroupClass}">`
      const headerStart = html.indexOf(headerMarker)
      if (headerStart === -1) {
        this.logger.warn('⚠️ 未找到表头 rowgroup')
        return html
      }
      
      // 2. 找到第一个商品 rowgroup 的开始
      const productRowgroupMarker = `<div role="rowgroup" class="${productRowgroupClass}">`
      const firstProductStart = html.indexOf(productRowgroupMarker, headerStart)
      
      if (firstProductStart === -1) {
        this.logger.warn('⚠️ 未找到商品 rowgroup')
        return html
      }
      
      // 3. 提取完整的商品 rowgroup 代码块作为模板（从开始到 </section>）
      const sectionEnd = html.indexOf('</section>', firstProductStart)
      if (sectionEnd === -1) {
        this.logger.warn('⚠️ 未找到 </section> 标记')
        return html
      }
      
      // 提取表头 rowgroup（从表头开始到商品 rowgroup 之前）
      const headerContent = html.substring(headerStart, firstProductStart)
      
      // 提取第一个商品的完整 rowgroup（作为模板）
      const firstProductRowGroup = html.substring(firstProductStart, sectionEnd)
      
      this.logger.debug('✅ 成功提取商品 rowgroup 模板')
      this.logger.debug(`   模板长度: ${firstProductRowGroup.length}`)
      //this.logger.debug(`   模板内容: ${firstProductRowGroup}`)
      
      // 4. 从模板中提取关键信息（用于后续替换）
      // 提取产品名称、图片、价格等占位符位置，直接用字符串替换
      
      // 5. 为每个商品生成独立的 rowgroup（直接复制模板并替换）
      let allProductsHTML = ''
      
      orderData.items.forEach((item: any, index: number) => {
        const priceInDollars = (item.salePrice / 100).toFixed(2)
        const imgSrc = item.productUrl     || ''
        const productName = item.productName || ''
         
        let productHTML = `<div role="rowgroup" class="_6zbcq56 _6zbcq55 _1fragem3c _1fragem4b">
    <div role="row" class="_6zbcq51k _6zbcq51j _1fragem3c _1fragem2x _1fragemt6 _6zbcq51n _6zbcq512 _6zbcq51m">
        <div aria-hidden="true" class="_6zbcq520 _6zbcq51z _1fragem3c _1fragem4b" style="--_6zbcq54: 3.2rem;">
            <div class="_6zbcq523 _6zbcq522 _1fragemwr _1fragemwp _1fragemwt _1fragemwn _1fragemim _1fragemi2 _1fragemj6 _1fragemhi _1fragem46 _6zbcq525 _6zbcq524 _1fragem2x _1fragemsw">
            </div>
            <div  class="_6zbcq523 _6zbcq522 _1fragemwr _1fragemwp _1fragemwt _1fragemwn _1fragemim _1fragemi2 _1fragemj6 _1fragemhi _1fragem46 _6zbcq527 _6zbcq526 _1fragemt6">
            </div>
        </div>
        <div role="cell" class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51w _6zbcq51t _1fragem9g _6zbcq51q">
            <div class="_1m6j2n36 _1m6j2n35 _1fragemt6 _1m6j2n3a _1m6j2n38 _1fragem10c _1m6j2n3p _1m6j2n3h _1fragemuh _1m6j2n318 _1m6j2n3d"
                style="--_1m6j2n30: 1;">
                <img src="`+imgSrc+`" alt="`+productName+` &#39;`+item.variantName+`" loading="eager" class="_1m6j2n3t _1m6j2n3s _1fragemwb _1fragem2x _1fragem32 _1m6j2n3z _1m6j2n3x _1fragemgj _1fragemfz _1fragemh3 _1fragemff _1m6j2n3b _1fragemir _1fragemi7 _1fragemjb _1fragemhn _1fragemsh"><div class="_1m6j2n311 _1m6j2n310 _1fragemsw">
                    <div  class="_1m6j2n313 _1m6j2n312 _1fragemc8 _1fragemd2 _1fragemeq _1fragemdw _1fragemgj _1fragemfz _1fragemh3 _1fragemff _1fragempa _1fragemnh _1fragem3c _1fragemtw _1fragem8r _1fragemvv _1m6j2n314 _1m6j2n316 _1fragemir _1fragemi7 _1fragemjb _1fragemhn">
                        <span class="_1m6j2n31b _1fragemz3">Quantity</span>`+item.quantity+`</div> </div>
            </div>
        </div>`

        productHTML += ` <div role="cell"
            class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51x _6zbcq51u _1fragem8r _6zbcq51r _6zbcq51p _1fragemu2 _6zbcq529 _6zbcq528 _1fragemvj _16s97g741"
            style="--_16s97g73w: 6.4rem;">
            <div class="_1fragem32 _1fragemt6 dDm6x">
                <p class="_1tx8jg70 _1fragemt6 _1tx8jg7i _1tx8jg7b _1fragemvq _1tx8jg719 _1tx8jg71h _1tx8jg71j">`+productName+`</p>
                <div class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem3c _1fragem4b _1fragem4q">
                    <p class="_1tx8jg70 _1fragemt6 _1tx8jg7h _1tx8jg7a _1fragemvp _1tx8jg719 _1tx8jg71i _1tx8jg71j">`+item.variantName+`</p>
                </div>
            </div>
        </div>`
        productHTML += `<div role="cell"
            class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51x _6zbcq51u _1fragem8r _6zbcq51q _6zbcq52a">
            <div class="_6zbcq52e _1fragemz3">
                <span class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h">`+item.quantity+`</span>
            </div>
        </div>`
        //介格转换
        if(orderData.currency == 'BRL') {
          productHTML +=`<div role="cell"
            class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51x _6zbcq51u _1fragem8r _6zbcq51r _6zbcq51p _1fragemu2">
            <div class="_17kya4u1q _1fragem4b _1fragemty _1fragem3c _1fragemt6 Byb5s">
                <span translate="no"
                    class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h notranslate">R$`+ usdToBrl(Number(priceInDollars)).brl+` (BRL)</span>
            </div>
        </div>`
        }else{
        productHTML +=`<div role="cell"
            class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51x _6zbcq51u _1fragem8r _6zbcq51r _6zbcq51p _1fragemu2">
            <div class="_17kya4u1q _1fragem4b _1fragemty _1fragem3c _1fragemt6 Byb5s">
                <span translate="no"
                    class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h notranslate">$`+priceInDollars+`</span>
            </div>
        </div>`
        }
        productHTML += ` </div></div>`
        // 累加所有商品
        allProductsHTML += productHTML
      })
      
      
      // 6. 替换：保留表头，替换所有商品 rowgroups
      const replacementHTML = headerContent + allProductsHTML
      const originalSection = html.substring(headerStart, sectionEnd)
      
      html = html.replace(originalSection, replacementHTML)
      
      this.logger.log(`✅ 已替换产品列表区域,共 ${orderData.items.length} 个商品`)
      
    } catch (error) {
      this.logger.error(`❌ 替换产品列表区域失败: ${error.message}`)
      this.logger.error(`   堆栈: ${error.stack}`)
    }

    return html
  }

  /**
   * 替换费用摘要区域
   */
  private replaceCostSummary(html: string, orderData: any): string {
    try {
      const totalInDollars = (orderData.totalAmount / 100).toFixed(2)
      const FLAG_BRL = orderData.currency == 'BRL'?true:false
      //直接用字符串截取替换第二个
      const substr= `_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h notranslate`
      let indexSubstr = html.lastIndexOf(substr);
      const beforeSubstr = html.substring(0, indexSubstr+substr.length+2);
      const afterSubstr = html.substring(indexSubstr+substr.length+2);
      let secondSubstr = afterSubstr.substring(afterSubstr.indexOf('<'));

      if(FLAG_BRL){
           html = beforeSubstr + 'R$'+usdToBrl(Number(totalInDollars)).brl+` (BRL)` + secondSubstr
      }else{
           html = beforeSubstr + '$'+totalInDollars + ' ' + secondSubstr
      }
     
      //替换第二个
      // let indexSubStr2 = secondSubstr.indexOf(substr);
      // let beforeSubstr2 = secondSubstr.substring(0, indexSubStr2+substr.length+2);
      // let afterSubstr2 = secondSubstr.substring(indexSubStr2+substr.length+2);
      // let secondSubstr2 = afterSubstr2.substring(afterSubstr2.indexOf('<'));
      // html  = beforeSubstr + '$'+totalInDollars + ' ' + beforeSubstr2+'$'+totalInDollars + ' ' + secondSubstr2
       this.logger.debug('✅ 已替换 Subtotal 金额', { totalInDollars })

      const mobileSubStr = `_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h`;
      let indexMobileSubStr = html.indexOf(mobileSubStr);
      const beforeMobileSubStr = html.substring(0, indexMobileSubStr+mobileSubStr.length+2);
      const afterMobileSubStr = html.substring(indexMobileSubStr+mobileSubStr.length+2);
      let secondMobileSubStr = afterMobileSubStr.substring(afterMobileSubStr.indexOf('<'));
      if(FLAG_BRL){
         html = beforeMobileSubStr + 'R$'+usdToBrl(Number(totalInDollars)).brl+` (BRL)` + secondMobileSubStr
      }else{
         html = beforeMobileSubStr + '$'+totalInDollars + ' ' + secondMobileSubStr
      }
     
      const totalRegex = /(<span translate="no" class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1h _19gi7yt1n _1fragem3h notranslate">)(USD)(<\/span>)/
      if (totalRegex.test(html)) {
        html = html.replace(totalRegex, `$1${orderData.currency}$3`)
        this.logger.debug('✅ 已替换 货币', { currency: orderData.currency })
      } else {
        this.logger.warn('⚠️ 未找到 货币区域')
      }

      const substrt = `_19gi7yt0 _19gi7ytq _19gi7ytj _1fragemvs _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h notranslate`
      let indexSubstrt = html.indexOf(substrt);
      let beforeSubstrt = html.substring(0, indexSubstrt+substrt.length+2);
      let afterSubstrt = html.substring(indexSubstrt+substrt.length+2);
      let secondSubstrt = afterSubstrt.substring( afterSubstrt.indexOf('<'));

       if(FLAG_BRL){
         html  = beforeSubstrt + 'R$'+usdToBrl(Number(totalInDollars)).brl +  secondSubstrt
       }else{
         html  = beforeSubstrt + '$'+totalInDollars + ' ' + secondSubstrt
       }
      // const totalRegexMoney = /(<strong translate="no" class="_19gi7yt0 _19gi7ytq _19gi7ytj _1fragemvs _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h notranslate">)(\$[\d.]+)(<\/strong>)/
      // if (totalRegexMoney.test(html)) {
      //   html = html.replace(totalRegexMoney, `$1$${totalInDollars}$3`)
      //   this.logger.debug('✅ 已替换 Total', { totalInDollars })
      // } else {
      //   this.logger.warn('⚠️ 未找到 Total 区域')
      // }
      //直接替换
      const replaceStr = "checkout/pay";
      if(FLAG_BRL){
        html = html.replaceAll(replaceStr, "/checkout/payment?v=" + orderData.orderNo);
      } else{
        html = html.replaceAll(replaceStr, "checkout/pay?v=" + orderData.orderNo);
      }
    } catch (error) {
      this.logger.error(`❌ 替换费用摘要失败: ${error.message}`)
    }

    return html
  }

  /**
   * 替换页面标题
   */
  private replacePageTitle(html: string, orderNo: string): string {
    const shortOrderNo = orderNo.slice(-8) // 取后8位
    
    const newTitle = `<title>Checkout - Order ${shortOrderNo} - FIFA Official Store</title>`
    
    if (html.includes('<title>Checkout - FIFA Official Store</title>')) {
      html = html.replace(
        '<title>Checkout - FIFA Official Store</title>',
        newTitle
      )
      this.logger.debug(`✅ 已替换页面标题: ${newTitle}`)
    }

    return html
  }

  /**
   * 清除模板缓存（用于开发环境热更新）
   */
  async clearCache(): Promise<void> {
    this.templateCache = null
    this.logger.log('🗑️ 模板缓存已清除')
    
    // 重新加载
    this.templateCache = await fs.readFile(this.templatePath, 'utf-8')
    this.logger.log('✅ 模板已重新加载')
  }
}
