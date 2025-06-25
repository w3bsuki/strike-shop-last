# Authentication

Learn how to securely authenticate with the TaskFlow AI API using API keys or OAuth 2.0.

## 🔐 Authentication Methods

TaskFlow AI supports two authentication methods:

1. **API Keys** - Simple token-based authentication (recommended for server-to-server)
2. **OAuth 2.0** - Industry standard for user applications

## 🗝️ API Key Authentication

### Getting Your API Key

1. **Log in** to your TaskFlow AI account
2. **Navigate** to Settings → API Keys
3. **Click** "Generate New API Key"
4. **Configure** key settings:
   - Name (for identification)
   - Permissions scope
   - Expiration date (optional)
5. **Copy** the generated key immediately (it won't be shown again)

### Using API Keys

Include your API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer tf_sk_1234567890abcdef..." \
     https://api.taskflow.ai/v1/tasks
```

#### Key Format
```
tf_sk_[32_character_alphanumeric_string]
```

### API Key Scopes

Control what your API key can access:

#### Available Scopes

**Read Scopes**:
- `tasks:read` - View tasks
- `teams:read` - View team information
- `users:read` - View user profiles
- `analytics:read` - Access analytics data

**Write Scopes**:
- `tasks:write` - Create and modify tasks
- `teams:write` - Manage team settings
- `users:write` - Update user information
- `files:write` - Upload and manage files

**Admin Scopes**:
- `teams:admin` - Full team management
- `billing:admin` - Access billing information
- `webhooks:admin` - Manage webhook configurations

#### Scope Examples

```json
{
  "name": "Task Management Integration",
  "scopes": ["tasks:read", "tasks:write", "teams:read"],
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### Managing API Keys

#### List Your Keys

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/api-keys
```

Response:
```json
{
  "data": [
    {
      "id": "key_123",
      "name": "My App Integration",
      "scopes": ["tasks:read", "tasks:write"],
      "created_at": "2025-01-15T10:30:00Z",
      "last_used_at": "2025-01-20T14:20:00Z",
      "expires_at": null,
      "is_active": true
    }
  ]
}
```

#### Rotate Keys

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/api-keys/key_123/rotate
```

#### Revoke Keys

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/api-keys/key_123
```

## 🔄 OAuth 2.0 Authentication

### OAuth Flow Overview

TaskFlow AI implements the Authorization Code flow:

```
1. Redirect user to TaskFlow AI authorization
2. User grants permission
3. TaskFlow AI redirects back with code
4. Exchange code for access token
5. Use access token for API requests
```

### Register Your Application

1. **Go to** Settings → OAuth Applications
2. **Click** "New OAuth Application"
3. **Fill in** application details:
   - Application name
   - Description
   - Homepage URL
   - Redirect URI(s)
   - Scopes requested

4. **Save** and copy your Client ID and Secret

### Step 1: Authorization Request

Redirect users to:

```
https://app.taskflow.ai/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=tasks:read+tasks:write+teams:read&
  response_type=code&
  state=RANDOM_STATE_STRING
```

#### Parameters

- **client_id**: Your application's client ID
- **redirect_uri**: Where to redirect after authorization
- **scope**: Space-separated list of requested scopes
- **response_type**: Always `code` for authorization code flow
- **state**: Random string to prevent CSRF attacks

### Step 2: Handle Callback

After user authorization, TaskFlow AI redirects to your `redirect_uri`:

```
https://yourapp.com/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STATE_STRING
```

Verify the `state` parameter matches what you sent.

### Step 3: Exchange Code for Token

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "code": "AUTHORIZATION_CODE",
       "redirect_uri": "YOUR_REDIRECT_URI",
       "grant_type": "authorization_code"
     }' \
     https://api.taskflow.ai/v1/oauth/token
```

Response:
```json
{
  "access_token": "tf_at_1234567890abcdef...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tf_rt_0987654321fedcba...",
  "scope": "tasks:read tasks:write teams:read"
}
```

### Step 4: Use Access Token

```bash
curl -H "Authorization: Bearer tf_at_1234567890abcdef..." \
     https://api.taskflow.ai/v1/tasks
```

### Token Refresh

Access tokens expire after 1 hour. Use refresh tokens to get new access tokens:

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "refresh_token": "tf_rt_0987654321fedcba...",
       "grant_type": "refresh_token"
     }' \
     https://api.taskflow.ai/v1/oauth/token
```

## 🛡️ Security Best Practices

### API Key Security

#### Storage
- **Never** commit API keys to version control
- Use **environment variables** or secure configuration management
- Store keys in **encrypted form** when possible
- Limit key access to **necessary personnel only**

#### Usage
- Use **specific scopes** - don't request more permissions than needed
- Set **expiration dates** for keys when possible
- **Monitor usage** regularly
- **Rotate keys** periodically

#### Example: Secure Storage

```javascript
// ❌ Don't do this
const API_KEY = 'tf_sk_1234567890abcdef...';

// ✅ Do this instead
const API_KEY = process.env.TASKFLOW_API_KEY;
```

### OAuth Security

#### State Parameter
Always use the `state` parameter to prevent CSRF attacks:

```javascript
// Generate random state
const state = crypto.randomBytes(32).toString('hex');
sessionStorage.setItem('oauth_state', state);

// Include in authorization URL
const authUrl = `https://app.taskflow.ai/oauth/authorize?...&state=${state}`;
```

#### Secure Redirect URIs
- Use **HTTPS** for redirect URIs
- **Validate** redirect URIs on your server
- **Whitelist** allowed domains
- **Avoid** open redirects

#### Client Secret Protection
- **Never** expose client secrets in frontend code
- Use **backend proxy** for token exchange
- Store secrets **securely** on server
- **Rotate** secrets regularly

## ⚠️ Error Handling

### Authentication Errors

#### Invalid API Key
```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "The provided API key is invalid or has been revoked."
  }
}
```

#### Insufficient Permissions
```json
{
  "error": {
    "code": "insufficient_permissions",
    "message": "Your API key does not have the required 'tasks:write' permission."
  }
}
```

#### Token Expired
```json
{
  "error": {
    "code": "token_expired",
    "message": "The access token has expired. Please refresh your token."
  }
}
```

### OAuth Errors

#### Invalid Grant
```json
{
  "error": "invalid_grant",
  "error_description": "The authorization code has expired or is invalid."
}
```

#### Invalid Client
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed."
}
```

### Error Handling Examples

#### JavaScript/TypeScript
```javascript
async function makeAPIRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`https://api.taskflow.ai/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.error?.code === 'token_expired') {
        // Refresh token and retry
        await refreshAccessToken();
        return makeAPIRequest(endpoint, options);
      }
      
      throw new Error(`API Error: ${error.error?.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

#### Python
```python
import requests
from requests.exceptions import HTTPError

def make_api_request(endpoint, method='GET', data=None):
    url = f'https://api.taskflow.ai/v1{endpoint}'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.request(method, url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    
    except HTTPError as e:
        error_data = e.response.json()
        
        if error_data.get('error', {}).get('code') == 'token_expired':
            # Refresh token and retry
            refresh_access_token()
            return make_api_request(endpoint, method, data)
        
        raise Exception(f"API Error: {error_data.get('error', {}).get('message')}")
```

## 🔍 Testing Authentication

### Test Your API Key

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/auth/verify
```

Success Response:
```json
{
  "valid": true,
  "key_id": "key_123",
  "scopes": ["tasks:read", "tasks:write"],
  "user": {
    "id": "user_456",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### OAuth Token Info

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.taskflow.ai/v1/oauth/token/info
```

Response:
```json
{
  "valid": true,
  "expires_in": 2847,
  "scopes": ["tasks:read", "tasks:write", "teams:read"],
  "client": {
    "id": "app_789",
    "name": "My Awesome App"
  }
}
```

## 📚 Code Examples

### Full OAuth Implementation

#### Node.js Express Example

```javascript
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const CLIENT_ID = process.env.TASKFLOW_CLIENT_ID;
const CLIENT_SECRET = process.env.TASKFLOW_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// Start OAuth flow
app.get('/auth', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauth_state = state;
  
  const authUrl = new URL('https://app.taskflow.ai/oauth/authorize');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'tasks:read tasks:write');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  
  res.redirect(authUrl.toString());
});

// Handle OAuth callback
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verify state parameter
  if (state !== req.session.oauth_state) {
    return res.status(400).send('Invalid state parameter');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://api.taskflow.ai/v1/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Store tokens securely (use database in production)
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    
    res.send('Authentication successful!');
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data);
    res.status(500).send('Authentication failed');
  }
});
```

## 🆘 Troubleshooting

### Common Issues

#### API Key Not Working
1. **Check format** - Should start with `tf_sk_`
2. **Verify scopes** - Ensure key has required permissions
3. **Check expiration** - Key might have expired
4. **Validate encoding** - No extra spaces or characters

#### OAuth Redirect Mismatch
1. **Exact match required** - Redirect URI must match exactly
2. **Check protocol** - HTTP vs HTTPS
3. **Trailing slashes** - Make sure they match
4. **Query parameters** - Should not be included in registered URI

#### CORS Issues
1. **Frontend requests** - Use your backend as proxy
2. **Allowed origins** - Configure in OAuth app settings
3. **Preflight requests** - Handle OPTIONS method
4. **Headers** - Include proper CORS headers

### Getting Help

- **API Status**: [status.taskflow.ai](https://status.taskflow.ai)
- **Support Email**: [api-support@taskflow.ai](mailto:api-support@taskflow.ai)
- **Community Forum**: [community.taskflow.ai](https://community.taskflow.ai)
- **Documentation Issues**: [GitHub Issues](https://github.com/taskflow-ai/api-docs/issues)

---

Secure authentication is the foundation of great integrations! 🔐