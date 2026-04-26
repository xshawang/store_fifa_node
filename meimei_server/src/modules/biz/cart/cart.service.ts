import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Cart } from './entities/cart.entity'
import { CreateCartDto, UpdateCartDto, QueryCartDto, ChangeCartDto } from './dto/req-cart.dto'
import { PaginatedDto } from 'src/common/dto/paginated.dto'
import { ApiException } from 'src/common/exceptions/api.exception'
import { CookieService } from './cart-cookie.service'
import { ProductService } from '../product/product.service'
import { ProductSkuService } from '../product/product-sku.service'
const crypto = require('crypto');
function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly cookieService: CookieService,
    private readonly productService: ProductService,
    private readonly productSkuService: ProductSkuService,
  ) {}

  /**
   * 添加商品到购物车
   */
  async addToCart(createCartDto: CreateCartDto, cookieHeader: string): Promise<any> {
    // 从 cookie 中提取用户标识和 token
    let userId = this.cookieService.extractKeyFromCookie(cookieHeader, "_shopify_y");
    let token = this.cookieService.extractKeyFromCookie(cookieHeader, "cart");
    console.log('add to cart userId:', userId, 'token:', token)
    
    // 如果 userId 不存在或为空字符串，生成新的
    if (!userId || userId.trim() === '') {
      userId = crypto.randomUUID();
    }
    
    // 如果 token 不存在或为空字符串，生成 Shopify 格式的 cart token
    let isNewToken = false;
    if (!token || token.trim() === '') {
      // 生成格式：hWNBQiNi7ELco5gFETwXyMxs?key=23aedfc66aa9cc5f5af1d990f2fd2d52
      const tokenPart = crypto.randomBytes(16).toString('base64url').substring(0, 24);
      const keyPart = crypto.randomBytes(16).toString('hex');
      token = `${tokenPart}?key=${keyPart}`;
      isNewToken = true;
      console.log('✅ 生成新的 cart token:', token);
    }

    // createCartDto.id 即为 sku_id
    const skuId = createCartDto.id
    
    // 从 biz_product_sku 表中查询 SKU 信息
    let productSku = await this.productSkuService.findOne(skuId)
    
    // 如果 SKU 不存在，创建一条新记录
    if (!productSku) {
      console.log('SKU 不存在，创建新记录',skuId)
      // 尝试从产品表获取产品信息
      const product = await this.productService.findOne(createCartDto.productId)
      
      productSku = await this.productSkuService.createOrUpdate(
        skuId,
        createCartDto.productId,
        skuId, // variantId 默认使用 skuId
        product?.sku || '', // sku 编码
        createCartDto.size1 // size
      )
    } else {
      console.log('SKU 存在，检查 size 是否有值，如果没有且传入了 size1，则更新',createCartDto.size1)
      // 如果 SKU 存在，检查 size 是否有值，如果没有且传入了 size1，则更新
      if (!productSku.size && createCartDto.size1) {
        productSku =   await this.productSkuService.createOrUpdate(
          skuId,
          productSku.productId,
          productSku.variantId,
          productSku.sku,
          createCartDto.size1
        )
      }
    }

    // 查询产品信息（用于填充购物车中的产品信息）
    let productName: string | null = null
    let price: number | null = null
    let productUrl: string | null = null
    let imageUrl : string |null = null
    
    const product = await this.productService.findOne(createCartDto.productId)
    if (product) {
      productName = product.productName
      price = product.price
      productUrl = product.productUrl   
      imageUrl = product.imageUrl
    }

    // 检查购物车中是否已存在相同的产品和尺码组合
    const existingCart = await this.cartRepository.findOne({
      where: {
        token: token,
        userId:userId,
        productId: createCartDto.productId,
        skuId: createCartDto.id,
        size: createCartDto.size1,
        status: 1,
      },
    })

    if (existingCart) {
      // 如果已存在，增加数量
      existingCart.quantity += createCartDto.quantity || 1
      existingCart.sectionId = createCartDto.sectionId || existingCart.sectionId
      existingCart.sections = createCartDto.sections || existingCart.sections
      existingCart.sectionsUrl = createCartDto.sectionsUrl || existingCart.sectionsUrl
      existingCart.updateBy = userId
      await this.cartRepository.save(existingCart)
    }else{

      // 创建新的购物车项
      const cart = this.cartRepository.create({
        token,
        userId,
        productId: createCartDto.productId,
        skuId: createCartDto.id,
        variantId: String(createCartDto.id),
        size: createCartDto.size1,
        formType: createCartDto.formType || 'product',
        quantity: createCartDto.quantity || 1,
        sectionId: createCartDto.sectionId,
        sections: createCartDto.sections,
        sectionsUrl: createCartDto.sectionsUrl,
        productName,
        price,
        productUrl: imageUrl || '',
        status: 1,
        createBy: userId,
        updateBy: userId,
      })

      console.log('💾 准备保存 cart 记录:', {
        token: cart.token,
        userId: cart.userId,
        productId: cart.productId,
        skuId: cart.skuId,
        size: cart.size,
        quantity: cart.quantity
      });

      const savedCart = await this.cartRepository.save(cart);
      
      console.log('✅ Cart 记录已保存:', {
        cartId: savedCart.cartId,
        token: savedCart.token,
        userId: savedCart.userId
      });
  }
     
     // 确保 product 存在
     if (!product) {
       throw new ApiException('产品不存在')
     }
     
     const productPrice = product.price*100;
     
     // 生成购物车 sections HTML
     const cartDrawerHtml = await this.getCartHTML(cookieHeader);
     const cartIconHtml = await this.getCartIconHTML(cookieHeader);
     
     //拼接返回信息 - Shopify 格式
    const result = {
      id: createCartDto.productId,
      token: token,
      key: `${createCartDto.id}:${md5(product.productUrl || '').toString()}`,
      sections: {
        "cart-drawer": cartDrawerHtml,
        "cart-icon-bubble": cartIconHtml
      },
      sections_url: createCartDto.sectionsUrl,
      // 保留原有字段用于兼容
      discounted_price: productPrice,
      discounts: [],
      featured_image: {
        alt: product.productName,
        height: 1500,
        aspect_ratio: 1,
        url: product.productUrl,
        width: 1500
      },
      final_line_price: productPrice,
      final_price: productPrice,
      gift_card: createCartDto.formType == 'product' ? true : false,
      grams: 5000,
      handle: createCartDto.sectionsUrl ? createCartDto.sectionsUrl.substring(createCartDto.sectionsUrl.lastIndexOf('/') + 1) : '',
      line_level_discounts: [],
      line_price: productPrice,
      line_level_total_discount: 0,
      options_with_values: [{ name: 'Size', value: createCartDto.size1 }],
      original_line_price: productPrice,
      original_price: productPrice,
      presentment_price: product.price,
      price: productPrice,
      product_description: product.description,
      product_has_only_default_variant: false,
      product_id: product.productId,
      product_title: product.productName,
      product_type: product.productType,
      properties: {},
      quantity: createCartDto.quantity,
      requires_shipping: true,
      sku: product.sku || '',
      taxable: true,
      title: product.productName + ' ' + createCartDto.size1,
      total_discount: 0,
      untranslated_product_title: product.productName,
      untranslated_variant_title: createCartDto.size1,
      url: createCartDto.sectionsUrl ? createCartDto.sectionsUrl + '?variant=' + createCartDto.id : '',
      variant_id: createCartDto.id,
      variant_title: createCartDto.size1,
      variant_options: [createCartDto.size1],
      vendor: product.brand||''
    }
    
    // 如果是新生成的 token，添加到返回结果中
    if (isNewToken) {
      result['_isNewToken'] = true;
    }
    
    return result;
  }

  /**
   * 修改购物车商品数量
   */
  async changeCart(changeCartDto: ChangeCartDto, cookieHeader: string): Promise<any> {
    // 从 cookie 中提取用户标识和 token
    let userId = this.cookieService.extractKeyFromCookie(cookieHeader, "_shopify_y");
    let token = this.cookieService.extractKeyFromCookie(cookieHeader, "cart");
    console.log('change cart userId:', userId, 'token:', token)
    
    if (!userId || !token) {
      throw new ApiException('无法识别用户信息')
    }

    // 获取用户的购物车记录，按照 id 从小到大排序
    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })

    // line 参数对应下标+1（从1开始）
    const lineIndex = Number(changeCartDto.line)
    const arrayIndex = lineIndex - 1

    // 检查索引是否有效
    if (arrayIndex < 0 || arrayIndex >= cartItems.length) {
      throw new ApiException('购物车项不存在')
    }

    const targetItem = cartItems[arrayIndex]
    const newQuantity = changeCartDto.quantity

    // 如果数量为0，删除该记录（软删除）
    if (newQuantity === 0) {
      targetItem.status = 0
      targetItem.updateBy = userId
      await this.cartRepository.save(targetItem)
    } else {
      // 更新数量
      targetItem.quantity = newQuantity
      targetItem.updateBy = userId
      await this.cartRepository.save(targetItem)
    }

    // 解析 sections 参数
    const sections = changeCartDto.sections || []
    const sectionsUrl = changeCartDto.sectionsUrl || ''

    // 生成返回数据，按照 scripts/cart.change.md 格式
    const result = await this.buildChangeCartResponse(
      cookieHeader,
      sections,
      sectionsUrl,
      newQuantity === 0 ? targetItem : null,
      newQuantity === 0 ? [] : [targetItem]
    )

    return result
  }

  /**
   * 构建 change cart 返回数据
   */
  private async buildChangeCartResponse(
    cookieHeader: string,
    sections: string[],
    sectionsUrl: string,
    removedItem: Cart | null,
    updatedItems: Cart[]
  ): Promise<any> {
    const token = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart')
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
    const usd = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart_currency') || 'USD'

    // 获取更新后的购物车记录
    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })

    // 计算总价和总数量
    let totalPrice = 0
    let totalWeight = 0
    let itemCount = 0
    const items = []

    for (const item of cartItems) {
      const priceInCents = Math.round(Number(item.price) * 100)
      const quantity = item.quantity
      const linePrice = priceInCents * quantity
      const weight = 200
      totalWeight += weight * quantity
      itemCount += quantity
      totalPrice += linePrice

      items.push({
        id: Number(item.variantId),
        properties: {},
        quantity,
        variant_id: Number(item.variantId),
        key: `${item.variantId}:${md5(item.productUrl || '').toString()}`,
        title: `${item.productName} - ${item.size}`,
        price: priceInCents,
        original_price: priceInCents,
        presentment_price: Number(item.price),
        discounted_price: priceInCents,
        line_price: linePrice,
        original_line_price: linePrice,
        total_discount: 0,
        discounts: [],
        sku: '',
        grams: weight,
        vendor: '',
        taxable: true,
        product_id: item.productId,
        product_has_only_default_variant: false,
        gift_card: false,
        final_price: priceInCents,
        final_line_price: linePrice,
        url: `${item.productUrl}?variant=${item.variantId}`,
        featured_image: {
          aspect_ratio: 1.0,
          alt: item.productName || '',
          height: 1500,
          url: item.productUrl || '',
          width: 1500,
        },
        image: item.productUrl || '',
        handle: item.productUrl ? item.productUrl.split('/').pop() : '',
        requires_shipping: true,
        product_type: '',
        product_title: item.productName || '',
        product_description: '',
        variant_title: item.size || '',
        variant_options: [item.size || ''],
        options_with_values: [{ name: 'Size', value: item.size || '' }],
        line_level_discount_allocations: [],
        line_level_total_discount: 0,
        quantity_rule: { min: 1, max: null, increment: 1 },
        has_components: false,
      })
    }

    // 构建 items_added 和 items_removed
    const itemsAdded = []
    const itemsRemoved = []

    if (removedItem) {
      const priceInCents = Math.round(Number(removedItem.price) * 100)
      itemsRemoved.push({
        id: Number(removedItem.variantId),
        properties: {},
        quantity: removedItem.quantity,
        variant_id: Number(removedItem.variantId),
        key: `${removedItem.variantId}:${md5(removedItem.productUrl || '').toString()}`,
        title: `${removedItem.productName} - ${removedItem.size}`,
        price: priceInCents,
        original_price: priceInCents,
        presentment_price: Number(removedItem.price),
        discounted_price: priceInCents,
        line_price: priceInCents * removedItem.quantity,
        original_line_price: priceInCents * removedItem.quantity,
        total_discount: 0,
        discounts: [],
        sku: '',
        grams: 200,
        vendor: '',
        taxable: true,
        product_id: removedItem.productId,
        product_has_only_default_variant: false,
        gift_card: false,
        final_price: priceInCents,
        final_line_price: priceInCents * removedItem.quantity,
        url: `${removedItem.productUrl}?variant=${removedItem.variantId}`,
        featured_image: {
          aspect_ratio: 1.0,
          alt: removedItem.productName || '',
          height: 1500,
          url: removedItem.productUrl || '',
          width: 1500,
        },
        image: removedItem.productUrl || '',
        handle: removedItem.productUrl ? removedItem.productUrl.split('/').pop() : '',
        requires_shipping: true,
        product_type: '',
        product_title: removedItem.productName || '',
        product_description: '',
        variant_title: removedItem.size || '',
        variant_options: [removedItem.size || ''],
        options_with_values: [{ name: 'Size', value: removedItem.size || '' }],
        line_level_discount_allocations: [],
        line_level_total_discount: 0,
        quantity_rule: { min: 1, max: null, increment: 1 },
        has_components: false,
      })
    }

    // 生成 sections HTML
    const sectionsObj: any = {}
    
    if (sections.includes('cart-drawer')) {
      sectionsObj['cart-drawer'] = await this.getCartHTML(cookieHeader)
    }
    
    if (sections.includes('cart-icon-bubble')) {
      sectionsObj['cart-icon-bubble'] = await this.getCartIconHTML(cookieHeader)
    }

    // 构建返回结果，按照 scripts/cart.change.md 格式
    const result = {
      token: `${token}`,
      note: '',
      attributes: {},
      original_total_price: totalPrice,
      total_price: totalPrice,
      total_discount: 0,
      total_weight: totalWeight,
      item_count: itemCount,
      items: items,
      requires_shipping: itemCount > 0,
      currency: usd,
      items_subtotal_price: totalPrice,
      cart_level_discount_applications: [],
      discount_codes: [],
      items_added: itemsAdded,
      items_removed: itemsRemoved,
      sections: sectionsObj,
    }

    return result
  }


  /**
   * 分页查询购物车列表
   */
  async findAll(queryDto: QueryCartDto, cookieHeader?: string): Promise<PaginatedDto<Cart>> {
    const { pageNum = 1, pageSize = 10, productId, status } = queryDto

    const where: any = {}
    
    // 如果提供了 cookie，只查询该用户的购物车
    if (cookieHeader) {
      const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
      if (userId) {
        where.userId = userId
      }
    } else if (queryDto.userId) {
      where.userId = queryDto.userId
    }

    if (productId) {
      where.productId = productId
    }
    if (status !== undefined && status !== null) {
      where.status = status
    } else {
      // 默认只查询正常状态的购物车项
      where.status = 1
    }

    const [rows, total] = await this.cartRepository.findAndCount({
      where,
      order: { cartId: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    })

    return {
      rows,
      total,
    }
  }

  /**
   * 根据购物车ID查询
   */
  async findOne(cartId: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({ where: { cartId } })
    if (!cart) {
      throw new ApiException('购物车项不存在')
    }
    return cart
  }

  /**
   * 更新购物车项数量
   */
  async update(cartId: number, updateCartDto: UpdateCartDto): Promise<void> {
    const cart = await this.findOne(cartId)
    Object.assign(cart, updateCartDto)
    await this.cartRepository.save(cart)
  }

  /**
   * 删除购物车项（软删除）
   */
  async remove(cartIds: string): Promise<void> {
    const cartIdArray = cartIds.split(',').map((id) => Number(id))
    await this.cartRepository.update(cartIdArray, { status: 0 })
  }

  /**
   * 清空用户购物车
   */
  async clearUserCart(cookieHeader: string): Promise<void> {
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
    if (!userId) {
      throw new ApiException('无法识别用户信息')
    }
    await this.cartRepository.update(
      { userId, status: 1 },
      { status: 0 }
    )
  }


  /**
   * 获取购物车 HTML（用于 sections 返回）
   */
  async getCartHTML(cookieHeader: string): Promise<string> {
    return this.getCart(cookieHeader);
  }

  /**
   * 获取购物车图标 HTML（用于 sections 返回）
   */
  async getCartIconHTML(cookieHeader: string): Promise<string> {
    const token = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart');
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y');
    console.log('getCartIconHTML userId:', userId, 'token:', token)
    let itemCount = 0;

    if (token && userId) {
      const cartItems = await this.cartRepository.find({
        where: { token, userId, status: 1 },
      });
      itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    const itemText = itemCount === 1 ? 'item' : 'items';

    return `<div id="shopify-section-cart-icon-bubble" class="shopify-section">
  <a href="/cart" class="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble" aria-label="Cart Drawer" role="button" aria-haspopup="dialog">
    <span class="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <mask id="mask0_785_13254" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
          <rect width="20" height="20" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask0_785_13254)">
          <path d="M1 1H4L6.68 14.39C6.77642 14.8754 7.02817 15.3132 7.3953 15.6342C7.76243 15.9553 8.22373 16.1414 8.706 16.163H15.48C15.9445 16.1613 16.3913 15.9939 16.7396 15.6914C17.088 15.3888 17.3148 14.9713 17.377 14.516L19 4H5" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
    </span>
    <span class="visually-hidden">Cart</span>
    ${itemCount > 0 ? `<span class="cart-count-bubble">\n      <span aria-hidden="true">${itemCount}</span>\n      <span class="visually-hidden">${itemCount} ${itemText}</span>\n    </span>` : ''}
  </a>
</div>`;
  }

  /**
   * 获取购物车信息（Shopify 格式）
   */
  async getCartInfo(cookieHeader: string): Promise<any> {
    const token = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart')
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
    const usd = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart_currency')

    if (!token || !userId) {
      return this.createEmptyCart(token || 'empty')
    }

    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })

    if (cartItems.length === 0) {
      return this.createEmptyCart(token)
    }

    const items = []
    let totalPrice = 0
    let totalWeight = 0
    let itemCount = 0

    for (const item of cartItems) {
      const priceInCents = Math.round(Number(item.price) * 100)
      const quantity = item.quantity
      const linePrice = priceInCents * quantity
      const weight = 200
      totalWeight += weight * quantity
      itemCount += quantity
      totalPrice += linePrice

      items.push({
        id: Number(item.variantId),
        properties: {},
        quantity,
        variant_id: Number(item.variantId),
        key: `${item.variantId}:${md5(item.productUrl || '').toString()}`,
        title: `${item.productName} - ${item.size}`,
        price: priceInCents,
        original_price: priceInCents,
        presentment_price: Number(item.price),
        discounted_price: priceInCents,
        line_price: linePrice,
        original_line_price: linePrice,
        total_discount: 0,
        discounts: [],
        sku: '',
        grams: weight,
        vendor: '',
        taxable: true,
        product_id: item.productId,
        product_has_only_default_variant: false,
        gift_card: false,
        final_price: priceInCents,
        final_line_price: linePrice,
        url: `${item.productUrl}?variant=${item.variantId}`,
        featured_image: {
          aspect_ratio: 1.0,
          alt: item.productName || '',
          height: 1500,
          url: item.productUrl || '',
          width: 1500,
        },
        image: item.productUrl || '',
        handle: item.productUrl ? item.productUrl.split('/').pop() : '',
        requires_shipping: true,
        product_type: '',
        product_title: item.productName || '',
        product_description: '',
        variant_title: item.size || '',
        variant_options: [item.size || ''],
        options_with_values: [{ name: 'Size', value: item.size || '' }],
        line_level_discount_allocations: [],
        line_level_total_discount: 0,
        quantity_rule: { min: 1, max: null, increment: 1 },
        has_components: false,
      })
    }

    return {
      token: `${token}`,
      note: '',
      attributes: {},
      original_total_price: totalPrice,
      total_price: totalPrice,
      total_discount: 0,
      total_weight: totalWeight,
      item_count: itemCount,
      items,
      requires_shipping: true,
      currency: usd,
      items_subtotal_price: totalPrice,
      cart_level_discount_applications: [],
      discount_codes: [],
    }
  }

  /**
   * 获取Checkout信息（用于结算页面）
   */
  async getCheckoutInfo(cookieHeader: string): Promise<any> {
    const token = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart')
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
    const usd = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart_currency') || 'USD'

    console.log('getCheckoutInfo userId:', userId, 'token:', token)

    if (!token || !userId) {
      throw new ApiException('无法识别用户信息')
    }

    // 获取购物车记录，按照 id 从小到大排序
    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })

    if (cartItems.length === 0) {
      throw new ApiException('购物车为空')
    }

    // 构建 checkout line items
    const lineItems = []
    let subtotalPrice = 0
    let totalWeight = 0
    let itemCount = 0

    for (let index = 0; index < cartItems.length; index++) {
      const item = cartItems[index]
      const priceInCents = Math.round(Number(item.price) * 100)
      const quantity = item.quantity
      const linePrice = priceInCents * quantity
      const weight = 200 // 默认重量
      
      totalWeight += weight * quantity
      itemCount += quantity
      subtotalPrice += linePrice

      lineItems.push({
        id: item.cartId,
        key: `${item.variantId}:${md5(item.productUrl || '').toString()}`,
        variant_id: Number(item.variantId),
        product_id: item.productId,
        title: item.productName || 'Product',
        variant_title: item.size || 'One Size',
        sku: '',
        vendor: '',
        quantity: quantity,
        grams: weight,
        price: priceInCents,
        compare_at_price: priceInCents,
        line_price: linePrice,
        properties: {},
        original_line_price: linePrice,
        total_discount: 0,
        discounts: [],
        discounted_price: priceInCents,
        discounted_line_price: linePrice,
        gift_card: false,
        url: `${item.productUrl}?variant=${item.variantId}`,
        image: item.productUrl || '',
        handle: item.productUrl ? item.productUrl.split('/').pop() : '',
        requires_shipping: true,
        product_type: '',
        product_title: item.productName || '',
        product_description: '',
        variant_options: [item.size || ''],
        options_with_values: [{ name: 'Size', value: item.size || '' }],
        line_level_discount_allocations: [],
        line_level_total_discount: 0,
        quantity_rule: { min: 1, max: null, increment: 1 },
        has_components: false,
      })
    }

    // 计算总价（可以后续添加税费、运费等）
    const totalPrice = subtotalPrice
    const totalTax = 0
    const totalShipping = 0
    const totalDiscount = 0

    // 构建 checkout 响应数据
    const checkoutData = {
      token: token,
      cart_token: token,
      email: '',
      gateway: '',
      buyer_accepts_marketing: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      currency: usd,
      presentment_currency: usd,
      customer_locale: 'en-SG',
      line_items: lineItems,
      name: `#${Date.now()}`,
      note: '',
      note_attributes: [],
      referring_site: '',
      shipping_lines: [],
      taxes_included: false,
      total_weight: totalWeight,
      total_price: totalPrice,
      subtotal_price: subtotalPrice,
      total_tax: totalTax,
      total_discounts: totalDiscount,
      total_line_items_price: subtotalPrice,
      total_duties: null,
      payment_due: totalPrice,
      payment_url: `/checkouts/${token}`,
      web_url: `/checkouts/${token}`,
      order_id: null,
      order_status_url: null,
      order: null,
      billing_address: null,
      shipping_address: null,
      customer: null,
      completed_at: null,
      closed_at: null,
      phone: null,
      customer_id: null,
      location_id: null,
      source_identifier: null,
      source_url: null,
      device_id: null,
      user_id: null,
      source: 'web',
      discount_codes: [],
      tax_lines: [],
      source_name: 'web',
      buyer_accepts_sms_marketing: false,
      sms_marketing_phone: null,
      total_tip_received: 0,
      original_total_price: totalPrice,
      total_shipping_price_set: {
        shop_money: { amount: '0.00', currency_code: usd },
        presentment_money: { amount: '0.00', currency_code: usd }
      },
      total_price_set: {
        shop_money: { amount: (totalPrice / 100).toFixed(2), currency_code: usd },
        presentment_money: { amount: (totalPrice / 100).toFixed(2), currency_code: usd }
      },
      total_discount_set: {
        shop_money: { amount: '0.00', currency_code: usd },
        presentment_money: { amount: '0.00', currency_code: usd }
      },
      total_tax_set: {
        shop_money: { amount: '0.00', currency_code: usd },
        presentment_money: { amount: '0.00', currency_code: usd }
      },
      subtotal_price_set: {
        shop_money: { amount: (subtotalPrice / 100).toFixed(2), currency_code: usd },
        presentment_money: { amount: (subtotalPrice / 100).toFixed(2), currency_code: usd }
      },
      total_line_items_price_set: {
        shop_money: { amount: (subtotalPrice / 100).toFixed(2), currency_code: usd },
        presentment_money: { amount: (subtotalPrice / 100).toFixed(2), currency_code: usd }
      }
    }

    return checkoutData
  }

  private createEmptyCart(token: string): any {
    return {
      token: `${token}?key=${md5(token).toString()}`,
      note: '',
      attributes: {},
      original_total_price: 0,
      total_price: 0,
      total_discount: 0,
      total_weight: 0,
      item_count: 0,
      items: [],
      requires_shipping: false,
      currency: 'USD',
      items_subtotal_price: 0,
      cart_level_discount_applications: [],
      discount_codes: [],
    }
  }

  /**
   * 获取购物车 HTML 内容（Shopify Cart Drawer 格式）
   */
  async getCart(cookieHeader: string, sectionId?: string): Promise<string> {
    const token = this.cookieService.extractKeyFromCookie(cookieHeader, 'cart')
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')

    if (!token || !userId) {
      return this.createEmptyCartHTML(token || 'empty')
    }

    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })

    if (cartItems.length === 0) {
      return this.createEmptyCartHTML(token)
    }

    // 生成购物车项目 HTML
    let cartItemsHTML = ''
    let totalPrice = 0
    let itemCount = 0

    for (let index = 0; index < cartItems.length; index++) {
      const item = cartItems[index]
      const lineIndex = index + 1
      const quantity = item.quantity
      const lineTotal = Number(item.price) * quantity
      totalPrice += lineTotal
      itemCount += quantity

      // 获取 SKU 信息
      const productSkus = await this.productSkuService.findByProductId(item.productId)
      
      // 生成 SKU 选项 HTML
      let skuOptionsHTML = ''
      if (productSkus.length > 0) {
        skuOptionsHTML = this.generateSkuOptionsHTML(item, productSkus, lineIndex)
      }

      // 生成单个购物车项目 HTML
      cartItemsHTML += this.generateCartItemHTML(item, lineIndex, skuOptionsHTML)
    }

    // 生成完整的购物车 HTML
    return this.generateCartDrawerHTML(cartItemsHTML, totalPrice, itemCount, cartItems.length)
  }

  /**
   * 生成 SKU 选项 HTML
   */
  private generateSkuOptionsHTML(cartItem: Cart, productSkus: any[], lineIndex: number): string {
    const currentSkuId = cartItem.skuId
    const currentSize = cartItem.size
    
    // 为每个 SKU 生成固定的 32 位 MD5 值（基于 sku_id）
    const getMd5ForSku = (skuId: number) => {
      return md5(`sku_${skuId}_size_option`)
    }

    let optionsHTML = ''
    for (const sku of productSkus) {
      const md5Hash = getMd5ForSku(sku.skuId)
      const isSelected = sku.skuId === currentSkuId ? 'selected' : ''
      const stock = 100 // 默认库存，可以从数据库或其他地方获取
      
      optionsHTML += `
  <option
    value="${sku.skuId}"
    data-stock="${stock}"
    ${isSelected}
  >
    ${sku.size || 'One Size'}
  </option>`
    }

    const md5Hash = getMd5ForSku(currentSkuId)
    
    return `
  <div class="product-option">
    <label for="Size-${currentSkuId}:${md5Hash}">Size:</label>
    <select
      id="Size-${currentSkuId}:${md5Hash}"
      class="cart-size-select"
      data-key="${currentSkuId}:${md5Hash}"
      data-index="${lineIndex}"
      data-input-id="Drawer-quantity-${lineIndex}"
    >
      ${optionsHTML}
    </select>
  </div>`
  }

  /**
   * 生成单个购物车项目 HTML
   */
  private generateCartItemHTML(cartItem: Cart, lineIndex: number, skuOptionsHTML: string): string {
    const productUrl = cartItem.productUrl || ''
    const imageUrl = cartItem.productUrl ? cartItem.productUrl.replace(/\?.*$/, '') : ''
    const productName = cartItem.productName || 'Product'
    const price = Number(cartItem.price).toFixed(2)
    const quantity = cartItem.quantity
    const size = cartItem.size || 'One Size'

    // 处理 URL 中的 handle
    const handle = productUrl ? productUrl.split('/').pop() : ''
    const productUrlWithVariant = `${productUrl}?variant=${cartItem.skuId}`
const timestamp = Math.floor(Date.now() / 1000);
    return `
<tr
  id="CartDrawer-Item-${lineIndex}"
  class="cart-item"
  role="row"
>
  <td
    class="cart-item__media"
    role="cell"
    headers="CartDrawer-ColumnProductImage"
  >
    <img
      class="cart-item__image"
      src="${imageUrl}?v=${timestamp}&width=300"
      alt="${productName}"
      loading="lazy"
      width="300"
      height="300"
    >
  </td>

  <td class="cart-item__details" role="cell" headers="CartDrawer-ColumnProduct">
    <a href="${productUrlWithVariant}" class="cart-item__name h4 break">${productName}</a>
    <dl>
      ${skuOptionsHTML}
    </dl>
    <p class="product-option"></p>
    <ul class="discounts list-unstyled" role="list" aria-label="Discount"></ul>
  </td>

  <td class="cart-item__totals right" role="cell" headers="CartDrawer-ColumnTotal">
    <div class="loading__spinner hidden">
      <svg xmlns="http://www.w3.org/2000/svg" class="spinner" viewBox="0 0 66 66"><circle stroke-width="6" cx="33" cy="33" r="30" fill="none" class="path"/></svg>
    </div>
    <div class="cart-item__price-wrapper">
      <div class="price price--end">$${price}</div>
    </div>
  </td>

  <td
    class="cart-item__quantity"
    role="cell"
    headers="CartDrawer-ColumnQuantity"
  >
    <quantity-popover>
      <div class="cart-item__quantity-wrapper quantity-popover-wrapper">
        <div class="quantity-popover-container">
          <quantity-input class="quantity cart-quantity">
            <button class="quantity__button" name="minus" type="button">
              <span class="visually-hidden">Decrease quantity for ${productName}</span>
              <span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-minus" viewBox="0 0 10 2"><path fill="currentColor" fill-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clip-rule="evenodd"/></svg></span>
            </button>
            <input
              class="quantity__input"
              type="number"
              data-quantity-variant-id="${cartItem.skuId}"
              name="updates[]"
              value="${quantity}"
              data-cart-quantity="${quantity}"
              min="0"
              data-min="0"
              step="1"
              aria-label="Quantity for ${productName}"
              id="Drawer-quantity-${lineIndex}"
              data-index="${lineIndex}"
            >
            <button class="quantity__button" name="plus" type="button">
              <span class="visually-hidden">Increase quantity for ${productName}</span>
              <span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-plus" viewBox="0 0 10 10"><path fill="currentColor" fill-rule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clip-rule="evenodd"/></svg></span>
            </button>
          </quantity-input>
        </div>
        <cart-remove-button id="CartDrawer-Remove-${lineIndex}" data-index="${lineIndex}">
          <button
            type="button"
            class="button button--tertiary cart-remove-button"
            aria-label="Remove ${productName} - ${size}"
            data-variant-id="${cartItem.skuId}"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_1453_1776" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="12" height="12">
                <rect width="12" height="12" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask0_1453_1776)">
                <path d="M3.5 10.5C3.225 10.5 2.98958 10.4021 2.79375 10.2063C2.59792 10.0104 2.5 9.775 2.5 9.5V3C2.35833 3 2.23958 2.95208 2.14375 2.85625C2.04792 2.76042 2 2.64167 2 2.5C2 2.35833 2.04792 2.23958 2.14375 2.14375C2.23958 2.04792 2.35833 2 2.5 2H4.5C4.5 1.85833 4.54792 1.73958 4.64375 1.64375C4.73958 1.54792 4.85833 1.5 5 1.5H7C7.14167 1.5 7.26042 1.54792 7.35625 1.64375C7.45208 1.73958 7.5 1.85833 7.5 2H9.5C9.64167 2 9.76042 2.04792 9.85625 2.14375C9.95208 2.23958 10 2.35833 10 2.5C10 2.64167 9.95208 2.76042 9.85625 2.85625C9.76042 2.95208 9.64167 3 9.5 3V9.5C9.5 9.775 9.40208 10.0104 9.20625 10.2063C9.01042 10.4021 8.775 10.5 8.5 10.5H3.5ZM8.5 3H3.5V9.5H8.5V3ZM5 8.5C5.14167 8.5 5.26042 8.45208 5.35625 8.35625C5.45208 8.26042 5.5 8.14167 5.5 8V4.5C5.5 4.35833 5.45208 4.23958 5.35625 4.14375C5.26042 4.04792 5.14167 4 5 4C4.85833 4 4.73958 4.04792 4.64375 4.14375C4.54792 4.23958 4.5 4.35833 4.5 4.5V8C4.5 8.14167 4.54792 8.26042 4.64375 8.35625C4.73958 8.45208 4.85833 8.5 5 8.5ZM7 8.5C7.14167 8.5 7.26042 8.45208 7.35625 8.35625C7.45208 8.26042 7.5 8.14167 7.5 8V4.5C7.5 4.35833 7.45208 4.23958 7.35625 4.14375C7.26042 4.04792 7.14167 4 7 4C6.85833 4 6.73958 4.04792 6.64375 4.14375C6.54792 4.23958 6.5 4.35833 6.5 4.5V8C6.5 8.14167 6.54792 8.26042 6.64375 8.35625C6.73958 8.45208 6.85833 8.5 7 8.5Z" fill="#141414"/>
              </g>
            </svg>
          </button>
        </cart-remove-button>
      </div>
      <div id="CartDrawer-LineItemError-${lineIndex}" class="cart-item__error" role="alert">
        <small class="cart-item__error-text"></small>
        <span class="svg-wrapper"><svg class="icon icon-error" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" stroke="#fff" stroke-width="2"/><circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" stroke-width=".7"/><path fill="#fff" d="m5.874 3.528.1 4.044h1.053l.1-4.044zm.627 6.133c.38 0 .68-.288.68-.656s-.3-.656-.68-.656-.681.288-.681.656.3.656.68.656"/><path fill="#fff" stroke="#EB001B" stroke-width=".7" d="M5.874 3.178h-.359l.01.359.1 4.044.008.341h1.736l.008-.341.1-4.044.01-.359H5.873Zm.627 6.833c.56 0 1.03-.432 1.03-1.006s-.47-1.006-1.03-1.006-1.031.432-1.031 1.006.47 1.006 1.03 1.006Z"/></svg></span>
      </div>
    </quantity-popover>
  </td>
</tr>`
  }

  /**
   * 生成完整的购物车 Drawer HTML
   */
  private generateCartDrawerHTML(cartItemsHTML: string, totalPrice: number, itemCount: number, itemCountLabel: number): string {
    const totalPriceFormatted = totalPrice.toFixed(2)
    const itemText = itemCountLabel === 1 ? 'item' : 'items'

    return `<div id="shopify-section-cart-drawer" class="shopify-section">

<link href="//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/quantity-popover.css?v=142999833234775652671774385687" rel="stylesheet" type="text/css" media="all" />
<link href="//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/component-card.css?v=19265040226881398761774385687" rel="stylesheet" type="text/css" media="all" />

<script src="//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/cart.js?v=149940146326666886541775498986" defer="defer"></script>
<script src="//cdn.shopify.com/s/files/1/0591/0478/8538/t/5/assets/quantity-popover.js?v=987015268078116491774385687" defer="defer"></script>

<style>
  .drawer {
    visibility: hidden;
  }
  .product-option select{
    border:0;
    font-size:10px;
    line-height:14px;
  }
  .product-option label{
    color:#000;
    font-size:10px;
    line-height:14px;
  }
  .cart-item.is-switching {
    position: relative;
    pointer-events: none;
    opacity: 0.6;
  }
  .cart-item.is-switching::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(2px);
    z-index: 5;
  }
  .cart-item.is-switching::before {
    content: "";
    position: absolute;
    width: 32px;
    height: 32px;
    border: 3px solid #ddd;
    border-top: 3px solid #000;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: cartSpin 0.8s linear infinite;
    z-index: 6;
  }
  @keyframes cartSpin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  .cart-item.is-switching .cart-item__error,
  .cart-item.is-switching .cart-item__warning {
    display: none !important;
  }
</style>

<cart-drawer class="drawer">
  <div id="CartDrawer" class="cart-drawer">
    <div id="CartDrawer-Overlay" class="cart-drawer__overlay"></div>
    <div class="drawer__inner gradient color-scheme-1" role="dialog" aria-modal="true" aria-label="Your bag" tabindex="-1">
      <div class="drawer__header">
        <h2 class="drawer__heading">
          Your bag
          <span class="cart-count" aria-live="polite">(${itemCountLabel} ${itemText})</span>
        </h2>
        <button class="drawer__close" type="button" onclick="this.closest('cart-drawer').close()" aria-label="Close">
          <span class="svg-wrapper"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5L15 15" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </button>
      </div>
      <cart-drawer-items>
        <form action="/cart" id="CartDrawer-Form" class="cart__contents cart-drawer__form" method="post">
          <div id="CartDrawer-CartItems" class="drawer__contents js-contents">
            <div class="drawer__cart-items-wrapper">
              <table class="cart-items" role="table">
                <thead role="rowgroup" hidden>
                  <tr role="row">
                    <th id="CartDrawer-ColumnProductImage" role="columnheader"><span class="visually-hidden">Product image</span></th>
                    <th id="CartDrawer-ColumnProduct" class="caption-with-letter-spacing" scope="col" role="columnheader">Product</th>
                    <th id="CartDrawer-ColumnTotal" class="right caption-with-letter-spacing" scope="col" role="columnheader">Total</th>
                    <th id="CartDrawer-ColumnQuantity" role="columnheader"><span class="visually-hidden">Quantity</span></th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  ${cartItemsHTML}
                </tbody>
              </table>
            </div>
            <p id="CartDrawer-LiveRegionText" class="visually-hidden" role="status"></p>
            <p id="CartDrawer-LineItemStatus" class="visually-hidden" aria-hidden="true" role="status">Loading...</p>
          </div>
          <div id="CartDrawer-CartErrors" role="alert"></div>
        </form>
      </cart-drawer-items>
      <div class="drawer__footer">
        <div class="cart-drawer__footer">
          <div class="cdfd">
            <small class="tax-note caption-large rte">Taxes, discounts and shipping calculated at checkout.</small>
            <hr>
            <div class="totals" role="status">
              <h4 class="totals__total">Subtotal</h4>
              <p class="totals__total-value">$${totalPriceFormatted} USD</p>
            </div>
          </div>
          <div class="cart__ctas">
            <button type="submit" id="CartDrawer-Checkout" class="cart__checkout-button btn btn-primary" name="checkout" form="CartDrawer-Form">Proceed to checkout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</cart-drawer>

<script>
  document.addEventListener('change', function (e) {
    const select = e.target.closest('.cart-size-select');
    if (!select) return;
    e.stopImmediatePropagation();
    const inputId = select.dataset.inputId;
    if (!inputId) return;
    const quantityInput = document.getElementById(inputId);
    if (!quantityInput) return;
    const lineIndex = quantityInput.dataset.index;
    const currentQty = parseInt(quantityInput.value) || 1;
    const selectedVariantId = select.value;
    const selectedOption = select.options[select.selectedIndex];
    const maxStock = parseInt(selectedOption.dataset.stock) || 0;
    let finalQty = currentQty;
    if (maxStock > 0 && currentQty > maxStock) {
      finalQty = maxStock;
    }
    if (finalQty !== currentQty) {
      quantityInput.value = finalQty;
    }
    const cartItem = document.getElementById(\`CartDrawer-Item-\${lineIndex}\`);
    if (!cartItem) return;
    cartItem.classList.add('is-switching');
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: lineIndex, quantity: 0 }),
    })
    .then(() => {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVariantId, quantity: finalQty }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          console.warn('Add error (ignored):', errorData);
          return Promise.resolve();
        }
      });
    })
    .then(() => {
      return fetch('/?sections=cart-drawer');
    })
    .then((res) => res.json())
    .then((data) => {
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(data['cart-drawer'], 'text/html');
      const newDrawer = newDoc.querySelector('cart-drawer');
      const currentDrawer = document.querySelector('cart-drawer');
      if (newDrawer && currentDrawer) {
        currentDrawer.innerHTML = newDrawer.innerHTML;
      }
    })
    .catch((error) => {
      console.error('Variant switch error:', error);
    })
    .finally(() => {
      cartItem.classList.remove('is-switching');
    });
  });
</script>
</div>`
  }

  /**
   * 生成空购物车 HTML
   */
  private createEmptyCartHTML(token: string): string {
    return `<div id="shopify-section-cart-drawer" class="shopify-section">
<cart-drawer class="drawer">
  <div id="CartDrawer" class="cart-drawer">
    <div id="CartDrawer-Overlay" class="cart-drawer__overlay"></div>
    <div class="drawer__inner gradient color-scheme-1" role="dialog" aria-modal="true" aria-label="Your bag" tabindex="-1">
      <div class="drawer__header">
        <h2 class="drawer__heading">Your bag <span class="cart-count" aria-live="polite">(0 items)</span></h2>
        <button class="drawer__close" type="button" onclick="this.closest('cart-drawer').close()" aria-label="Close">
          <span class="svg-wrapper"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5L15 15" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </button>
      </div>
      <div class="drawer__footer">
        <div class="cart-drawer__footer">
          <div class="cart__ctas">
            <button type="submit" id="CartDrawer-Checkout" class="cart__checkout-button btn btn-primary" disabled>Proceed to checkout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</cart-drawer>
</div>`
  }
}
