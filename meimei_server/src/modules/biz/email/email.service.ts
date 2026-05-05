import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

import { convertToBrl } from './../../../common/utils';


@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SES_SMTP_HOST'),
      port: this.configService.get<number>('SES_SMTP_PORT', 587),
      secure: false, // AWS SES 使用 STARTTLS
      auth: {
        user: this.configService.get<string>('SES_SMTP_USER'),
        pass: this.configService.get<string>('SES_SMTP_PASS'),
      },
    });
  }

  /**
   * 发送订单成功邮件
   */
  async sendOrderSuccessEmail(to: string, orderData: {
    orderNo: string;
    totalAmount: number;
    currency: string;
    items: Array<{
      productName: string;
      variantName: string;
      quantity: number;
      salePrice: number;
      subtotalAmount: number;
      productImage: string;
    }>;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    paidAt: Date;
  }): Promise<void> {
    try {
      const orderInfoUrl = `${this.configService.get<string>('APP_URL', 'https://store.fafbuy.store')}/order/info?sign=${orderData.orderNo}`;
      
      const html = this.generateOrderSuccessHtml(orderData, orderInfoUrl);

      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SES_FROM_NAME', 'FIFA Official Store')}" <${this.configService.get<string>('SES_FROM_EMAIL')}>`,
        to,
        subject: `Confirmação do Pedido - ${orderData.orderNo}`,
        html,
      });

      this.logger.log(`邮件发送成功: ${to}, 订单号: ${orderData.orderNo}`);
    } catch (error) {
      this.logger.error(`发送邮件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 生成订单成功邮件HTML
   */
  private generateOrderSuccessHtml(orderData: any, orderInfoUrl: string): string {
    
    const totalAmountFormatted = orderData.currency === 'USD' ? orderData.totalAmount : convertToBrl(orderData.totalAmount, orderData.currency);
    const currencySymbol = orderData.currency === 'USD' ? '$' : 'R$';
    const itemsHtml = orderData.items.map((item: any) => {
      const priceFormatted = orderData.currency === 'USD' ? item.salePrice : convertToBrl(item.salePrice, orderData.currency);
      const subtotalFormatted = orderData.currency === 'USD' ? item.subtotalAmount : convertToBrl(item.subtotalAmount, orderData.currency);
      return `
        <div style="padding: 16px 0; border-bottom: 1px solid #e0e0e0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="80" valign="top">
                <img src="${item.productImage || 'https://cdn.shopify.com/s/files/1/0591/0478/8538/files/fifa_favicon.png'}" 
                     alt="${item.productName}" 
                     width="64" height="64" 
                     style="border-radius: 4px; object-fit: cover;">
              </td>
              <td style="padding-left: 16px;">
                <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #333333;">
                  ${item.productName}
                </p>
                ${item.variantName ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #666666;">Tamanho: ${item.variantName}</p>` : ''}
                <p style="margin: 0; font-size: 14px; color: #666666;">Quantidade: ${item.quantity}</p>
              </td>
              <td width="100" valign="top" style="text-align: right;">
                <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #333333;">
                  ${currencySymbol}${subtotalFormatted}
                </p>
                <p style="margin: 0; font-size: 12px; color: #999999;">
                  ${currencySymbol}${priceFormatted} × ${item.quantity}
                </p>
              </td>
            </tr>
          </table>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação do Pedido</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 32px 24px;
          }
          .section {
            margin-bottom: 32px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333333;
            margin: 0 0 16px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #0066cc;
          }
          .order-info {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 6px;
          }
          .order-info p {
            margin: 8px 0;
            font-size: 14px;
            color: #666666;
          }
          .order-info strong {
            color: #333333;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-top: 2px solid #e0e0e0;
            margin-top: 16px;
          }
          .total-row .label {
            font-size: 18px;
            font-weight: 600;
            color: #333333;
          }
          .total-row .amount {
            font-size: 24px;
            font-weight: 700;
            color: #0066cc;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin: 16px 0;
          }
          .button:hover {
            background: #0052a3;
          }
          .footer {
            background: #f8f9fa;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #999999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pedido Confirmado</h1>
            <p>Seu pagamento foi processado com sucesso</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2 class="section-title">Informações do Pedido</h2>
              <div class="order-info">
                <p><strong>Número do Pedido:</strong> ${orderData.orderNo}</p>
                <p><strong>Data do Pagamento:</strong> ${new Date(orderData.paidAt).toLocaleString('pt-BR')}</p>
                <p><strong>Nome:</strong> ${orderData.fullName}</p>
                <p><strong>E-mail:</strong> ${orderData.email}</p>
                <p><strong>Telefone:</strong> ${orderData.phone}</p>
                <p><strong>Endereço:</strong> ${orderData.address}, ${orderData.city}, ${orderData.province} ${orderData.postalCode}</p>
                <p><strong>País:</strong> ${orderData.country}</p>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Itens do Pedido</h2>
              ${itemsHtml}
              <div class="total-row">
                <span class="label">Total</span>
                <span class="amount">${currencySymbol}${totalAmountFormatted}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${orderInfoUrl}" class="button">
                Visualizar Pedido
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Obrigado por comprar na FIFA Official Store!</p>
            <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
