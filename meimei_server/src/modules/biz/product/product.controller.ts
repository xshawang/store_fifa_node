import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { DataObj } from 'src/common/class/data-obj.class'
import { ApiDataResponse, typeEnum } from 'src/common/decorators/api-data-response.decorator'
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator'
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator'
import { RepeatSubmit } from 'src/common/decorators/repeat-submit.decorator'
import { RequiresPermissions } from 'src/common/decorators/requires-permissions.decorator'
import { User, UserEnum } from 'src/common/decorators/user.decorator'
import { PaginationPipe } from 'src/common/pipes/pagination.pipe'
import { UserInfoPipe } from 'src/common/pipes/user-info.pipe'
import { ProductService } from './product.service'
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto/req-product.dto'
import { Product } from './entities/product.entity'
import { Public } from 'src/common/decorators/public.decorator'

@ApiTags('产品管理')
@ApiBearerAuth()
@Controller('biz/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /* 新增产品 */
  @RepeatSubmit()
  @Post()
  @RequiresPermissions('biz:product:add')
  @Log({
    title: '产品管理',
    businessType: BusinessTypeEnum.insert,
  })
  async add(@Body() createProductDto: CreateProductDto, @User(UserEnum.userName, UserInfoPipe) userName: string) {
    createProductDto.createBy = createProductDto.updateBy = userName
    await this.productService.create(createProductDto)
  }

  /* 分页查询产品列表 */
  @Get('list')
  @RequiresPermissions('biz:product:query')
  @ApiPaginatedResponse(Product)
  async list(@Query(PaginationPipe) queryDto: QueryProductDto) {
    return this.productService.findAll(queryDto)
  }

  /* 通过SKU ID查询产品 */
  @Get(':skuId')
  @RequiresPermissions('biz:product:query')
  @ApiDataResponse(typeEnum.object, Product)
  async one(@Param('skuId') skuId: number) {
    const product = await this.productService.findOne(skuId)
    return DataObj.create(product)
  }

  /* 编辑产品 */
  @RepeatSubmit()
  @Put()
  @RequiresPermissions('biz:product:edit')
  @Log({
    title: '产品管理',
    businessType: BusinessTypeEnum.update,
  })
  async update(
    @Body() updateProductDto: UpdateProductDto,
    @User(UserEnum.userName, UserInfoPipe) userName: string,
  ) {
    updateProductDto.updateBy = userName
    await this.productService.update(Number(updateProductDto.skuId), updateProductDto)
  }

  /* 删除产品 */
  @Delete(':skuIds')
  @RequiresPermissions('biz:product:remove')
  @Log({
    title: '产品管理',
    businessType: BusinessTypeEnum.delete,
  })
  async delete(@Param('skuIds') skuIds: string) {
    await this.productService.remove(skuIds)
  }
}

/* 公开接口：前端用户查询产品列表 */
@ApiTags('商品展示')
@Controller('api/goods')
export class PublicGoodsController {
  constructor(private readonly productService: ProductService) {}

  /* 查询上架产品列表（无需鉴权） */
  @Get('list')
  @Public()
  @ApiPaginatedResponse(Product)
  async list(@Query(PaginationPipe) queryDto: QueryProductDto) {
    return this.productService.findPublicList(queryDto)
  }
}
