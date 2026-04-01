# Phase 4 — Authentication & Security
### Complete Interview-Ready Notes
> Topics: JWT · Refresh Tokens · bcrypt · RBAC · Rate Limiting · CORS · Helmet.js · NoSQL Injection

---

## 1. JWT — JSON Web Tokens

### What is JWT?
JWT is a **stateless, self-contained token** used to securely transmit information between a client and server. It is **not encrypted by default** — it is **signed**, meaning the server can verify it hasn't been tampered with.

### Structure of a JWT
A JWT is 3 Base64URL-encoded parts separated by dots:

```
xxxxx.yyyyy.zzzzz
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
- `alg` → signing algorithm (HS256 = HMAC-SHA256, RS256 = RSA)

**Payload (Claims):**
```json
{
  "sub": "userId123",
  "role": "admin",
  "iat": 1716000000,
  "exp": 1716003600
}
```
- `sub` → subject (who the token is about)
- `iat` → issued at (timestamp)
- `exp` → expiry (timestamp)
- You can add custom claims like `role`, `email`, etc.
- **⚠️ Payload is NOT encrypted — do NOT store passwords or sensitive data in it.**

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```
- Server signs it with a secret key
- If anyone modifies the header or payload, the signature will no longer match → token is rejected

### How JWT Authentication Works (End-to-End Flow)

```
1. User logs in → sends { email, password }
2. Server verifies credentials against DB
3. Server creates JWT → signs with SECRET_KEY → sends back to client
4. Client stores JWT (localStorage or httpOnly cookie)
5. Client sends JWT in every request: Authorization: Bearer <token>
6. Server receives request → extracts token → verifies signature + expiry
7. If valid → process request | If invalid/expired → return 401
```

### JWT vs Sessions

| Feature | JWT (Stateless) | Sessions (Stateful) |
|---|---|---|
| Storage | Client-side | Server-side (DB/Redis) |
| Scalability | ✅ Easy (no shared state) | ❌ Needs sticky sessions or shared store |
| Revocation | ❌ Hard (token valid till expiry) | ✅ Easy (delete session from store) |
| Size | Bigger (token in every request) | Smaller (just a session ID) |
| Server memory | No load | Increases with users |

### Implementing JWT in Node.js

```js
const jwt = require('jsonwebtoken');

// Generate token
const generateToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },           // payload
    process.env.JWT_SECRET,          // secret
    { expiresIn: '15m' }             // options
  );
};

// Verify token (middleware)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // attach user data to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Common JWT Interview Questions & Exact Answers

**Q: Where should you store JWTs on the client?**
> **httpOnly cookie** is the safest. `localStorage` is vulnerable to XSS attacks — any JavaScript on the page can read it. httpOnly cookies cannot be accessed by JavaScript, only sent automatically by the browser. However, cookies are vulnerable to CSRF — you mitigate that with `SameSite=Strict` or CSRF tokens.

**Q: Can you invalidate a JWT before it expires?**
> Not natively. JWTs are stateless — once issued, they're valid until expiry. Common workarounds:
> 1. Keep a **token blacklist** in Redis — check every request (adds state, defeats the purpose slightly)
> 2. Use **short expiry times** (15 min) + refresh tokens
> 3. Change the `JWT_SECRET` — invalidates ALL tokens (nuclear option, use in breaches)

**Q: What's the difference between HS256 and RS256?**
> - **HS256** → symmetric — same secret used to sign and verify. Both parties need the secret. Simpler but riskier if secret leaks.
> - **RS256** → asymmetric — private key signs, public key verifies. More secure for distributed systems (microservices). Only the auth server needs the private key.

**Q: What happens if someone modifies the JWT payload?**
> The signature becomes invalid. When the server tries to verify it using the secret + the modified payload, the computed signature won't match the one in the token → request is rejected with 401.

---

## 2. Refresh Tokens

### Why Do We Need Refresh Tokens?
Access tokens should be **short-lived** (15 min) to limit damage if stolen. But you don't want users to log in every 15 minutes. Refresh tokens solve this:
- **Access Token** → short-lived (15 min), used to access protected routes
- **Refresh Token** → long-lived (7–30 days), used only to get a new access token

### How the Refresh Token Flow Works

```
1. Login → Server issues: { accessToken (15min), refreshToken (7 days) }
2. Store accessToken in memory (JS variable), refreshToken in httpOnly cookie
3. User makes API calls with accessToken
4. accessToken expires → client sends refreshToken to /auth/refresh
5. Server verifies refreshToken → issues new accessToken
6. If refreshToken is also expired → force re-login
```

### Why Store Refresh Token in httpOnly Cookie?
- If stored in localStorage → XSS can steal it
- httpOnly cookie → JavaScript can't read it, browser sends it automatically

### Refresh Token Rotation (Security Best Practice)
Every time a refresh token is used, **issue a new one and invalidate the old one**. Store refresh tokens in DB/Redis. If a stolen refresh token is used after the legitimate user already used it → server detects reuse → revoke ALL tokens for that user (breach detected).

### Implementation

```js
const crypto = require('crypto');

// In login handler
const accessToken = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
const refreshToken = crypto.randomBytes(64).toString('hex');

// Save refresh token to DB (hashed)
const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

// Send refresh token as httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});

res.json({ accessToken });

// In /auth/refresh handler
const { refreshToken } = req.cookies;
if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

const user = await User.findOne({ /* ... */ });
const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
if (!isValid) return res.status(403).json({ message: 'Invalid refresh token' });

const newAccessToken = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
res.json({ accessToken: newAccessToken });
```

### Common Refresh Token Interview Questions

**Q: Why keep the access token short-lived?**
> If an access token is stolen, the attacker can only use it for a short window (15 min). With long-lived tokens, a stolen token is a disaster for days.

**Q: What is refresh token rotation?**
> Each use of a refresh token issues a new one and voids the old one. If the old one is used again, it signals reuse (theft) → invalidate the entire session.

**Q: What is a silent refresh?**
> Client-side pattern — before the access token expires, the frontend automatically calls `/auth/refresh` in the background using the httpOnly cookie, gets a new access token, and updates its in-memory value. User never sees a "logged out" screen.

---

## 3. bcrypt — Password Hashing

### Why Not MD5 or SHA256 for Passwords?
- MD5 / SHA256 are **fast hashing algorithms** — designed for speed
- Fast = bad for passwords → attacker can brute-force millions of hash combinations per second
- **bcrypt is intentionally slow** → designed for password hashing, adjustable cost factor makes it future-proof

### How bcrypt Works

```
password + salt → bcrypt hash
```

1. **Salt** → random string generated per password. Even if two users have the same password, their hashes are different.
2. **Cost factor (work factor)** → controls how many iterations (2^cost). Higher cost = slower = harder to brute-force. Default is 10. Production use 10–12.
3. **Output** → single string that contains the algorithm, cost, salt, and hash: `$2b$10$...`

### bcrypt vs MD5 vs SHA256

| | bcrypt | MD5 | SHA256 |
|---|---|---|---|
| Speed | Slow (intentional) | Very fast | Very fast |
| Salt | Built-in | Manual | Manual |
| For passwords | ✅ Best choice | ❌ Never use | ❌ Not suitable |
| Brute-force resistance | ✅ High | ❌ None | ❌ Weak |

### Implementation

```js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Hashing (on registration)
const hashPassword = async (plainPassword) => {
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
  // e.g. "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
};

// Comparing (on login)
const verifyPassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;  // true or false
};

// In registration route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hashedPassword });
  res.status(201).json({ message: 'User created' });
});

// In login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

  // generate and send JWT...
});
```

**⚠️ Important:** Always return the SAME error message whether email is wrong OR password is wrong: `"Invalid credentials"`. Never say `"Email not found"` — that leaks which emails are registered (user enumeration attack).

### Common bcrypt Interview Questions

**Q: What is a salt and why does bcrypt use it?**
> A salt is a random unique string added to the password before hashing. It ensures identical passwords produce different hashes, making rainbow table attacks useless. bcrypt generates and stores the salt automatically as part of the hash output.

**Q: If cost factor 10 is fine now, what about in 5 years when hardware is faster?**
> Increase the cost factor. When a user logs in successfully, check if their stored hash uses the old cost factor → re-hash their password with the new cost factor and update in DB. This is called **progressive rehashing**.

**Q: bcrypt has a 72-byte limit. What do you do for long passwords?**
> Pre-hash the password with SHA256 first, then pass to bcrypt. Or just enforce a max password length < 72 chars (common approach). Argon2 is an alternative without this limit.

**Q: Why is bcrypt.compare timing-safe?**
> It uses constant-time comparison to prevent timing attacks — where an attacker measures response time to guess how much of the hash matched.

---

## 4. RBAC — Role-Based Access Control

### What is RBAC?
RBAC is an access control pattern where permissions are tied to **roles**, and users are assigned **roles** — not individual permissions. This makes permission management scalable.

```
User → has a Role → Role → has Permissions → Permissions → allow/deny Actions
```

Example:
- **Admin** → can create, read, update, delete users + posts
- **Editor** → can create, read, update posts only
- **User** → can only read posts

### Implementation Strategy

**Step 1: Store role in user model**
```js
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'editor', 'admin'],
    default: 'user'
  }
});
```

**Step 2: Include role in JWT payload**
```js
const token = jwt.sign(
  { sub: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);
```

**Step 3: Create role-checking middleware**
```js
// Reusable middleware factory
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient role' });
    }
    next();
  };
};

// Usage
router.delete('/users/:id', verifyToken, authorize('admin'), deleteUser);
router.put('/posts/:id', verifyToken, authorize('admin', 'editor'), updatePost);
router.get('/posts', verifyToken, authorize('admin', 'editor', 'user'), getPosts);
```

### 401 vs 403 — Critical Difference

| Code | Meaning | When to Use |
|---|---|---|
| 401 | Unauthorized | User is not authenticated (no token / bad token) |
| 403 | Forbidden | User is authenticated but doesn't have permission |

**Q: A logged-in user tries to access an admin route. What do you return?**
> 403 Forbidden — they're authenticated (we know who they are), but they don't have the required role.

### Permission-Based RBAC (Advanced)

Instead of hardcoding roles in middleware, store permissions in a map:

```js
const permissions = {
  admin:  ['create:user', 'delete:user', 'create:post', 'delete:post', 'read:post'],
  editor: ['create:post', 'update:post', 'read:post'],
  user:   ['read:post']
};

const hasPermission = (role, requiredPermission) => {
  return permissions[role]?.includes(requiredPermission) ?? false;
};

// Middleware
const can = (permission) => (req, res, next) => {
  if (!hasPermission(req.user.role, permission)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

router.delete('/posts/:id', verifyToken, can('delete:post'), deletePost);
```

### Common RBAC Interview Questions

**Q: What's the difference between authentication and authorization?**
> **Authentication** → verifying WHO you are (login with credentials, verify JWT). **Authorization** → determining WHAT you're allowed to do (checking role/permissions). Authentication always comes before authorization.

**Q: How do you prevent privilege escalation?**
> 1. Never trust role data from the client — always read from the JWT (which is server-signed) or re-fetch from DB
> 2. Validate role on every protected request, not just at login
> 3. Users should not be able to update their own role field
> 4. Audit logs for admin actions

**Q: What is the principle of least privilege?**
> Every user/service should have the minimum permissions needed to do their job and nothing more. If an editor only needs to update posts, they should not have delete permission.

---

## 5. Rate Limiting

### What is Rate Limiting?
A technique to **limit how many requests** a client can make to your API in a given time window. Prevents:
- Brute-force attacks (trying thousands of passwords)
- DDoS attacks (flooding the server)
- API abuse / scraping
- Exceeding third-party API quotas

### Types of Rate Limiting

| Type | Description |
|---|---|
| **Fixed Window** | N requests per time window (e.g. 100 req/15 min). Resets at window boundary — vulnerable to burst at boundary |
| **Sliding Window** | Tracks requests in a rolling time window — smoother, no boundary burst |
| **Token Bucket** | Tokens refill at steady rate. Allows short bursts within limit |
| **Leaky Bucket** | Requests processed at a fixed rate — queue-based, very smooth |

### Implementation with `express-rate-limit`

```js
const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window per IP
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});

// Strict limiter for auth routes (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Only 5 login attempts per 15 min
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
```

### Redis-Based Rate Limiting (Production)

Default `express-rate-limit` uses in-memory store → doesn't work across multiple server instances. In production with multiple servers, use Redis store:

```js
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

const redisClient = createClient({ url: process.env.REDIS_URL });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});
```

### Rate Limit Response Headers
When rate limit is active, the server sends these headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1716003600  (Unix timestamp when window resets)
Retry-After: 900             (seconds to wait)
```
HTTP Status code: **429 Too Many Requests**

### Common Rate Limiting Interview Questions

**Q: Why does rate limiting fail in a multi-server setup if you use in-memory store?**
> Each server has its own memory — counts are not shared. If you have 3 servers, a user can send 3x the limit by hitting different servers. Use a shared store like Redis so all servers check the same counter.

**Q: How do you identify clients for rate limiting?**
> By default, by IP address. For authenticated routes, by `userId` from the JWT — more accurate because multiple users can share an IP (office network, NAT). Combine both for best results.

**Q: At what HTTP status code does a rate limit response come?**
> **429 Too Many Requests**, with a `Retry-After` header telling the client when to retry.

---

## 6. CORS — Cross-Origin Resource Sharing

### What is CORS?
CORS is a **browser security mechanism**. Browsers enforce a **Same-Origin Policy** — a webpage at `http://a.com` cannot make requests to `http://b.com` unless `b.com` explicitly allows it through CORS headers.

**Origin = Protocol + Domain + Port**
- `http://localhost:3000` and `http://localhost:5000` → **different origins** (different port)
- `http://example.com` and `https://example.com` → **different origins** (different protocol)

### Why Does CORS Only Affect Browsers?
CORS is enforced by browsers to protect users from malicious websites making unauthorized requests on their behalf. Tools like Postman, curl, and server-to-server calls are NOT affected by CORS — they don't have the browser's same-origin enforcement.

### How CORS Works

**Simple Request:**
```
Browser → GET /api/users → Server
         Origin: http://frontend.com

Server → Response
         Access-Control-Allow-Origin: http://frontend.com  ← browser allows it
```

**Preflight Request (OPTIONS):**
For non-simple requests (POST with JSON, PUT, DELETE, custom headers), the browser first sends an **OPTIONS preflight** to check if the server allows it:
```
Browser → OPTIONS /api/users
          Origin: http://frontend.com
          Access-Control-Request-Method: POST
          Access-Control-Request-Headers: Content-Type, Authorization

Server → 200 OK
         Access-Control-Allow-Origin: http://frontend.com
         Access-Control-Allow-Methods: GET, POST, PUT, DELETE
         Access-Control-Allow-Headers: Content-Type, Authorization
         Access-Control-Max-Age: 86400  ← cache preflight for 24 hours
```

### Implementation with `cors` package

```js
const cors = require('cors');

// Development — allow all origins (NOT for production)
app.use(cors());

// Production — whitelist specific origins
const allowedOrigins = [
  'https://myapp.com',
  'https://www.myapp.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Required if frontend sends cookies/auth headers
  maxAge: 86400       // Cache preflight for 24 hours
}));
```

**⚠️ `credentials: true` requires `origin` to be a specific origin — NOT `*`**

### CORS Headers Reference

| Header | Direction | Purpose |
|---|---|---|
| `Access-Control-Allow-Origin` | Server → Browser | Which origins are allowed |
| `Access-Control-Allow-Methods` | Server → Browser | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | Server → Browser | Which request headers are allowed |
| `Access-Control-Allow-Credentials` | Server → Browser | Whether cookies can be sent |
| `Access-Control-Max-Age` | Server → Browser | How long to cache preflight response |

### Common CORS Interview Questions

**Q: What is a preflight request and when is it triggered?**
> A preflight is an HTTP OPTIONS request automatically sent by the browser before the actual request, to check if the server allows the cross-origin request. It's triggered for: non-GET/POST methods, POST with Content-Type other than `application/x-www-form-urlencoded`, or any custom request headers like `Authorization`.

**Q: Why does CORS not protect against Postman/curl attacks?**
> CORS is enforced by browsers only. Postman and curl don't implement same-origin policy. CORS protects against malicious websites making requests on behalf of users. It's not a substitute for authentication — you still need JWT/auth middleware to protect your API.

**Q: What's wrong with `Access-Control-Allow-Origin: *` in production?**
> `*` allows any website to make requests to your API, which is a security risk if your API uses cookies or sensitive data. It also can't be used with `credentials: true`. Always whitelist specific origins in production.

**Q: The CORS error is shown in the browser — is it a backend problem or frontend problem?**
> It's a **backend problem**. The server needs to send the correct CORS headers. The browser just enforces the policy based on those headers.

---

## 7. Helmet.js

### What is Helmet?
Helmet is an Express middleware that sets **security-related HTTP response headers** automatically. By default, Express sets no security headers — Helmet adds a layer of protection against common web vulnerabilities with zero custom code.

### What Headers Does Helmet Set?

```js
const helmet = require('helmet');
app.use(helmet()); // applies all defaults
```

| Header Set by Helmet | What It Prevents |
|---|---|
| `Content-Security-Policy (CSP)` | XSS attacks — restricts where scripts/styles can load from |
| `X-Content-Type-Options: nosniff` | MIME type sniffing — browser won't guess content type |
| `X-Frame-Options: SAMEORIGIN` | Clickjacking — prevents your page being embedded in an iframe |
| `Strict-Transport-Security (HSTS)` | Forces HTTPS — browser won't allow HTTP for your domain |
| `X-XSS-Protection: 0` | Disables broken old browser XSS filter (it could be exploited) |
| `Referrer-Policy` | Controls how much referrer info is sent in requests |
| `Permissions-Policy` | Disables browser features like camera/mic/geolocation unless needed |
| `Cross-Origin-Embedder-Policy` | Prevents cross-origin resource leaks |

### Usage

```js
const helmet = require('helmet');

// Apply all defaults (recommended starting point)
app.use(helmet());

// Customizing CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:"],
    },
  },
  // Disable HSTS in development (since localhost isn't HTTPS)
  hsts: process.env.NODE_ENV === 'production'
}));
```

### Common Helmet Interview Questions

**Q: What is clickjacking and how does Helmet prevent it?**
> Clickjacking is when an attacker embeds your page in a hidden iframe and tricks users into clicking buttons on your page. Helmet sets `X-Frame-Options: SAMEORIGIN` which tells browsers not to render your page inside iframes from different origins.

**Q: What is HSTS?**
> HTTP Strict Transport Security. Once set, it tells the browser to always use HTTPS for your domain — even if the user types `http://`. Browsers cache this for a specified `maxAge` and refuse HTTP connections. Protects against SSL stripping attacks.

**Q: What is Content Security Policy (CSP)?**
> CSP tells the browser which sources are trusted to load scripts, styles, fonts, images etc. Blocks inline scripts and external malicious scripts. Most powerful XSS prevention header. Example: `script-src 'self'` means only load scripts from your own domain.

**Q: Why should Helmet be placed before your routes?**
> Middleware order matters in Express. Headers must be set before the response is sent. If Helmet comes after a route handler that already sent a response, those security headers won't be set for that response.

---

## 8. NoSQL Injection Prevention

### What is NoSQL Injection?
Similar to SQL injection but targeting NoSQL databases like MongoDB. An attacker manipulates query operators in request data to bypass authentication or extract unauthorized data.

### Example of a NoSQL Injection Attack

**Vulnerable login code:**
```js
const user = await User.findOne({
  email: req.body.email,
  password: req.body.password
});
```

**Malicious request body:**
```json
{
  "email": { "$gt": "" },
  "password": { "$gt": "" }
}
```

`$gt: ""` means "greater than empty string" → matches ALL users → attacker bypasses login entirely and gets the first user in the DB, which is often the admin.

### Prevention Techniques

**1. `express-mongo-sanitize` (Best First Defense)**
```js
const mongoSanitize = require('express-mongo-sanitize');

// Strips any keys that start with $ or contain .
app.use(mongoSanitize());

// Replaces prohibited chars with _ instead of removing
app.use(mongoSanitize({ replaceWith: '_' }));
```

**2. Validate & type-check inputs with Joi or Zod**
```js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// In route
const { error, value } = loginSchema.validate(req.body);
if (error) return res.status(400).json({ message: error.details[0].message });
```
If `email` is supposed to be a string, and an object `{ $gt: "" }` is passed, Joi rejects it immediately.

**3. Use Mongoose models (typed schemas)**
Mongoose schemas enforce types. If `email` is defined as `String`, MongoDB won't accept an object query operator for it.

**4. Never use `eval()`, `$where`, or raw user input in queries**
```js
// NEVER DO THIS
Model.find({ $where: `this.name === '${req.query.name}'` });
```
`$where` executes JavaScript inside MongoDB → extreme injection risk. Never use it with user input.

**5. Sanitize query parameters too**
```js
// Sanitize req.query and req.params as well
app.use(mongoSanitize({
  allowDots: true,
  replaceWith: '_'
}));
```

### Other Common Security Vulnerabilities & Fixes

**XSS (Cross-Site Scripting)**
- Attacker injects malicious script into your data that gets rendered in another user's browser
- Prevention: escape output, use CSP (Helmet), never use `innerHTML` with user data, use `DOMPurify` on frontend

**Parameter Pollution**
```js
// GET /users?role=user&role=admin
// express-query-pollution or check typeof before using
const hpp = require('hpp');
app.use(hpp());
```

**Mass Assignment**
```js
// NEVER do this — user can set any field including role: "admin"
await User.findByIdAndUpdate(req.params.id, req.body);

// DO THIS — whitelist allowed fields
const { name, email } = req.body;
await User.findByIdAndUpdate(req.params.id, { name, email });
```

### Complete Security Middleware Stack (Production Setup)

```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));

// 3. Body parsing
app.use(express.json({ limit: '10kb' }));  // limit body size (prevent large payload attacks)
app.use(express.urlencoded({ extended: true }));

// 4. Rate limiting
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 5. NoSQL injection sanitization
app.use(mongoSanitize());

// 6. HTTP parameter pollution
app.use(hpp());

// 7. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
```

---

## 9. Common Combined Interview Questions

**Q: Walk me through a complete login flow with security best practices.**
> 1. Client sends `{ email, password }` over HTTPS
> 2. Validate input with Joi/Zod — reject malformed data
> 3. Sanitize with `mongoSanitize` — prevent NoSQL injection
> 4. Rate limit the endpoint — prevent brute-force
> 5. Find user by email
> 6. Return same error message whether email or password is wrong (prevent user enumeration)
> 7. Compare password with `bcrypt.compare()`
> 8. Generate short-lived JWT accessToken + random refresh token
> 9. Hash and store refresh token in DB
> 10. Send refresh token as httpOnly cookie, access token in response body
> 11. Client stores access token in memory (not localStorage)

**Q: How do you secure an Express REST API end-to-end?**
> - Helmet for security headers
> - CORS whitelist
> - HTTPS only (HSTS)
> - Input validation (Joi/Zod)
> - NoSQL sanitization
> - JWT auth + refresh tokens
> - RBAC middleware for authorization
> - Rate limiting per IP + per user
> - Body size limit
> - Proper error messages that don't leak stack traces
> - Environment variables for secrets (never hard-coded)
> - Dependencies regularly updated (npm audit)

**Q: Difference between hashing, encryption, and encoding?**
> - **Hashing** → one-way, cannot reverse (bcrypt, SHA256). For passwords and data integrity.
> - **Encryption** → two-way with a key, can decrypt (AES, RSA). For sensitive data that must be retrieved.
> - **Encoding** → not security, just format conversion (Base64, URL encoding). Anyone can decode it.

**Q: What is the difference between `Authentication` and `Authorization`?**
> **Authentication** = verifying identity (who are you? → verified via JWT/session/password)
> **Authorization** = verifying permissions (what can you do? → checked via RBAC/permissions)
> A user can be authenticated but not authorized (403), or neither (401).

**Q: What is HTTPS and why is it required even with JWT?**
> HTTPS = HTTP + TLS encryption. Even if JWT is signed (not encrypted), the payload travels in the request headers. Without HTTPS, a man-in-the-middle attacker can read and steal the JWT from network traffic. HTTPS encrypts the entire request/response including headers.

**Q: What is OWASP Top 10?**
> The Open Web Application Security Project's list of the most critical web security risks. Relevant ones for backend:
> - **A01: Broken Access Control** → RBAC misconfiguration, missing authorization checks
> - **A02: Cryptographic Failures** → storing passwords in plaintext, weak hashing (MD5)
> - **A03: Injection** → SQL/NoSQL injection, XSS
> - **A07: Identification & Auth Failures** → weak passwords, no rate limiting, improper JWT handling
> - **A09: Security Logging Failures** → no audit logs for sensitive operations

---

## 10. Quick Reference — Packages Summary

| Package | Purpose | Install |
|---|---|---|
| `jsonwebtoken` | Create and verify JWTs | `npm i jsonwebtoken` |
| `bcrypt` | Hash passwords | `npm i bcrypt` |
| `cors` | CORS headers | `npm i cors` |
| `helmet` | Security HTTP headers | `npm i helmet` |
| `express-rate-limit` | Rate limiting | `npm i express-rate-limit` |
| `rate-limit-redis` | Redis store for rate limiter | `npm i rate-limit-redis` |
| `express-mongo-sanitize` | NoSQL injection prevention | `npm i express-mongo-sanitize` |
| `hpp` | HTTP parameter pollution prevention | `npm i hpp` |
| `joi` | Input validation | `npm i joi` |
| `zod` | Input validation (TypeScript-friendly) | `npm i zod` |
| `cookie-parser` | Parse cookies in Express | `npm i cookie-parser` |

---

## 11. `.env` Variables for Phase 4

```env
JWT_SECRET=your_super_long_random_secret_here_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

ALLOWED_ORIGIN=http://localhost:3000

NODE_ENV=development

REDIS_URL=redis://localhost:6379
```

**JWT_SECRET best practice:** Use a cryptographically random string of at least 256 bits.
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---


