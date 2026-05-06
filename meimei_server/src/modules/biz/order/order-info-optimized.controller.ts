import { Controller, Get, Query, Header, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { OrderService } from '../order/order.service';
import { Keep } from 'src/common/decorators/keep.decorator'
import { convertToBrl } from 'src/common/utils';
@Controller('order')
export class OrderInfoOptimizedController {
  private readonly logger = new Logger(OrderInfoOptimizedController.name);

  constructor(
    private readonly orderService: OrderService,
  ) {}

  /**
   * 查看订单信息 - 优化版 (公开接口,无需校验)
   * GET /order/v2/info?sign=订单编号
   */
  @Get('v2/info')
  @Public()
  @Keep()
  async getOrderInfo(@Query('sign') orderNo: string, @Res() response: Response): Promise<void> {
    if (!orderNo) {
      this.logger.warn('订单编号参数缺失');
      response.status(400).send(this.generateErrorHtml('Número do pedido é obrigatório'));
      return;
    }

    try {
      this.logger.log(`查看订单信息: ${orderNo}`);

      // 获取订单详情
      const orderDetail = await this.orderService.getOrderDetail(orderNo);
      const { order, items } = orderDetail;
      const deliver = await this.orderService.getDeliverByOrderNo(orderNo);

      // 生成HTML响应
      const html = this.generateOrderInfoHtml(order, items, deliver);
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.send(html);
    } catch (error) {
      this.logger.error(`获取订单信息失败: ${error.message}`, error.stack);
      response.status(404).send(this.generateErrorHtml('Pedido não encontrado'));
    }
  }

  /**
   * 生成订单信息展示HTML - 优化版
   */
  private generateOrderInfoHtml(order: any, items: any[], deliver: any): string {
    const totalAmountFormatted = order.currency === 'BRL' ? order.totalAmount : convertToBrl(order.totalAmount, order.currency).brl;
    const subtotalAmountFormatted = order.currency === 'BRL' ? order.subtotalAmount : convertToBrl(order.subtotalAmount, order.currency).brl;
    const shippingAmountFormatted = order.currency === 'BRL' ? order.shippingAmount : convertToBrl(order.shippingAmount, order.currency).brl;
    const taxAmountFormatted = order.currency === 'BRL' ? order.taxAmount : convertToBrl(order.taxAmount, order.currency).brl;
    const discountAmountFormatted = order.currency === 'BRL' ? order.discountAmount : convertToBrl(order.discountAmount, order.currency).brl;
    
    const currencySymbol = order.currency === 'BRL' ? '$' : 'R$';

    
    const statusMap: Record<number, string> = {
      0: 'Aguardando Pagamento',
      1: 'Pago',
      2: 'Enviado',
      3: 'Concluído',
      4: 'Cancelado',
      5: 'Reembolso em Processamento',
      6: 'Reembolsado',
    };
    
    const orderStatusText = statusMap[order.orderStatus] || 'Desconhecido';

    const itemsHtml = items.map(item => {
      const priceFormatted = item.salePrice
      const subtotalFormatted = item.subtotalAmount ;
      return `
        <div class="item-row">
          <div class="item-image">
            <img src="${item.productUrl || 'https://cdn.shopify.com/s/files/1/0591/0478/8538/files/fifa_favicon.png'}" 
                 alt="${item.productName}">
          </div>
          <div class="item-info">
            <p class="item-name">${item.productName}</p>
            ${item.size ? `<p class="item-variant">Tamanho: ${item.size}</p>` : ''}
            <p class="item-quantity">Qtd: ${item.quantity}</p>
          </div>
          <div class="item-price">
            <p class="item-subtotal">${currencySymbol}${subtotalFormatted}</p>
            <p class="item-unit-price">${currencySymbol}${priceFormatted} × ${item.quantity}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detalhes do Pedido - FIFA Official Store</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; font-size: 14px; color: #333; line-height: 1.6; }
          .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
          
          /* Header */
          .header { background: white; padding: 40px; margin-bottom: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
          .header h1 { font-size: 32px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
          .order-no { font-size: 18px; color: #666; margin-bottom: 20px; font-family: monospace; }
          .status-badge { display: inline-block; padding: 10px 24px; border-radius: 50px; font-size: 16px; font-weight: 600; }
          .status-success { background: #10b981; color: white; }
          .status-pending { background: #f59e0b; color: white; }
          .status-failed { background: #ef4444; color: white; }
          
          /* Content Layout */
          .content { display: flex; gap: 30px; align-items: flex-start; }
          .main-content { flex: 1; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .sidebar { width: 380px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px; }
          
          /* Cards */
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .card-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0066cc; }
          
          /* Items */
          .item-row { display: grid; grid-template-columns: 100px 1fr 150px; gap: 24px; padding: 24px 0; border-bottom: 1px solid #e5e7eb; align-items: center; }
          .item-row:last-child { border-bottom: none; }
          .item-image img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
          .item-name { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
          .item-variant, .item-quantity { font-size: 14px; color: #666; margin: 4px 0; }
          .item-subtotal { font-size: 20px; font-weight: 700; color: #0066cc; text-align: right; }
          .item-unit-price { font-size: 13px; color: #999; text-align: right; margin-top: 4px; }
          
          /* Summary */
          .summary-row { display: flex; justify-content: space-between; padding: 14px 0; font-size: 15px; }
          .summary-row.subtotal { border-bottom: 2px solid #e5e7eb; }
          .summary-row.total { border-top: 3px solid #0066cc; padding-top: 20px; margin-top: 12px; }
          .summary-label { color: #666; }
          .summary-value { font-weight: 600; color: #1a1a1a; }
          .summary-row.total .summary-label { font-size: 20px; font-weight: 700; }
          .summary-row.total .summary-value { font-size: 24px; font-weight: 700; color: #0066cc; }
          
          /* Info Grid */
          .info-grid { display: grid; gap: 16px; }
          .info-item { padding: 12px 0; }
          .info-label { font-size: 13px; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 16px; color: #1a1a1a; font-weight: 500; }
          
          /* Footer */
          .footer { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; margin-top: 40px; }
          
          /* Mobile Responsive */
          @media (max-width: 768px) {
            .container { padding: 20px 12px; }
            .header { padding: 24px 20px; margin-bottom: 16px; }
            .header h1 { font-size: 24px; }
            .order-no { font-size: 14px; }
            .status-badge { font-size: 13px; padding: 8px 16px; }
            .content { flex-direction: column; gap: 16px; }
            .main-content { padding: 20px; }
            .card-title { font-size: 18px; margin-bottom: 16px; }
            .sidebar { width: 100%; }
            .card { padding: 20px; }
            
            /* Mobile Items - Simplified */
            .item-row { grid-template-columns: 70px 1fr; gap: 12px; padding: 16px 0; }
            .item-image img { width: 70px; height: 70px; }
            .item-name { font-size: 15px; }
            .item-price { grid-column: 1 / -1; text-align: left !important; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
            .item-subtotal { font-size: 16px; text-align: left !important; }
            .item-unit-price { font-size: 12px; text-align: left !important; }
            
            /* Mobile Summary - Compact */
            .summary-row.total .summary-label, .summary-row.total .summary-value { font-size: 18px; }
            
            /* Mobile Delivery - Show Only Key Info */
            .card-delivery .info-item:nth-child(n+5) { display: none; }
            .info-label { font-size: 12px; }
            .info-value { font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Detalhes do Pedido</h1>
            <div class="order-no">${order.orderNo}</div>
            <span class="status-badge ${order.paymentStatus === 2 ? 'status-success' : order.paymentStatus === 0 ? 'status-pending' : 'status-failed'}">
              ${orderStatusText}
            </span>
          </div>

          <div class="content">
            <div class="main-content">
              <h2 class="card-title">🛍️ Itens do Pedido</h2>
              ${itemsHtml}
            </div>

            <div class="sidebar">
              <div class="card">
                <h2 class="card-title">💰 Resumo</h2>
                <div class="summary-row subtotal">
                  <span class="summary-label">Subtotal</span>
                  <span class="summary-value">${currencySymbol}${subtotalAmountFormatted}</span>
                </div>
                ${order.shippingAmount > 0 ? `<div class="summary-row"><span class="summary-label">Envio</span><span class="summary-value">${currencySymbol}${shippingAmountFormatted}</span></div>` : ''}
                ${order.taxAmount > 0 ? `<div class="summary-row"><span class="summary-label">Impostos</span><span class="summary-value">${currencySymbol}${taxAmountFormatted}</span></div>` : ''}
                ${order.discountAmount > 0 ? `<div class="summary-row"><span class="summary-label">Desconto</span><span class="summary-value" style="color: #10b981;">-${currencySymbol}${discountAmountFormatted}</span></div>` : ''}
                <div class="summary-row total">
                  <span class="summary-label">Total</span>
                  <span class="summary-value">${currencySymbol}${totalAmountFormatted}</span>
                </div>
              </div>

              ${order.paidAt ? `
              <div class="card">
                <h2 class="card-title">✅ Pagamento</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Método</div>
                    <div class="info-value">${order.paymentMethod || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Data</div>
                    <div class="info-value">${new Date(order.paidAt).toLocaleString('pt-BR')}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Valor Pago</div>
                    <div class="info-value" style="color: #0066cc; font-weight: 700; font-size: 20px;">${currencySymbol}${(order.paidAmount / 100).toFixed(2)}</div>
                  </div>
                </div>
              </div>
              ` : ''}

              <div class="card card-delivery">
                <h2 class="card-title">📋 Entrega</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Nome</div>
                    <div class="info-value">${deliver.recipientName || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Telefone</div>
                    <div class="info-value">${deliver.recipientPhone || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Endereço</div>
                    <div class="info-value">${deliver.address1 || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Cidade</div>
                    <div class="info-value">${deliver.city || '-'}  ${deliver.province || ''}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">CEP</div>
                    <div class="info-value">${deliver.postalCode || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">País</div>
                    <div class="info-value">${deliver.country || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Obrigado por comprar na FIFA Official Store!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成错误页面HTML
   */
  private generateErrorHtml(message: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro - FIFA Official Store</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .error-container { background: white; padding: 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          .error-icon { font-size: 64px; margin-bottom: 24px; }
          h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 16px; }
          p { font-size: 16px; color: #666; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 12px 32px; background: #0066cc; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500; }
          .btn:hover { background: #0052a3; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">❌</div>
          <h1>Pedido Não Encontrado</h1>
          <p>${message}</p>
          <a href="/" class="btn">Voltar à Página Inicial</a>
        </div>
      </body>
      </html>
    `;
  }
}
