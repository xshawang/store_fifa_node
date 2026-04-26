# /cart/checkout Endpoint Implementation

## Overview
Implemented the `/cart/checkout` POST endpoint to retrieve checkout information for the settlement/checkout page. This endpoint fetches cart items from the `biz_cart` table based on user identity from cookies and returns a comprehensive checkout data structure compatible with the Shopify checkout flow.

## Endpoint Details

### URL
`POST /cart/checkout`

### Request
No body parameters required. User identity is extracted from cookies.

### Authentication
- User identity is extracted from cookies:
  - `_shopify_y`: User ID
  - `cart`: Cart token
  - `cart_currency`: Currency (optional, defaults to 'USD')

## Implementation Details

### 1. DTO Definition (req-cart.dto.ts)
Added `CheckoutDto` class (for future extensibility):
```typescript
export class CheckoutDto {
  token?: string  // checkout token (optional)
}
```

### 2. Controller (cart.controller.ts)
Added `getCheckout` endpoint with comprehensive response headers:
```typescript
@Post('/cart/checkout')
@Public()
@Header('Content-Type', 'application/json; charset=utf-8')
@Header('Content-Language', 'en-SG')
// ... more security and Shopify headers
async getCheckout(@Req() request: Request)
```

#### Response Headers
All headers follow the specification in `scripts/res.md`:
- **Content-Type**: `application/json; charset=utf-8`
- **Content-Language**: `en-SG`
- **Cache-Control**: `no-cache, no-store`
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **X-Download-Options**: `noopen`
- **X-Permitted-Cross-Domain-Policies**: `none`
- **Strict-Transport-Security**: `max-age=7889238`
- **Vary**: `Accept, accept-encoding`
- **Content-Security-Policy**: `block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;`
- **Powered-By**: `Shopify`
- **Shopify-Complexity-Score**: `0`

### 3. Service (cart.service.ts)

#### Main Method: `getCheckoutInfo()`

**Process Flow:**
1. Extracts user identity from cookies (`_shopify_y`, `cart`, `cart_currency`)
2. Validates that both token and userId exist
3. Fetches all active cart items for the user from `biz_cart` table
4. Orders records by `cartId ASC` for consistent ordering
5. Validates that cart is not empty
6. Builds comprehensive checkout data structure including:
   - Line items with full product details
   - Pricing information (subtotal, total, tax, shipping)
   - Currency and locale information
   - Payment URLs and checkout metadata

#### Response Data Structure

The endpoint returns a Shopify-compatible checkout object with the following key fields:

**Basic Information:**
```json
{
  "token": "cart-token-from-cookie",
  "cart_token": "cart-token-from-cookie",
  "currency": "USD",
  "presentment_currency": "USD",
  "customer_locale": "en-SG",
  "name": "#1234567890",
  "source": "web"
}
```

**Line Items Array:**
Each line item contains:
```json
{
  "id": 123,                      // cartId from database
  "key": "variantId:md5hash",     // unique key
  "variant_id": 41356759171130,
  "product_id": 7529165488186,
  "title": "USA 2026 Home Jersey - Men's",
  "variant_title": "Large",
  "quantity": 2,
  "grams": 200,
  "price": 10000,                 // price in cents
  "line_price": 20000,            // quantity * price
  "url": "/products/usa-2026-home-jersey?variant=41356759171130",
  "image": "https://...",
  "requires_shipping": true,
  "gift_card": false,
  "discounts": [],
  "properties": {}
}
```

**Pricing Information:**
```json
{
  "subtotal_price": 20000,        // in cents
  "total_price": 20000,           // in cents
  "total_tax": 0,
  "total_discounts": 0,
  "total_weight": 400,            // in grams
  "payment_due": 20000,
  "original_total_price": 20000
}
```

**Money Sets (Shopify format):**
```json
{
  "total_price_set": {
    "shop_money": { "amount": "200.00", "currency_code": "USD" },
    "presentment_money": { "amount": "200.00", "currency_code": "USD" }
  },
  "subtotal_price_set": { ... },
  "total_tax_set": { ... },
  "total_discount_set": { ... }
}
```

**URLs:**
```json
{
  "payment_url": "/checkouts/cart-token",
  "web_url": "/checkouts/cart-token"
}
```

**Null Fields (for completed checkout flow):**
- `order_id`: null
- `order_status_url`: null
- `order`: null
- `billing_address`: null
- `shipping_address`: null
- `customer`: null
- `completed_at`: null
- `closed_at`: null

## Business Logic

### Data Retrieval
1. **Cookie Extraction**: Reads `_shopify_y`, `cart`, and `cart_currency` from request cookies
2. **Database Query**: Fetches from `biz_cart` table with conditions:
   - `token` = cart cookie value
   - `userId` = _shopify_y cookie value
   - `status` = 1 (active items only)
   - Order by `cartId ASC`

### Price Calculation
- All prices stored in database are in dollars
- Converted to cents for Shopify compatibility: `priceInCents = Math.round(price * 100)`
- Line price: `linePrice = priceInCents * quantity`
- Subtotal: Sum of all line prices
- Total: Currently equals subtotal (tax and shipping can be added later)

### Weight Calculation
- Default weight: 200 grams per item
- Total weight: `200 * quantity` for each item, summed across all items

### Currency Handling
- Reads `cart_currency` cookie
- Defaults to 'USD' if not present
- Used for all money set objects

## Files Modified

1. ✅ `dto/req-cart.dto.ts`
   - Added `CheckoutDto` class

2. ✅ `cart.controller.ts`
   - Added `/cart/checkout` POST endpoint
   - Imported `CheckoutDto`
   - Set comprehensive response headers

3. ✅ `cart.service.ts`
   - Added `getCheckoutInfo()` method
   - Implements full checkout data structure
   - Compatible with Shopify checkout format

## Testing

### Test with Valid Cart
```bash
curl -X POST http://localhost:3000/cart/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: _shopify_y=user-123; cart=token-456; cart_currency=USD"
```

### Expected Response (200 OK)
```json
{
  "token": "token-456",
  "cart_token": "token-456",
  "email": "",
  "currency": "USD",
  "presentment_currency": "USD",
  "customer_locale": "en-SG",
  "line_items": [
    {
      "id": 1,
      "key": "41356759171130:abc123...",
      "variant_id": 41356759171130,
      "product_id": 7529165488186,
      "title": "USA 2026 Home Jersey - Men's",
      "variant_title": "Large",
      "quantity": 2,
      "price": 10000,
      "line_price": 20000,
      ...
    }
  ],
  "subtotal_price": 20000,
  "total_price": 20000,
  "total_tax": 0,
  "payment_due": 20000,
  ...
}
```

### Test with Empty Cart (400 Error)
```bash
curl -X POST http://localhost:3000/cart/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: _shopify_y=user-123; cart=empty-token"
```

Expected response:
```json
{
  "code": 500,
  "msg": "购物车为空"
}
```

### Test without Cookies (400 Error)
```bash
curl -X POST http://localhost:3000/cart/checkout \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "code": 500,
  "msg": "无法识别用户信息"
}
```

## Key Features

✅ **Cookie-based authentication** - Extracts user identity from `_shopify_y` and `cart` cookies  
✅ **Read-only cookies** - Cookies are not modified, only read for identification  
✅ **Sorted queries** - Always orders by `cartId ASC` for consistent line item ordering  
✅ **Shopify-compatible format** - Response matches Shopify checkout API structure  
✅ **Comprehensive data** - Includes line items, pricing, URLs, and metadata  
✅ **Money set objects** - Proper Shopify money format with shop_money and presentment_money  
✅ **Proper error handling** - Validates user identity and cart contents  
✅ **Security headers** - All required headers set per `scripts/res.md`  
✅ **Extensible design** - Can easily add tax, shipping, and discount calculations  

## Future Enhancements

1. **Tax Calculation**: Integrate tax calculation service based on shipping address
2. **Shipping Methods**: Add shipping line options with different rates
3. **Discount Codes**: Support promotional codes and automatic discounts
4. **Customer Data**: Pre-fill customer information if available
5. **Address Validation**: Add shipping and billing address management
6. **Payment Gateway**: Integrate with payment providers
7. **Inventory Check**: Validate stock availability before checkout
8. **Multi-currency**: Support dynamic currency conversion

## Integration with Checkout Page

The checkout page (`meimei_ui_vue3/html/Checkout.html`) can use this endpoint to:

1. **Load Cart Items**: Display all items in the checkout summary
2. **Show Pricing**: Display subtotal, tax, shipping, and total
3. **Process Payment**: Use `payment_url` or `web_url` for payment flow
4. **Update Quantities**: Allow users to modify quantities before payment
5. **Apply Discounts**: Add discount codes to reduce total

The response structure is designed to be compatible with standard Shopify checkout flows and can be easily integrated with frontend checkout components.
