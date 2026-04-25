# Cart Endpoint Response Headers Configuration

## Overview
The `/api/cartget` endpoint now returns Shopify-like response headers to match the expected format for frontend integration.

## Response Headers

### Content Headers
```
Content-Type: text/html; charset=utf-8
Content-Language: en-SG
Content-Encoding: br (automatically added by server/proxy)
Vary: Accept, Accept-Encoding
```

### Security Headers
```
Content-Security-Policy: block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;
Strict-Transport-Security: max-age=7889238
X-Content-Type-Options: nosniff
X-Download-Options: noopen
X-Frame-Options: DENY
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 1; mode=block
```

### Shopify Headers
```
Powered-By: Shopify
Shopify-Complexity-Score: 0
Link: <https://cdn.shopify.com>; rel="preconnect", <https://cdn.shopify.com>; rel="preconnect"; crossorigin
```

### Network Error Logging (NEL)
```
NEL: {"success_fraction":0.01,"report_to":"cf-nel","max_age":604800}
```

### Cookies (Auto-generated if missing)
```
Set-Cookie: _shopify_y={uuid}; domain=.fifa.com; path=/; expires={1 year}; SameSite=Lax
Set-Cookie: localization=SG; path=/; expires={1 year}; SameSite=Lax
Set-Cookie: cart_currency=USD; path=/; expires={14 days}; SameSite=Lax
```

## Headers NOT Manually Set

These headers are automatically added by infrastructure (Cloudflare, Nginx, etc.):

- `cf-ray` - Cloudflare request ID
- `cf-cache-status` - Cloudflare cache status
- `server: cloudflare` - Server identifier
- `server-timing` - Performance metrics
- `x-request-id` - Request tracking ID
- `x-dc` - Data center info
- `alt-svc` - Alternative service (HTTP/3)

**These should NOT be manually set** as they're managed by the infrastructure layer.

## Implementation Details

### Location
File: `cart.controller.ts`
Method: `CartController.one()`

### Code Example
```typescript
@Get('/cartget')
@Public()
@Keep()
async one(@Req() request: Request, @Res({ passthrough: false }) response: any) {
  const html = await this.cartService.getCart(cookieHeader, section_id)
  
  // Set all response headers
  response.set('Content-Type', 'text/html; charset=utf-8')
  response.set('Content-Language', 'en-SG')
  response.set('X-Content-Type-Options', 'nosniff')
  // ... more headers
  
  response.send(html)
}
```

### Key Decorators
1. **`@Public()`** - Skips JWT authentication
2. **`@Keep()`** - Skips response transformation interceptor (prevents JSON wrapping)
3. **`@Res({ passthrough: false })`** - Full control over Express response

## Testing

### cURL Test
```bash
curl -v http://localhost:3000/api/cartget \
  -H "Cookie: cart=your_token; _shopify_y=your_user_id"
```

### Expected Response Headers
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Language: en-SG
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=7889238
Powered-By: Shopify
Shopify-Complexity-Score: 0
Link: <https://cdn.shopify.com>; rel="preconnect"
NEL: {"success_fraction":0.01,"report_to":"cf-nel","max_age":604800}
```

### Browser Test
Open browser DevTools → Network tab → Request `/api/cartget`
Check Response Headers section.

## Cookie Behavior

### When User Has No Cookies
The endpoint automatically sets:
1. `_shopify_y` - User identifier (1 year expiry)
2. `localization` - Region setting (1 year expiry)
3. `cart_currency` - Currency (14 days expiry)

### When User Has Existing Cookies
No new cookies are set, existing ones are preserved.

## Security Considerations

### CSP (Content Security Policy)
- **block-all-mixed-content**: Prevents loading HTTP resources on HTTPS page
- **frame-ancestors 'none'**: Prevents clickjacking (no iframe embedding)
- **upgrade-insecure-requests**: Auto-upgrades HTTP to HTTPS

### HSTS (HTTP Strict Transport Security)
- `max-age=7889238` (~91 days): Forces HTTPS for this duration

### X-Frame-Options
- `DENY`: Prevents page from being loaded in iframes

### X-Content-Type-Options
- `nosniff`: Prevents MIME type sniffing

## Troubleshooting

### Issue: Headers not appearing
**Solution**: Check if `@Keep()` decorator is present (prevents interceptor override)

### Issue: Content-Type still shows application/json
**Solution**: Ensure `@Res({ passthrough: false })` is used and `response.send()` is called

### Issue: ERR_HTTP_HEADERS_SENT error
**Solution**: This is fixed by `@Keep()` decorator which skips response transformation

## Notes

1. **Content-Encoding: br** is automatically added by compression middleware (Brotli)
2. **Cloudflare headers** (cf-*) are added by Cloudflare CDN, not by application
3. **server-timing** headers should be added by reverse proxy/load balancer
4. **etag** can be added if caching is implemented

## Future Enhancements

1. Add `etag` header for caching optimization
2. Implement `server-timing` for performance monitoring
3. Add `cache-control` header if needed
4. Implement proper `report-to` endpoint for NEL
5. Add `alt-svc` header if HTTP/3 is supported
