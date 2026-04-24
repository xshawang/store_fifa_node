import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Cart } from './entities/cart.entity'
import { CreateCartDto, UpdateCartDto, QueryCartDto } from './dto/req-cart.dto'
import { PaginatedDto } from 'src/common/dto/paginated.dto'
import { ApiException } from 'src/common/exceptions/api.exception'
import { CookieService } from './cart-cookie.service'
import { ProductService } from '../product/product.service'
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
  ) {}

  /**
   * 添加商品到购物车
   */
  async addToCart(createCartDto: CreateCartDto, cookieHeader: string): Promise<any> {
    // 从 cookie 中提取用户标识
    const userId = this.cookieService.extractKeyFromCookie(cookieHeader,"_shopify_y")
    if (!userId) {
      throw new ApiException('无法识别用户信息，请确保已启用 cookie')
    }
    const token = this.cookieService.extractKeyFromCookie(cookieHeader,"cart")
    if(!token) {
      throw new ApiException('无法识别用户信息，请确保已启用 cookie')
    }
    // 查询产品信息（可选，用于填充购物车中的产品信息）
    let productName: string | null = null
    let price: number | null = null
    let productUrl: string | null = null
    
   
      const product = await this.productService.findOne(createCartDto.id)
      if (product) {
        productName = product.productName
        price = product.price
        productUrl = product.productUrl
      }
 

    // 检查购物车中是否已存在相同的产品和尺码组合
    const existingCart = await this.cartRepository.findOne({
      where: {
        token: token,
        userId:userId,
        productId: createCartDto.productId,
        skuId: createCartDto.id,
        size: createCartDto.size,
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
      return await this.cartRepository.save(existingCart)
    }

    // 创建新的购物车项
    const cart = this.cartRepository.create({
      token,
      userId,
      productId: createCartDto.productId,
      skuId: createCartDto.id,
      variantId: String(createCartDto.id),
      size: createCartDto.size,
      formType: createCartDto.formType || 'product',
      quantity: createCartDto.quantity || 1,
      sectionId: createCartDto.sectionId,
      sections: createCartDto.sections,
      sectionsUrl: createCartDto.sectionsUrl,
      productName,
      price,
      productUrl,
      status: 1,
      createBy: userId,
      updateBy: userId,
    })

     await this.cartRepository.save(cart);

     const productPrice = product.price*100;
     const productSections = {};
     //拼接返回信息
    const result =  {discounted_price:productPrice,discounts:[],featured_image:{
        alt:product.productName,height:1500,aspect_ratio:1,
        url:product.productUrl,width:1500        
    },
    final_line_price:productPrice,final_price:productPrice,gift_card:createCartDto.formType=='product'?true:false,
    grams:5000,handle:createCartDto.sectionsUrl.substring(createCartDto.sectionsUrl.lastIndexOf('/')+1),
    id:createCartDto.id,imgage:product.productUrl,key:createCartDto.id+":"+md5(product.productUrl).toString(),
    line_level_discounts:[],line_price:productPrice,line_level_total_discount:0，
    options_with_values:[{name:'Size',value:createCartDto.size}],
    original_line_price:productPrice,
    original_price:productPrice,
    presentment_price:product.price,
    price:productPrice,
    product_description:product.description,
    product_has_only_default_variant:false,
    product_id:product.productId,
    product_title:product.productName,
    product_type:product.productType,
    properties:{},
    quantity:createCartDto.quantity,
    requires_shipping:true,
    sections:productSections,
    sku:product.sku,
    taxable:true,
    title:product.productName+' '+createCartDto.size,
    total_discount:0,
    untranslated_product_title:product.productName,
    untranslated_variant_title:createCartDto.size,
    url:createCartDto.sectionsUrl+'?variant='+createCartDto.id,
    variant_id:createCartDto.id,
    variant_title:createCartDto.size,
    variant_options:[createCartDto.size],
    vendor:product.brand
    }
     return  result;
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
}
