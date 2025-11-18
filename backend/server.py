from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)

    async def broadcast(self, message: dict, group_id: str):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    auth_type: str  # 'email', 'google', 'byu_netid'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    group_ids: List[str] = []

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthData(BaseModel):
    token: str
    email: EmailStr
    full_name: str

class BYUNetIDAuth(BaseModel):
    netid: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    member_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    content: str

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = ""
    due_date: datetime
    source: str  # 'learning_suite', 'canvas', 'manual'
    course_name: Optional[str] = ""
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: datetime
    course_name: Optional[str] = ""

class LMSConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    learning_suite_api_key: Optional[str] = ""
    canvas_api_key: Optional[str] = ""
    canvas_domain: Optional[str] = ""

class LMSConfigUpdate(BaseModel):
    learning_suite_api_key: Optional[str] = None
    canvas_api_key: Optional[str] = None
    canvas_domain: Optional[str] = None

# Auth helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        auth_type="email"
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user.model_dump(mode='json')
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email})
    if not user_doc or not verify_password(user_data.password, user_doc.get('hashed_password', '')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user = User(**user_doc)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user.model_dump(mode='json')
    )

@api_router.post("/auth/google", response_model=Token)
async def google_auth(auth_data: GoogleAuthData):
    """Placeholder for Google OAuth - integrate with google-auth-oauthlib"""
    # Check if user exists
    user_doc = await db.users.find_one({"email": auth_data.email})
    
    if user_doc:
        user = User(**user_doc)
    else:
        # Create new user
        user = User(
            email=auth_data.email,
            full_name=auth_data.full_name,
            auth_type="google"
        )
        user_doc = user.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.users.insert_one(user_doc)
    
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user.model_dump(mode='json')
    )

@api_router.post("/auth/byu-netid", response_model=Token)
async def byu_netid_auth(auth_data: BYUNetIDAuth):
    """Placeholder for BYU NetID authentication - integrate when BYU API is available"""
    # TODO: Integrate with BYU authentication system
    raise HTTPException(
        status_code=501,
        detail="BYU NetID authentication not yet configured. Please contact administrator."
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Assignment routes
@api_router.get("/assignments", response_model=List[Assignment])
async def get_assignments(current_user: User = Depends(get_current_user)):
    assignments = await db.assignments.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    for assignment in assignments:
        if isinstance(assignment['due_date'], str):
            assignment['due_date'] = datetime.fromisoformat(assignment['due_date'])
        if isinstance(assignment['created_at'], str):
            assignment['created_at'] = datetime.fromisoformat(assignment['created_at'])
    
    return assignments

@api_router.post("/assignments", response_model=Assignment)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user)
):
    assignment = Assignment(
        user_id=current_user.id,
        title=assignment_data.title,
        description=assignment_data.description,
        due_date=assignment_data.due_date,
        course_name=assignment_data.course_name,
        source="manual"
    )
    
    doc = assignment.model_dump()
    doc['due_date'] = doc['due_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.assignments.insert_one(doc)
    return assignment

@api_router.patch("/assignments/{assignment_id}/complete")
async def toggle_assignment_complete(
    assignment_id: str,
    current_user: User = Depends(get_current_user)
):
    assignment = await db.assignments.find_one({"id": assignment_id, "user_id": current_user.id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    new_status = not assignment.get('completed', False)
    await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {"completed": new_status}}
    )
    
    return {"completed": new_status}

@api_router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.assignments.delete_one({"id": assignment_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted"}

# LMS Integration routes
@api_router.get("/lms/config")
async def get_lms_config(current_user: User = Depends(get_current_user)):
    config = await db.lms_configs.find_one({"user_id": current_user.id}, {"_id": 0})
    if not config:
        return {"learning_suite_api_key": "", "canvas_api_key": "", "canvas_domain": ""}
    return config

@api_router.post("/lms/config")
async def update_lms_config(
    config_data: LMSConfigUpdate,
    current_user: User = Depends(get_current_user)
):
    update_data = {k: v for k, v in config_data.model_dump().items() if v is not None}
    update_data["user_id"] = current_user.id
    
    await db.lms_configs.update_one(
        {"user_id": current_user.id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "LMS configuration updated"}

@api_router.post("/lms/sync")
async def sync_lms_assignments(current_user: User = Depends(get_current_user)):
    """Placeholder for syncing assignments from Learning Suite and Canvas"""
    config = await db.lms_configs.find_one({"user_id": current_user.id})
    
    if not config:
        raise HTTPException(status_code=400, detail="Please configure your LMS API keys first")
    
    # TODO: Implement actual API calls to Learning Suite and Canvas
    # For now, return a placeholder response
    return {
        "message": "LMS sync ready. Integrate Learning Suite and Canvas API calls here.",
        "learning_suite_configured": bool(config.get('learning_suite_api_key')),
        "canvas_configured": bool(config.get('canvas_api_key'))
    }

# Group routes
@api_router.get("/groups", response_model=List[Group])
async def get_groups(current_user: User = Depends(get_current_user)):
    groups = await db.groups.find(
        {"member_ids": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    for group in groups:
        if isinstance(group['created_at'], str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    
    return groups

@api_router.post("/groups", response_model=Group)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user)
):
    group = Group(
        name=group_data.name,
        description=group_data.description,
        member_ids=[current_user.id]
    )
    
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.groups.insert_one(doc)
    
    # Update user's group list
    await db.users.update_one(
        {"id": current_user.id},
        {"$push": {"group_ids": group.id}}
    )
    
    return group

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id in group['member_ids']:
        return {"message": "Already a member"}
    
    await db.groups.update_one(
        {"id": group_id},
        {"$push": {"member_ids": current_user.id}}
    )
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$push": {"group_ids": group_id}}
    )
    
    return {"message": "Joined group successfully"}

# Message routes
@api_router.get("/groups/{group_id}/messages", response_model=List[Message])
async def get_group_messages(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify user is in group
    group = await db.groups.find_one({"id": group_id, "member_ids": current_user.id})
    if not group:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    messages = await db.messages.find(
        {"group_id": group_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    for message in messages:
        if isinstance(message['created_at'], str):
            message['created_at'] = datetime.fromisoformat(message['created_at'])
    
    return messages

@api_router.post("/groups/{group_id}/messages", response_model=Message)
async def create_message(
    group_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify user is in group
    group = await db.groups.find_one({"id": group_id, "member_ids": current_user.id})
    if not group:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    message = Message(
        group_id=group_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        content=message_data.content
    )
    
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.messages.insert_one(doc)
    
    # Broadcast to WebSocket connections
    await manager.broadcast(message.model_dump(mode='json'), group_id)
    
    return message

# WebSocket route for real-time chat
@app.websocket("/ws/groups/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive, actual messages sent via REST API
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
