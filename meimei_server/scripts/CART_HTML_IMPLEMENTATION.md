# Cart HTML Generation Implementation

## Overview
Implemented dynamic HTML generation for the shopping cart drawer (`/api/cartget` endpoint) that replaces static content with actual cart item data from the database.

## Implementation Details

### Endpoint
- **URL**: `/api/cartget`
- **Method**: GET
- **Content-Type**: `text/html; charset=utf-8`
- **Authentication**: Public (no JWT required)

### Service Method: `getCart()`

Located in `cart.service.ts`, this method:

1. **Extracts user info** from cookies (`cart` token and `_shopify_y` user ID)
2. **Queries cart items** from `biz_cart` table
3. **Generates dynamic HTML** for each cart item including:
   - Product image (width=300)
   - Product name and URL
   - SKU size selector with all available sizes
   - Quantity controls
   - Price display
4. **Calculates totals** (subtotal, item count)
5. **Returns complete HTML** matching Shopify Cart Drawer format

### HTML Structure

Each cart item (`<tr id="CartDrawer-Item-{index}">`) includes:

#### 1. Product Image
```html
<img class="cart-item__image" 
     src="{productImageUrl}&width=300" 
     alt="{productName}" 
     width="300" 
     height="300">
```

#### 2. Product Details
```html
<a href="{productUrl}?variant={skuId}" class="cart-item__name h4 break">
  {productName}
</a>
```

#### 3. SKU Size Selector
```html
<div class="product-option">
  <label for="Size-{skuId}:{md5Hash}">Size:</label>
  <select id="Size-{skuId}:{md5Hash}" 
          class="cart-size-select" 
          data-key="{skuId}:{md5Hash}" 
          data-index="{lineIndex}" 
          data-input-id="Drawer-quantity-{lineIndex}">
    <option value="{skuId}" data-stock="100" selected>{size}</option>
    <!-- More size options... -->
  </select>
</div>
```

**Key Features:**
- Each `sku_id` gets a fixed 32-character MD5 hash: `md5("sku_{skuId}_size_option")`
- Format: `Size-{skuId}:{md5Hash}`
- `data-stock` defaults to 100 (can be updated from inventory system)
- Currently selected size marked with `selected` attribute

#### 4. Quantity Controls
- Minus/Plus buttons
- Number input with `data-quantity-variant-id="{skuId}"`
- Remove button with trash icon

### JavaScript Functionality

The returned HTML includes JavaScript for:
1. **Size switching**: When user changes size selector
   - Removes old variant from cart
   - Adds new variant with updated size
   - Refreshes cart drawer
2. **Quantity validation**: Checks stock limits
3. **Loading states**: Shows spinner during transitions

## Usage Example

### Request
```bash
curl -X GET http://localhost:3000/api/cartget \
  -H "Cookie: cart=your_cart_token; _shopify_y=your_user_id"
```

### Response
Returns complete HTML for the cart drawer with:
- All cart items dynamically rendered
- Size selectors populated from `biz_product_sku` table
- Totals calculated
- Interactive JavaScript for size switching

## Database Queries

```sql
-- Get cart items for user
SELECT * FROM biz_cart 
WHERE token = '{cart_token}' 
  AND user_id = '{user_id}' 
  AND status = 1
ORDER BY cart_id ASC;

-- Get all SKUs for a product (to populate size selector)
SELECT * FROM biz_product_sku 
WHERE product_id = '{product_id}';
```

## Files Modified

1. ✅ `cart.controller.ts`
   - Added `/cartget` endpoint
   - Set Content-Type to `text/html; charset=utf-8`
   - Added debug logging

2. ✅ `cart.service.ts`
   - Implemented `getCart()` method
   - Added `generateCartItemHTML()` helper
   - Added `generateSkuOptionsHTML()` helper
   - Added `generateCartDrawerHTML()` helper
   - Added `createEmptyCartHTML()` for empty carts

## Key Features

### Dynamic SKU Generation
- Queries all SKUs for each product
- Generates fixed MD5 hash for each SKU ID
- Marks current size as selected
- Includes stock information

### Image Handling
- Uses product URL from cart item
- Appends `&width=300` for consistent sizing
- Sets width=300, height=300 attributes

### Price Calculation
- Calculates line total: `price × quantity`
- Calculates cart subtotal
- Formats as `$XX.XX USD`

### Empty Cart Handling
- Returns minimal HTML when no items
- Shows "0 items" in header
- Disables checkout button

## Testing

### Test with Cart Items
1. Add items to cart via `/api/cart/add`
2. Visit `/api/cartget` with valid cookies
3. Verify HTML contains:
   - All cart items
   - Correct product images
   - Size selectors with options
   - Correct prices and quantities

### Test Empty Cart
1. Clear cart or use invalid cookies
2. Visit `/api/cartget`
3. Verify returns empty cart HTML

## Next Steps

1. **Inventory Integration**: Replace hardcoded `data-stock="100"` with actual inventory
2. **Product URL Handling**: Ensure all product URLs are properly formatted
3. **Image Optimization**: Consider using dedicated image CDN URLs
4. **Caching**: Cache HTML generation for performance
5. **Error Handling**: Add better error handling for missing products/SKUs

## Notes

- The HTML structure matches the original Shopify cart drawer format
- JavaScript is included inline for size switching functionality
- CSS styles are embedded to ensure proper rendering
- All cart interactions (add/remove/update) should refresh via this endpoint
