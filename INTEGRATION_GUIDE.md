# YOUNIVITY - Integration Guide

## Overview
YOUNIVITY is an academic life management platform that helps students unify their assignments, collaborate in groups, and manage their schedule. This guide explains how to integrate external services.

---

## 1. Learning Suite Integration

### Backend Integration Point
**File**: `/app/backend/server.py`
**Endpoint**: `POST /api/lms/sync`
**Function**: `sync_lms_assignments()`

### Steps to Integrate:

1. **Get API Credentials**
   - Contact Learning Suite administrators for API access
   - Obtain API key and endpoint URLs

2. **Update Backend Code**
   ```python
   # In server.py, function sync_lms_assignments()
   
   # Add Learning Suite API call
   if config.get('learning_suite_api_key'):
       import requests
       
       headers = {
           'Authorization': f"Bearer {config['learning_suite_api_key']}"
       }
       
       response = requests.get(
           'https://learningsuite.byu.edu/api/assignments',  # Update with actual endpoint
           headers=headers
       )
       
       assignments_data = response.json()
       
       # Convert and save to database
       for item in assignments_data:
           assignment = Assignment(
               user_id=current_user.id,
               title=item['name'],
               description=item['description'],
               due_date=datetime.fromisoformat(item['due_date']),
               course_name=item['course_name'],
               source='learning_suite'
           )
           # Save to database
   ```

3. **User Configuration**
   - Users add their Learning Suite API key in Settings page
   - Click "Sync LMS" button on Dashboard to fetch assignments

---

## 2. Canvas Integration

### Backend Integration Point
**File**: `/app/backend/server.py`
**Endpoint**: `POST /api/lms/sync`
**Function**: `sync_lms_assignments()`

### Steps to Integrate:

1. **Get API Credentials**
   - User generates token: Canvas → Account → Settings → New Access Token

2. **Update Backend Code**
   ```python
   # In server.py, function sync_lms_assignments()
   
   if config.get('canvas_api_key') and config.get('canvas_domain'):
       import requests
       
       headers = {
           'Authorization': f"Bearer {config['canvas_api_key']}"
       }
       
       # Get user's courses
       courses_response = requests.get(
           f"https://{config['canvas_domain']}/api/v1/courses",
           headers=headers
       )
       
       courses = courses_response.json()
       
       # Get assignments for each course
       for course in courses:
           assignments_response = requests.get(
               f"https://{config['canvas_domain']}/api/v1/courses/{course['id']}/assignments",
               headers=headers
           )
           
           assignments_data = assignments_response.json()
           
           # Convert and save to database
           for item in assignments_data:
               assignment = Assignment(
                   user_id=current_user.id,
                   title=item['name'],
                   description=item['description'],
                   due_date=datetime.fromisoformat(item['due_at']),
                   course_name=course['name'],
                   source='canvas'
               )
               # Save to database
   ```

3. **Canvas API Documentation**
   - https://canvas.instructure.com/doc/api/

---

## 3. Google OAuth Integration

### Backend Integration Point
**File**: `/app/backend/server.py`
**Endpoint**: `POST /api/auth/google`
**Function**: `google_auth()`

### Steps to Integrate:

1. **Setup Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-domain.com/auth`

2. **Install Dependencies**
   ```bash
   # Already installed:
   # google-auth
   # google-auth-oauthlib
   # google-auth-httplib2
   ```

3. **Update Backend Code**
   ```python
   from google.oauth2 import id_token
   from google.auth.transport import requests
   
   GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
   
   @api_router.post("/auth/google", response_model=Token)
   async def google_auth(auth_data: GoogleAuthData):
       try:
           # Verify the token
           idinfo = id_token.verify_oauth2_token(
               auth_data.token,
               requests.Request(),
               GOOGLE_CLIENT_ID
           )
           
           # Get user info
           email = idinfo['email']
           name = idinfo['name']
           
           # Check if user exists or create new
           user_doc = await db.users.find_one({"email": email})
           
           if user_doc:
               user = User(**user_doc)
           else:
               user = User(
                   email=email,
                   full_name=name,
                   auth_type="google"
               )
               user_doc = user.model_dump()
               user_doc['created_at'] = user_doc['created_at'].isoformat()
               await db.users.insert_one(user_doc)
           
           # Create JWT token
           access_token = create_access_token(
               data={"sub": user.id},
               expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
           )
           
           return Token(
               access_token=access_token,
               token_type="bearer",
               user=user.model_dump(mode='json')
           )
       except ValueError:
           raise HTTPException(status_code=401, detail="Invalid token")
   ```

4. **Update Frontend** (`/app/frontend/src/pages/Auth.jsx`)
   ```javascript
   import { GoogleLogin } from '@react-oauth/google';
   
   const handleGoogleAuth = async (credentialResponse) => {
       try {
           const response = await axios.post(`${API}/auth/google`, {
               token: credentialResponse.credential,
               email: credentialResponse.email,
               full_name: credentialResponse.name
           });
           
           localStorage.setItem('token', response.data.access_token);
           localStorage.setItem('user', JSON.stringify(response.data.user));
           setUser(response.data.user);
           navigate('/dashboard');
       } catch (error) {
           toast.error('Google authentication failed');
       }
   };
   ```

5. **Add Environment Variables** (`/app/backend/.env`)
   ```
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

---

## 4. BYU NetID Integration

### Backend Integration Point
**File**: `/app/backend/server.py`
**Endpoint**: `POST /api/auth/byu-netid`
**Function**: `byu_netid_auth()`

### Steps to Integrate:

1. **Contact BYU IT**
   - Request access to BYU authentication API
   - Obtain CAS/OAuth credentials
   - Get documentation for authentication flow

2. **Update Backend Code**
   ```python
   @api_router.post("/auth/byu-netid", response_model=Token)
   async def byu_netid_auth(auth_data: BYUNetIDAuth):
       # TODO: Replace with actual BYU authentication
       
       # Example CAS authentication flow:
       import requests
       
       cas_login_url = "https://cas.byu.edu/cas/login"
       
       # Authenticate with BYU CAS
       response = requests.post(
           cas_login_url,
           data={
               'username': auth_data.netid,
               'password': auth_data.password,
               'service': 'https://your-app-url.com/auth/byu/callback'
           }
       )
       
       if response.status_code == 200:
           # Extract user info from response
           # Create or get user from database
           # Return JWT token
           pass
       else:
           raise HTTPException(status_code=401, detail="Invalid credentials")
   ```

---

## 5. Advertising Integration

### Ad Placement Zones
Ad zones are already placed on every page with the class and text:
```html
<Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed p-8">
  <p className="text-center text-gray-400">Advertisement Space - Integration Ready</p>
</Card>
```

### Google AdSense Integration

1. **Get AdSense Account**
   - Sign up at https://www.google.com/adsense/
   - Get your publisher ID

2. **Add AdSense Script** (`/app/frontend/public/index.html`)
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR-PUBLISHER-ID"
        crossorigin="anonymous"></script>
   ```

3. **Replace Ad Zones**
   Create component `/app/frontend/src/components/AdUnit.jsx`:
   ```javascript
   import React, { useEffect } from 'react';
   
   const AdUnit = ({ slot, format = 'auto' }) => {
       useEffect(() => {
           try {
               (window.adsbygoogle = window.adsbygoogle || []).push({});
           } catch (e) {
               console.error('AdSense error:', e);
           }
       }, []);
       
       return (
           <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-YOUR-PUBLISHER-ID"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true">
           </ins>
       );
   };
   
   export default AdUnit;
   ```

4. **Use in Pages**
   Replace existing ad zones:
   ```javascript
   import AdUnit from '../components/AdUnit';
   
   // In your page component:
   <Card className="bg-white">
     <AdUnit slot="1234567890" />
   </Card>
   ```

---

## 6. WebSocket/Real-time Chat

### Current Implementation
- Backend: FastAPI WebSocket endpoint at `/ws/groups/{group_id}`
- Frontend: Socket.io-client connection
- Messages also work via REST API fallback

### Enhancement Options

1. **Add Typing Indicators**
   ```python
   # Backend
   @app.websocket("/ws/groups/{group_id}")
   async def websocket_endpoint(websocket: WebSocket, group_id: str):
       await manager.connect(websocket, group_id)
       try:
           while True:
               data = await websocket.receive_json()
               if data['type'] == 'typing':
                   await manager.broadcast(data, group_id)
       except WebSocketDisconnect:
           manager.disconnect(websocket, group_id)
   ```

2. **Add Read Receipts**
   - Store last read message ID per user
   - Display read status on messages

---

## 7. Database Schema

### Collections

1. **users**
   ```json
   {
     "id": "uuid",
     "email": "user@example.com",
     "full_name": "John Doe",
     "auth_type": "email|google|byu_netid",
     "hashed_password": "...",
     "created_at": "2024-01-01T00:00:00Z",
     "group_ids": ["group-id-1", "group-id-2"]
   }
   ```

2. **assignments**
   ```json
   {
     "id": "uuid",
     "user_id": "user-uuid",
     "title": "Assignment Title",
     "description": "Details...",
     "due_date": "2024-12-15T23:59:00Z",
     "source": "manual|learning_suite|canvas",
     "course_name": "CS 450",
     "completed": false,
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```

3. **groups**
   ```json
   {
     "id": "uuid",
     "name": "Study Group",
     "description": "Group description",
     "member_ids": ["user-1", "user-2"],
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```

4. **messages**
   ```json
   {
     "id": "uuid",
     "group_id": "group-uuid",
     "user_id": "user-uuid",
     "user_name": "John Doe",
     "content": "Message text",
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```

5. **lms_configs**
   ```json
   {
     "user_id": "user-uuid",
     "learning_suite_api_key": "encrypted-key",
     "canvas_api_key": "encrypted-key",
     "canvas_domain": "canvas.instructure.com"
   }
   ```

---

## 8. API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth (placeholder)
- `POST /api/auth/byu-netid` - BYU NetID (placeholder)
- `GET /api/auth/me` - Get current user

### Assignments
- `GET /api/assignments` - Get user's assignments
- `POST /api/assignments` - Create manual assignment
- `PATCH /api/assignments/{id}/complete` - Toggle completion
- `DELETE /api/assignments/{id}` - Delete assignment

### LMS Integration
- `GET /api/lms/config` - Get LMS configuration
- `POST /api/lms/config` - Update LMS configuration
- `POST /api/lms/sync` - Sync assignments from LMS (placeholder)

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `POST /api/groups/{id}/join` - Join group

### Messages
- `GET /api/groups/{id}/messages` - Get group messages
- `POST /api/groups/{id}/messages` - Send message

### WebSocket
- `WS /ws/groups/{id}` - Real-time group chat

---

## 9. Environment Variables

### Backend (`/app/backend/.env`)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="younivity_db"
CORS_ORIGINS="*"
JWT_SECRET_KEY="change-in-production"

# Add these for integrations:
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
BYU_CAS_URL="https://cas.byu.edu/cas"
```

### Frontend (`/app/frontend/.env`)
```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

---

## 10. Testing Integrations

### Test LMS Sync
```bash
curl -X POST https://your-domain.com/api/lms/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Assignment Creation
```bash
curl -X POST https://your-domain.com/api/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Assignment",
    "due_date": "2024-12-31T23:59:00Z",
    "course_name": "Test Course"
  }'
```

---

## Support

For questions about integrations:
1. Check API documentation in code comments
2. Review test files in `/app/test_reports/`
3. Contact system administrator

## Next Steps

1. ✅ Core functionality complete
2. 🔄 Add Learning Suite API integration
3. 🔄 Add Canvas API integration  
4. 🔄 Configure Google OAuth
5. 🔄 Setup BYU NetID authentication
6. 🔄 Integrate advertising platform
7. ✅ Deploy and test
