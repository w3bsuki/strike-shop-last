from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
import json
from uuid import UUID

from app.core.config import settings
from app.db.session import get_db
from app.websocket.manager import manager
from app.models.user import User
from app.schemas.token import TokenPayload

router = APIRouter()


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Authenticate WebSocket connection"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.type != "access" or not token_data.sub:
            await websocket.close(code=1008, reason="Invalid token")
            return None
            
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return None
    
    # Get user from database
    user = await db.get(User, UUID(token_data.sub))
    
    if not user or not user.is_active:
        await websocket.close(code=1008, reason="User not found or inactive")
        return None
    
    return user


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Main WebSocket endpoint for real-time communication"""
    
    # Authenticate user
    user = await get_current_user_ws(websocket, token, db)
    if not user:
        return
    
    user_id = str(user.id)
    
    # Connect user
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial connection success message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            message_type = message.get("type")
            
            if message_type == "join_team":
                team_id = message.get("team_id")
                if team_id:
                    manager.join_room(user_id, team_id)
                    await manager.broadcast_presence(user_id, team_id, "online")
                    
                    # Send room joined confirmation
                    await websocket.send_json({
                        "type": "room_joined",
                        "room_id": team_id,
                        "online_users": manager.get_room_users(team_id)
                    })
            
            elif message_type == "leave_team":
                team_id = message.get("team_id")
                if team_id:
                    manager.leave_room(user_id, team_id)
                    await manager.broadcast_presence(user_id, team_id, "offline")
            
            elif message_type == "task_update":
                # Broadcast task updates to team
                team_id = message.get("team_id")
                task_id = message.get("task_id")
                action = message.get("action")
                task_data = message.get("data")
                
                if team_id and task_id:
                    await manager.broadcast_task_update(
                        task_id, team_id, action, user_id, task_data
                    )
            
            elif message_type == "typing":
                # Handle typing indicators
                team_id = message.get("team_id")
                task_id = message.get("task_id")
                is_typing = message.get("is_typing", False)
                
                if team_id and task_id:
                    await manager.broadcast_typing(
                        user_id, team_id, task_id, is_typing
                    )
            
            elif message_type == "cursor_position":
                # Handle collaborative cursor positions
                team_id = message.get("team_id")
                position = message.get("position")
                
                if team_id:
                    cursor_message = {
                        "type": "cursor_update",
                        "user_id": user_id,
                        "position": position
                    }
                    await manager.broadcast_to_room(
                        cursor_message, team_id, exclude_user=user_id
                    )
            
            elif message_type == "ping":
                # Respond to ping with pong
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        # Clean up on disconnect
        manager.disconnect(websocket, user_id)
        
        # Broadcast offline status to all user's rooms
        if user_id in manager.user_rooms:
            for room_id in list(manager.user_rooms.get(user_id, [])):
                await manager.broadcast_presence(user_id, room_id, "offline")
    
    except Exception as e:
        # Log error and disconnect
        print(f"WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(websocket, user_id)