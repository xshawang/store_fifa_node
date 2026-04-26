# /cart/change Endpoint Implementation

## Overview
Implemented the `/cart/change` POST endpoint to modify cart item quantities based on line index, following the Shopify cart change API pattern.

## Endpoint Details

### URL
`POST /cart/change`

### Request Parameters
```json
{
  "line": "1",
  "quantity": 2,
  "sections": ["cart-drawer", "cart-icon-bubble"],
  "sections_url": "/products/brazil-2026-away-jersey-mens"
}
```

### Parameter Description
- **line**: Cart item line number (1-based index, corresponds to database record index + 1)
- **quantity**: New quantity for the item (0 means delete the item)
- **sections**: Array of section IDs to regenerate HTML for (e.g., "cart-drawer", "cart-icon-bubble")
- **sections_url**: Product URL for reference

### Authentication
- User identity is extracted from cookies:
  - `_shopify_y`: User ID
  - `cart`: Cart token

## Implementation Details

### 1. DTO Definition (req-cart.dto.ts)
Added `ChangeCartDto` class:
```typescript
export class ChangeCartDto {
  line: string | number      // Cart line number (1-based)
  quantity: number           // New quantity (0 = delete)
  sections?: string          // Sections to regenerate
  sectionsUrl?: string       // Sections URL
}
```

### 2. Controller (cart.controller.ts)
Added `changeCart` endpoint with comprehensive response headers using `@Header()` decorators:
```typescript
@Post('/cart/change')
@Public()
@Header('Content-Type', 'application/json; charset=utf-8')
@Header('Content-Language', 'en-SG')
@Header('Cache-Control', 'no-cache, no-store')
// ... more headers
async changeCart(@Req() request: Request)
```

**Note:** Uses `@Header()` decorators instead of `@Res()` to avoid "headers already sent" errors when exceptions occur.

#### Response Headers (following scripts/res.md)
The endpoint sets the following response headers:
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
- **NEL**: Network Error Logging configuration
- **Clear-Site-Data**: `"prefetchCache", "prerenderCache"`
- **X-DC**: `gcp-asia-southeast1,gcp-asia-southeast1,gcp-asia-southeast1`

#### Cookie Handling
- Cookies (`_shopify_y`, `cart`) are extracted from the request for user identification
- **No cookies are modified or set** - they are returned as-is from the request

### 3. Service (cart.service.ts)

#### Main Method: `changeCart()`
1. Extracts user identity from cookies (`_shopify_y` and `cart`)
2. Fetches all active cart items for the user, ordered by `cartId ASC`
3. Calculates array index: `arrayIndex = line - 1`
4. Validates the index is within bounds
5. Updates or deletes the target item:
   - If `quantity === 0`: Soft delete (set status = 0)
   - Otherwise: Update quantity
6. Builds response using `buildChangeCartResponse()`

#### Helper Method: `buildChangeCartResponse()`
Constructs the response object following the format in `scripts/cart.change.md`:
- Cart summary (total price, item count, weight, etc.)
- Current cart items array
- Items added/removed arrays
- Sections HTML (cart-drawer, cart-icon-bubble)

## Response Format
```json
{
  "token": "hWNBQiNi7ELco5gFETwXyMxs?key=23aedfc66aa9cc5f5af1d990f2fd2d52",
  "note": "",
  "attributes": {},
  "original_total_price": 0,
  "total_price": 0,
  "total_discount": 0,
  "total_weight": 0.0,
  "item_count": 0,
  "items": [],
  "requires_shipping": false,
  "currency": "USD",
  "items_subtotal_price": 0,
  "cart_level_discount_applications": [],
  "discount_codes": [],
  "items_added": [],
  "items_removed": [],
  "sections": {
    "cart-drawer": "<div id=\"shopify-section-cart-drawer\">...</div>",
    "cart-icon-bubble": "<div id=\"shopify-section-cart-icon-bubble\">...</div>"
  }
}
```

## Business Logic

### Line Number Mapping
- Frontend sends `line` parameter starting from 1
- Database records are ordered by `cartId ASC`
- Array index calculation: `arrayIndex = line - 1`
- Example: `line=1` → first record (index 0)

### Quantity Update
- **quantity > 0**: Update the item's quantity field
- **quantity = 0**: Soft delete the item (set status = 0)

### Sections Generation
- Parses `sections` parameter (comma-separated string)
- Generates HTML for requested sections:
  - `cart-drawer`: Full cart drawer HTML with updated items
  - `cart-icon-bubble`: Cart icon with item count badge

## Files Modified

1. ✅ `dto/req-cart.dto.ts`
   - Added `ChangeCartDto` class

2. ✅ `cart.controller.ts`
   - Added `/cart/change` POST endpoint
   - Imported `ChangeCartDto`

3. ✅ `cart.service.ts`
   - Added `changeCart()` method
   - Added `buildChangeCartResponse()` helper method
   - Imported `ChangeCartDto`

## Testing

### Test Case 1: Update Quantity
```bash
curl -v -X POST http://localhost:3000/cart/change \
  -H "Content-Type: application/json" \
  -H "Cookie: _shopify_y=user-123; cart=token-456" \
  -d '{
    "line": "1",
    "quantity": 3,
    "sections": "cart-drawer,cart-icon-bubble",
    "sections_url": "/products/brazil-2026-away-jersey-mens"
  }'
```

### Test Case 2: Delete Item (quantity = 0)
```bash
curl -v -X POST http://localhost:3000/cart/change \
  -H "Content-Type: application/json" \
  -H "Cookie: _shopify_y=user-123; cart=token-456" \
  -d '{
    "line": "2",
    "quantity": 0,
    "sections": "cart-drawer,cart-icon-bubble",
    "sections_url": "/products/brazil-2026-away-jersey-mens"
  }'
```

### Expected Response Headers
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Language: en-SG
Cache-Control: no-cache, no-store
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
Strict-Transport-Security: max-age=7889238
Vary: Accept, accept-encoding
Content-Security-Policy: block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;
Powered-By: Shopify
Shopify-Complexity-Score: 0
NEL: {"success_fraction":0.01,"report_to":"cf-nel","max_age":604800}
Clear-Site-Data: "prefetchCache", "prerenderCache"
X-DC: gcp-asia-southeast1,gcp-asia-southeast1,gcp-asia-southeast1
```

### Expected Behavior
1. Item at specified line is updated or deleted
2. Response contains updated cart state
3. Sections HTML reflects the changes
4. `items_removed` contains deleted item (if quantity = 0)
5. Cart totals are recalculated
6. All response headers are set according to `scripts/res.md`

## Key Features

✅ **Cookie-based authentication** - Extracts user identity from `_shopify_y` and `cart` cookies  
✅ **Line-based indexing** - Maps 1-based line number to database records  
✅ **Soft delete support** - quantity=0 sets status=0 instead of hard delete  
✅ **Dynamic HTML generation** - Regenerates cart-drawer and cart-icon-bubble sections  
✅ **Shopify-compatible response** - Follows the format defined in `scripts/cart.change.md`  
✅ **Proper error handling** - Validates line index and user identity  
✅ **Sorted queries** - Always orders by `cartId ASC` for consistent line numbering  
