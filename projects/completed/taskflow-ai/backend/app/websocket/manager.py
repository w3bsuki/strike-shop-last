from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio
from uuid import UUID
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        # Active connections by user ID
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Room subscriptions (team_id -> set of user_ids)
        self.rooms: Dict[str, Set[str]] = {}
        # User to rooms mapping
        self.user_rooms: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                # Remove from all rooms
                if user_id in self.user_rooms:
                    for room_id in self.user_rooms[user_id]:
                        if room_id in self.rooms:
                            self.rooms[room_id].discard(user_id)
                    del self.user_rooms[user_id]
    
    def join_room(self, user_id: str, room_id: str):
        """Join a room (typically a team ID)"""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        self.rooms[room_id].add(user_id)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        
        self.user_rooms[user_id].add(room_id)
    
    def leave_room(self, user_id: str, room_id: str):
        """Leave a room"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)
            
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            message_json = json.dumps(message)
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_json)
                except:
                    # Connection might be closed
                    pass
    
    async def broadcast_to_room(self, message: dict, room_id: str, exclude_user: str = None):
        """Broadcast message to all users in a room"""
        if room_id in self.rooms:
            message_json = json.dumps(message)
            
            for user_id in self.rooms[room_id]:
                if user_id != exclude_user and user_id in self.active_connections:
                    for connection in self.active_connections[user_id]:
                        try:
                            await connection.send_text(message_json)
                        except:
                            pass
    
    async def broadcast_task_update(self, task_id: str, team_id: str, action: str, 
                                   user_id: str, task_data: dict = None):
        """Broadcast task updates to team members"""
        message = {
            "type": "task_update",
            "action": action,  # created, updated, deleted, moved
            "task_id": task_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": task_data
        }
        
        await self.broadcast_to_room(message, team_id, exclude_user=user_id)
    
    async def broadcast_presence(self, user_id: str, team_id: str, status: str):
        """Broadcast user presence updates"""
        message = {
            "type": "presence",
            "user_id": user_id,
            "status": status,  # online, away, offline
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_room(message, team_id)
    
    async def broadcast_typing(self, user_id: str, team_id: str, task_id: str, is_typing: bool):
        """Broadcast typing indicators"""
        message = {
            "type": "typing",
            "user_id": user_id,
            "task_id": task_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_room(message, team_id, exclude_user=user_id)
    
    def get_room_users(self, room_id: str) -> List[str]:
        """Get list of users in a room"""
        return list(self.rooms.get(room_id, set()))
    
    def get_online_users(self) -> List[str]:
        """Get list of all online users"""
        return list(self.active_connections.keys())


# Global connection manager instance
manager = ConnectionManager()
websocket_manager = manager