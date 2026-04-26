import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Checkout HTML 模板服务
 * 负责读取 Checkout.html 模板并注入订单数据
 */
@Injectable()
export class CheckoutTemplateService implements OnModuleInit {
  private readonly logger = new Logger(CheckoutTemplateService.name)
  private templatePath: string
  private templateCache: string | null = null

  async onModuleInit() {
    // 模板文件路径：项目根目录/scripts/Checkout.html
    this.templatePath = path.join(
      process.cwd(),
      'scripts',
      'Checkout.html'
    )
    
    // 预加载模板到缓存
    try {
      this.templateCache = await fs.readFile(this.templatePath, 'utf-8')
      this.logger.log(`✅ Checkout 模板已加载并缓存: ${this.templatePath}`)
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
    items: Array<{
      productName: string
      variantName: string
      quantity: number
      salePrice: number
      subtotalAmount: number
      productImage: string
      productUrl: string
    }>
    totalAmount: number
    itemCount: number
    currency: string
  }): Promise<string> {
    if (!this.templateCache) {
      throw new Error('模板未加载,请检查模板文件是否存在')
    }
  
    let html = this.templateCache
    this.logger.log(`✅ 准备生成 Checkout HTML,订单:`,JSON.stringify(orderData))
    // 1. 替换支付 URL 配置(注入订单编号)
    html = this.replacePayUrlConfig(html, orderData.orderNo)
  
    // 2. 注入订单数据到 <meta name="serialized-graphql"> 标签
   // html = this.injectSerializedGraphql(html, orderData)
  
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
   * 注入订单数据到 <meta name="serialized-graphql"> 标签
   * 将订单数据转换为 Shopify GraphQL 格式并存储在 meta 标签中
   */
  private injectSerializedGraphql(html: string, orderData: any): string {
    // 构建 Shopify GraphQL 格式的订单数据
    const graphqlData = {
      data: {
        checkout: {
          id: `gid://shopify/Checkout/${orderData.orderNo}`,
          orderNo: orderData.orderNo,
          orderId: orderData.orderId,
          currencyCode: orderData.currency,
          lineItems: {
            edges: orderData.items.map((item: any, index: number) => ({
              node: {
                id: `gid://shopify/LineItem/${orderData.orderId}_${index}`,
                quantity: item.quantity,
                title: item.productName,
                variant: {
                  id: `gid://shopify/ProductVariant/${item.variantName}`,
                  title: item.variantName,
                  price: {
                    amount: (item.salePrice / 100).toFixed(2),
                    currencyCode: orderData.currency
                  },
                  image: {
                    url: item.productImage || '',
                    width: 1500,
                    height: 1500,
                    altText: item.productName
                  }
                },
                discountAllocations: [],
                lineLevelTotalDiscount: {
                  amount: "0.00",
                  currencyCode: orderData.currency
                },
                originalTotalPrice: {
                  amount: (item.subtotalAmount / 100).toFixed(2),
                  currencyCode: orderData.currency
                },
                discountedTotalPrice: {
                  amount: (item.subtotalAmount / 100).toFixed(2),
                  currencyCode: orderData.currency
                },
                // 保留其他可能需要的属性，使用默认值
                requiresShipping: true,
                taxable: true,
                giftCard: false
              }
            }))
          },
          paymentDue: {
            amount: (orderData.totalAmount / 100).toFixed(2),
            currencyCode: orderData.currency
          },
          subtotalPrice: {
            amount: (orderData.totalAmount / 100).toFixed(2),
            currencyCode: orderData.currency
          },
          totalTax: {
            amount: "0.00",
            currencyCode: orderData.currency
          },
          totalPrice: {
            amount: (orderData.totalAmount / 100).toFixed(2),
            currencyCode: orderData.currency
          },
          shippingLine: {
            title: "Standard Shipping",
            price: {
              amount: "0.00",
              currencyCode: orderData.currency
            }
          },
          // 保留其他 checkout 属性，使用默认值
          email: null,
          phone: null,
          webUrl: `https://store.fif.com/checkouts/${orderData.orderNo}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    }

    // 序列化并 HTML 编码
    const serializedData = JSON.stringify(graphqlData)
    
    // 构建 meta 标签
    const metaTag = `<meta name="serialized-graphql" content='${serializedData}'>`

    // 查找是否已存在 serialized-graphql 标签
    if (html.includes('name="serialized-graphql"')) {
      // 替换已存在的标签（保持原有结构，只更新 content）
      const metaRegex = /<meta[^>]*name="serialized-graphql"[^>]*content='[^']*'[^>]*\s*\/?>/i
      if (metaRegex.test(html)) {
        html = html.replace(metaRegex, metaTag)
        this.logger.debug('✅ 已替换现有的 serialized-graphql meta 标签')
      } else {
        // 如果格式不匹配，在 </head> 前插入新标签
        html = html.replace('</head>', `${metaTag}\n</head>`)
        this.logger.debug('✅ 已插入新的 serialized-graphql meta 标签')
      }
    } else {
      // 在 </head> 之前插入新标签
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${metaTag}\n</head>`)
        this.logger.debug('✅ 已插入 serialized-graphql meta 标签')
      } else {
        this.logger.error('❌ 未找到 </head> 标签，无法插入 meta 标签')
      }
    }

    // 注入 JavaScript 来动态替换产品展示区域
    const replaceProductScript = `
<script>
  // 等待页面加载完成后替换产品信息
  (function() {
    function replaceProductDisplay() {
      try {
        // 从 meta 标签读取订单数据
        const metaTag = document.querySelector('meta[name="serialized-graphql"]');
        if (!metaTag) {
          console.warn('[Product Replace] serialized-graphql meta tag not found');
          return;
        }
        
        const checkoutData = JSON.parse(metaTag.content);
        const lineItems = checkoutData.data.checkout.lineItems.edges;
        
        console.log('[Product Replace] Found', lineItems.length, 'items to display');
        
        // 查找所有产品展示区域（role="table" 或订单摘要区域）
        const orderSummarySelectors = [
          '[role="table"]',
          '[data-testid="order-summary"]',
          '.OrderSummary',
          '[data-testid="line-items"]',
          '.line-items'
        ];
        
        let targetContainer = null;
        for (const selector of orderSummarySelectors) {
          targetContainer = document.querySelector(selector);
          if (targetContainer) {
            console.log('[Product Replace] Found target container:', selector);
            break;
          }
        }
        
        if (!targetContainer) {
          console.warn('[Product Replace] No product display container found');
          return;
        }
        
        // 清空现有内容并插入新的产品展示
        let productsHTML = '';
        lineItems.forEach((edge, index) => {
          const item = edge.node;
          const price = item.variant.price.amount;
          const total = (parseFloat(price) * item.quantity).toFixed(2);
          
          productsHTML += \`
            <div class="custom-line-item" data-item-index="\${index}" style="
              display: flex;
              gap: 12px;
              padding: 12px 0;
              border-bottom: 1px solid #e1e1e1;
            ">
              <div class="item-image" style="flex-shrink: 0;">
                \${item.variant.image && item.variant.image.url ?
                  \`<img src="\${item.variant.image.url}" 
                        alt="\${item.title}" 
                        style="width: 64px; height: 64px; object-fit: cover; border-radius: 6px;" />\` :
                  '<div style="width: 64px; height: 64px; background: #f5f5f5; border-radius: 6px;"></div>'
                }
              </div>
              <div class="item-details" style="flex: 1; min-width: 0;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #333; line-height: 1.4;">
                  \${item.title}
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;">
                  Size: \${item.variant.title}
                </p>
                <p style="margin: 0; font-size: 13px; color: #666;">
                  Quantity: \${item.quantity}
                </p>
              </div>
              <div class="item-price" style="text-align: right; flex-shrink: 0;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000;">
                  $\${price} \${checkoutData.data.checkout.currencyCode}
                </p>
                \${item.quantity > 1 ? \`
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                    Total: $\${total}
                  </p>
                \` : ''}
              </div>
            </div>
          \`;
        });
        
        // 替换内容
        targetContainer.innerHTML = productsHTML;
        console.log('[Product Replace] Successfully replaced product display');
        
      } catch (error) {
        console.error('[Product Replace] Error:', error);
      }
    }
    
    // 尝试多次执行，等待 DOM 加载完成
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      const orderSummary = document.querySelector('[role="table"], [data-testid="order-summary"], .OrderSummary');
      if (orderSummary || attempts >= maxAttempts) {
        clearInterval(interval);
        replaceProductDisplay();
      }
    }, 250);
    
    // 也在 DOMContentLoaded 时执行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(replaceProductDisplay, 500);
      });
    } else {
      setTimeout(replaceProductDisplay, 500);
    }
  })();
</script>`

    // 在 </body> 之前注入替换脚本(保留作为备用方案)
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${replaceProductScript}\n</body>`)
      this.logger.debug('✅ 已注入产品替换脚本(备用)')
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
        productHTML +=`<div role="cell"
            class="_6zbcq52d _6zbcq52c _1fragem3c _1fragem4b _6zbcq51x _6zbcq51u _1fragem8r _6zbcq51r _6zbcq51p _1fragemu2">
            <div class="_17kya4u1q _1fragem4b _1fragemty _1fragem3c _1fragemt6 Byb5s">
                <span translate="no"
                    class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h notranslate">$`+priceInDollars+`</span>
            </div>
        </div>`
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
      
      // 查找并替换 Subtotal 金额 (第1230-1231行)
      // <span class="...">Subtotal</span></div><div role="cell" class="_1qy6ue68">
      //   <span translate="no" class="... notranslate">$180.00</span></div></div>
      const subtotalRegex = /(<span class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h">Subtotal<\/span><\/div><div role="cell" class="_1qy6ue68">\s*<span translate="no" class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h notranslate">)(\$[\d.]+)(<\/span><\/div><\/div>)/
      
      if (subtotalRegex.test(html)) {
        html = html.replace(subtotalRegex, `$1$${totalInDollars}$3`)
        this.logger.debug('✅ 已替换 Subtotal 金额')
      } else {
        this.logger.warn('⚠️ 未找到 Subtotal 金额区域')
      }
      
      // 查找并替换 Total 金额 (第1244-1247行)
      // <abbr class="_1qifbzv1 _1qifbzv0 _1fragemz9">
      //   <span translate="no" class="_19gi7ytn _19gi7ytg _1fragemvp ... notranslate">USD</span></abbr>
      //   <strong translate="no" class="... notranslate">$180.00</strong>
      const totalRegex = /(<span translate="no" class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1h _19gi7yt1n _1fragem3h notranslate">)(USD)(<\/span>)/
      if (totalRegex.test(html)) {
        html = html.replace(totalRegex, `$1${orderData.currency}`)
        this.logger.debug('✅ 已替换 货币')
      } else {
        this.logger.warn('⚠️ 未找到 货币区域')
      }
      const totalRegexMoney = /(<strong translate="no" class="_19gi7yt0 _19gi7ytq _19gi7ytj _1fragemvs _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h notranslate">)(\$[\d.]+)(<\/strong>)/
      if (totalRegexMoney.test(html)) {
        html = html.replace(totalRegexMoney, `$1$${totalInDollars}`)
        this.logger.debug('✅ 已替换 Total')
      } else {
        this.logger.warn('⚠️ 未找到 Total 区域')
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
