import { IsOptional, IsString } from 'class-validator'
import { Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm'
import { ApiHideProperty } from '@nestjs/swagger'
import { Excel } from 'src/modules/common/excel/excel.decorator'
import { ExcelTypeEnum } from 'src/modules/common/excel/excel.enum'

export class BaseEntity {
  /* 创建时间 */
@Column({
  name: 'create_time',
  type: 'datetime', // 强制指定类型
  comment: '创建时间',
  precision: 0,
  nullable: false,         // 必须加
  default: () => 'CURRENT_TIMESTAMP', // 强制指定正确默认值
})
  @ApiHideProperty()
  @Excel({
    name: '创建时间',
    type: ExcelTypeEnum.EXPORT,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    sort: 100,
  })
  createTime: Date 

  /* 更新时间 */
@Column({
  name: 'update_time',
  type: 'timestamp',
  comment: '更新时间',
  precision: 0,
  nullable: false,         // 必须加
  default: () => 'CURRENT_TIMESTAMP', // 强制指定正确默认值
  
})
  @ApiHideProperty()
  updateTime: Date  

  /* 创建人 */
  @Column({ name: 'create_by', comment: '创建人', length: 30, default: '' })
  @ApiHideProperty()
  @Excel({
    name: '创建人',
    type: ExcelTypeEnum.EXPORT,
    sort: 101,
  })
  createBy: string

  /* 更新人 */
  @Column({ name: 'update_by', comment: '更新人', length: 30, default: '' })
  @ApiHideProperty()
  updateBy: string

  /* 备注 */
  @Column({ name: 'remark', comment: '备注', default: '' })
  @IsOptional()
  @IsString()
  @Excel({
    name: '备注',
    sort: 102,
  })
  remark?: string

  /* 版本号（首次插入或更新时会自增） */
  @VersionColumn({ name: 'version', comment: '版本号', select: false })
  @ApiHideProperty()
  version?: number
}
