=== QA VALIDATOR STARTING - Sun Jul  6 03:38:23 PDT 2025 ===

=== BASELINE METRICS ===

> strike-shop@0.1.0 build
> next build

   ▲ Next.js 15.3.4
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 9.0s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/105) ...
   Generating static pages (26/105) 
   Generating static pages (52/105) 
   Generating static pages (78/105) 
 ✓ Generating static pages (105/105)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /_not-found                            265 B         102 kB
├ ƒ /(.)product/[slug]                   21.5 kB         180 kB
├ ● /[lang]                              12.3 kB         237 kB
├   ├ /en
├   ├ /bg
├   └ /ua
├ ● /[lang]/[category]                   8.51 kB         282 kB
├   ├ /en/men
├   ├ /en/women
├   ├ /en/kids
├   └ [+18 more paths]
├ ● /[lang]/account/orders               3.65 kB         120 kB
├   ├ /en/account/orders
├   ├ /bg/account/orders
├   └ /ua/account/orders
├ ƒ /[lang]/account/orders/[id]            178 B         106 kB
├ ● /[lang]/checkout                       286 B         262 kB
├   ├ /en/checkout
├   ├ /bg/checkout
├   └ /ua/checkout
├ ● /[lang]/checkout/guest               6.74 kB         191 kB
├   ├ /en/checkout/guest
├   ├ /bg/checkout/guest
├   └ /ua/checkout/guest
├ ● /[lang]/checkout/simple              6.94 kB         232 kB
├   ├ /en/checkout/simple
├   ├ /bg/checkout/simple
├   └ /ua/checkout/simple
├ ● /[lang]/checkout/success             3.42 kB         222 kB
├   ├ /en/checkout/success
├   ├ /bg/checkout/success
├   └ /ua/checkout/success
├ ● /[lang]/collections                    291 B         225 kB
├   ├ /en/collections
├   ├ /bg/collections
├   └ /ua/collections
├ ● /[lang]/privacy                        277 B         219 kB
├   ├ /en/privacy
├   ├ /bg/privacy
├   └ /ua/privacy
├ ƒ /[lang]/product/[slug]               11.4 kB         230 kB
├ ● /[lang]/search                       12.3 kB         286 kB
├   ├ /en/search
├   ├ /bg/search
├   └ /ua/search
├ ● /[lang]/shipping                       277 B         219 kB
├   ├ /en/shipping
├   ├ /bg/shipping
├   └ /ua/shipping
├ ● /[lang]/terms                          277 B         219 kB
├   ├ /en/terms
├   ├ /bg/terms
├   └ /ua/terms
├ ● /[lang]/wishlist                     1.37 kB         226 kB
├   ├ /en/wishlist
├   ├ /bg/wishlist
├   └ /ua/wishlist
├ ƒ /account                             5.63 kB         240 kB
├ ○ /admin                               5.62 kB         115 kB
├ ○ /admin/login                         5.26 kB         124 kB
├ ƒ /admin/orders                        6.01 kB         192 kB
├ ƒ /admin/orders/[id]                     178 B         106 kB
├ ○ /admin/products                      2.42 kB         151 kB
├ ○ /admin/products/add                  4.98 kB         124 kB
├ ○ /admin/users                         3.18 kB         148 kB
├ ƒ /api/account/addresses                 265 B         102 kB
├ ƒ /api/account/orders                    265 B         102 kB
├ ƒ /api/account/update                    265 B         102 kB
├ ƒ /api/analytics/errors                  265 B         102 kB
├ ƒ /api/auth/shopify/login                265 B         102 kB
├ ƒ /api/auth/shopify/register             265 B         102 kB
├ ƒ /api/auth/shopify/token                265 B         102 kB
├ ƒ /api/auth/webhook                      265 B         102 kB
├ ƒ /api/cart                              265 B         102 kB
├ ƒ /api/cart/add                          265 B         102 kB
├ ƒ /api/cart/bulk-add                     265 B         102 kB
├ ƒ /api/cart/bulk-update                  265 B         102 kB
├ ƒ /api/cart/calculate-tax                265 B         102 kB
├ ƒ /api/cart/recommendations              265 B         102 kB
├ ƒ /api/cart/remove                       265 B         102 kB
├ ƒ /api/cart/share                        265 B         102 kB
├ ƒ /api/cart/update                       265 B         102 kB
├ ƒ /api/cart/validate-inventory           265 B         102 kB
├ ƒ /api/community-fits                    265 B         102 kB
├ ƒ /api/csrf-token                        265 B         102 kB
├ ƒ /api/health                            265 B         102 kB
├ ƒ /api/health/shopify                    265 B         102 kB
├ ƒ /api/monitoring/errors                 265 B         102 kB
├ ƒ /api/monitoring/metrics                265 B         102 kB
├ ƒ /api/payments/confirm                  265 B         102 kB
├ ƒ /api/payments/create-intent            265 B         102 kB
├ ƒ /api/payments/create-payment-intent    265 B         102 kB
├ ƒ /api/recommendations                   265 B         102 kB
├ ƒ /api/reviews/[productId]               265 B         102 kB
├ ƒ /api/search                            265 B         102 kB
├ ƒ /api/tracking/interaction              265 B         102 kB
├ ƒ /api/tracking/product-view             265 B         102 kB
├ ƒ /api/webhooks/stripe                   265 B         102 kB
├ ƒ /auth/callback                         265 B         102 kB
├ ○ /cart                                1.43 kB         103 kB
├ ○ /confirm                             3.01 kB         157 kB
├ ○ /manifest.webmanifest                  265 B         102 kB
├ ○ /reset-password                      3.87 kB         157 kB
├ ○ /robots.txt                            265 B         102 kB
├ ƒ /sign-in                             4.69 kB         158 kB
├ ○ /sign-up                             4.76 kB         158 kB
└ ○ /sitemap.xml                           265 B         102 kB          1h      1y
+ First Load JS shared by all             102 kB
  ├ chunks/1684-efee6ccb50aacd97.js      46.2 kB
  ├ chunks/4bd1b696-c6d1a59df090cff0.js  53.2 kB
  └ other shared chunks (total)          2.56 kB


ƒ Middleware                             34.1 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand


=== TYPE CHECK BASELINE ===

> strike-shop@0.1.0 type-check
> tsc --noEmit


=== FILE COUNT BASELINE ===
562

=== DIRECTORY SIZE BASELINE ===
1.6G	.

=== CRITICAL FLOW VALIDATION ===
Testing critical application flows...
✅ Build validation: PASSED
✅ Type checking: PASSED
✅ File system: STABLE
✅ Dependencies: RESOLVED
