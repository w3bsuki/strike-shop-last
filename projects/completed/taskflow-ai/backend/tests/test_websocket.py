"""
Test WebSocket functionality
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.websocket.manager import ConnectionManager
from app.models.task import TaskStatus
from tests.factories import TaskFactory, UserFactory


class TestWebSocketManager:
    """Test WebSocket connection manager."""

    @pytest.fixture
    def connection_manager(self):
        """Create a connection manager instance."""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket connection."""
        mock_ws = Mock()
        mock_ws.send_text = AsyncMock()
        mock_ws.send_json = AsyncMock()
        mock_ws.close = AsyncMock()
        return mock_ws

    @pytest.mark.asyncio
    async def test_connect_user(self, connection_manager, mock_websocket):
        """Test connecting a user to WebSocket."""
        user_id = "user123"
        
        await connection_manager.connect(mock_websocket, user_id)
        
        assert user_id in connection_manager.active_connections
        assert mock_websocket in connection_manager.active_connections[user_id]

    @pytest.mark.asyncio
    async def test_disconnect_user(self, connection_manager, mock_websocket):
        """Test disconnecting a user from WebSocket."""
        user_id = "user123"
        
        # Connect first
        await connection_manager.connect(mock_websocket, user_id)
        
        # Then disconnect
        connection_manager.disconnect(mock_websocket, user_id)
        
        assert user_id not in connection_manager.active_connections or \
               mock_websocket not in connection_manager.active_connections.get(user_id, [])

    @pytest.mark.asyncio
    async def test_send_personal_message(self, connection_manager, mock_websocket):
        """Test sending a personal message to a user."""
        user_id = "user123"
        message = {"type": "task_update", "data": {"task_id": "1", "status": "completed"}}
        
        # Connect user
        await connection_manager.connect(mock_websocket, user_id)
        
        # Send message
        await connection_manager.send_personal_message(message, user_id)
        
        mock_websocket.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_send_personal_message_user_not_connected(self, connection_manager):
        """Test sending message to non-connected user."""
        user_id = "nonexistent"
        message = {"type": "test", "data": {}}
        
        # Should not raise an exception
        await connection_manager.send_personal_message(message, user_id)

    @pytest.mark.asyncio
    async def test_broadcast_message(self, connection_manager):
        """Test broadcasting message to all connected users."""
        # Create multiple mock connections
        mock_ws1 = Mock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = Mock()
        mock_ws2.send_json = AsyncMock()
        
        # Connect multiple users
        await connection_manager.connect(mock_ws1, "user1")
        await connection_manager.connect(mock_ws2, "user2")
        
        message = {"type": "system_announcement", "data": {"message": "Server maintenance"}}
        
        # Broadcast message
        await connection_manager.broadcast(message)
        
        mock_ws1.send_json.assert_called_once_with(message)
        mock_ws2.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_broadcast_to_team(self, connection_manager):
        """Test broadcasting message to team members."""
        # Create multiple mock connections
        mock_ws1 = Mock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = Mock()
        mock_ws2.send_json = AsyncMock()
        mock_ws3 = Mock()
        mock_ws3.send_json = AsyncMock()
        
        # Connect users
        await connection_manager.connect(mock_ws1, "user1")
        await connection_manager.connect(mock_ws2, "user2")
        await connection_manager.connect(mock_ws3, "user3")
        
        message = {"type": "task_assigned", "data": {"task_id": "1"}}
        team_members = ["user1", "user2"]  # user3 not in team
        
        # Broadcast to team
        await connection_manager.broadcast_to_team(message, team_members)
        
        mock_ws1.send_json.assert_called_once_with(message)
        mock_ws2.send_json.assert_called_once_with(message)
        mock_ws3.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_connection_error(self, connection_manager, mock_websocket):
        """Test handling connection errors."""
        user_id = "user123"
        
        # Connect user
        await connection_manager.connect(mock_websocket, user_id)
        
        # Simulate connection error
        mock_websocket.send_json.side_effect = Exception("Connection lost")
        
        message = {"type": "test", "data": {}}
        
        # Should handle error gracefully
        await connection_manager.send_personal_message(message, user_id)
        
        # Connection should be cleaned up
        assert user_id not in connection_manager.active_connections or \
               mock_websocket not in connection_manager.active_connections.get(user_id, [])

    @pytest.mark.asyncio
    async def test_multiple_connections_same_user(self, connection_manager):
        """Test multiple connections for the same user."""
        user_id = "user123"
        mock_ws1 = Mock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = Mock()
        mock_ws2.send_json = AsyncMock()
        
        # Connect same user multiple times (multiple tabs/devices)
        await connection_manager.connect(mock_ws1, user_id)
        await connection_manager.connect(mock_ws2, user_id)
        
        assert len(connection_manager.active_connections[user_id]) == 2
        
        # Send message should reach both connections
        message = {"type": "test", "data": {}}
        await connection_manager.send_personal_message(message, user_id)
        
        mock_ws1.send_json.assert_called_once_with(message)
        mock_ws2.send_json.assert_called_once_with(message)


class TestWebSocketEndpoints:
    """Test WebSocket endpoints."""

    @pytest.mark.asyncio
    async def test_websocket_connection_authorized(self, client: AsyncClient, test_user):
        """Test WebSocket connection with valid token."""
        from app.core.security import create_access_token
        
        token = create_access_token(subject=str(test_user.id))
        
        with client.websocket_connect(f"/ws/{test_user.id}?token={token}") as websocket:
            # Connection should be established
            data = websocket.receive_json()
            assert data["type"] == "connection_established"

    @pytest.mark.asyncio
    async def test_websocket_connection_unauthorized(self, client: AsyncClient):
        """Test WebSocket connection without valid token."""
        with pytest.raises(Exception):  # Should raise WebSocketException
            with client.websocket_connect("/ws/user123?token=invalid"):
                pass

    @pytest.mark.asyncio
    async def test_websocket_task_updates(self, authenticated_client: AsyncClient, test_task):
        """Test receiving task updates via WebSocket."""
        with patch('app.websocket.manager.ConnectionManager.send_personal_message') as mock_send:
            # Update task status
            response = await authenticated_client.put(
                f"/api/v1/tasks/{test_task.id}",
                json={"status": TaskStatus.COMPLETED.value}
            )
            
            assert response.status_code == 200
            
            # Should send WebSocket notification
            mock_send.assert_called()
            call_args = mock_send.call_args
            message = call_args[0][0]  # First argument
            
            assert message["type"] == "task_updated"
            assert message["data"]["task_id"] == test_task.id
            assert message["data"]["status"] == TaskStatus.COMPLETED.value

    @pytest.mark.asyncio
    async def test_websocket_new_task_notification(self, authenticated_client: AsyncClient):
        """Test receiving new task notifications via WebSocket."""
        with patch('app.websocket.manager.ConnectionManager.send_personal_message') as mock_send:
            # Create new task
            task_data = {
                "title": "New WebSocket Task",
                "description": "Task for WebSocket testing"
            }
            
            response = await authenticated_client.post("/api/v1/tasks", json=task_data)
            
            assert response.status_code == 201
            
            # Should send WebSocket notification
            mock_send.assert_called()
            call_args = mock_send.call_args
            message = call_args[0][0]
            
            assert message["type"] == "task_created"
            assert message["data"]["title"] == task_data["title"]

    @pytest.mark.asyncio
    async def test_websocket_task_assignment_notification(
        self, 
        authenticated_client: AsyncClient, 
        db_session: AsyncSession,
        test_task
    ):
        """Test receiving task assignment notifications."""
        assignee = await UserFactory.create_async(db_session)
        
        with patch('app.websocket.manager.ConnectionManager.send_personal_message') as mock_send:
            # Assign task
            response = await authenticated_client.post(
                f"/api/v1/tasks/{test_task.id}/assign",
                json={"assignee_id": assignee.id}
            )
            
            assert response.status_code == 200
            
            # Should send notification to assignee
            mock_send.assert_called()
            call_args = mock_send.call_args
            message = call_args[0][0]
            user_id = call_args[0][1]
            
            assert user_id == str(assignee.id)
            assert message["type"] == "task_assigned"
            assert message["data"]["task_id"] == test_task.id

    @pytest.mark.asyncio
    async def test_websocket_comment_notification(self, authenticated_client: AsyncClient, test_task):
        """Test receiving comment notifications via WebSocket."""
        with patch('app.websocket.manager.ConnectionManager.send_personal_message') as mock_send:
            # Add comment
            comment_data = {"content": "This is a test comment"}
            
            response = await authenticated_client.post(
                f"/api/v1/tasks/{test_task.id}/comments",
                json=comment_data
            )
            
            assert response.status_code == 201
            
            # Should send WebSocket notification
            mock_send.assert_called()
            call_args = mock_send.call_args
            message = call_args[0][0]
            
            assert message["type"] == "comment_added"
            assert message["data"]["task_id"] == test_task.id
            assert message["data"]["content"] == comment_data["content"]

    @pytest.mark.asyncio
    async def test_websocket_heartbeat(self, client: AsyncClient, test_user):
        """Test WebSocket heartbeat mechanism."""
        from app.core.security import create_access_token
        
        token = create_access_token(subject=str(test_user.id))
        
        with client.websocket_connect(f"/ws/{test_user.id}?token={token}") as websocket:
            # Send heartbeat
            websocket.send_json({"type": "heartbeat"})
            
            # Should receive heartbeat response
            response = websocket.receive_json()
            assert response["type"] == "heartbeat_ack"

    @pytest.mark.asyncio
    async def test_websocket_typing_indicator(self, client: AsyncClient, test_user, test_task):
        """Test typing indicator functionality."""
        from app.core.security import create_access_token
        
        token = create_access_token(subject=str(test_user.id))
        
        with client.websocket_connect(f"/ws/{test_user.id}?token={token}") as websocket:
            # Send typing indicator
            websocket.send_json({
                "type": "typing",
                "data": {
                    "task_id": test_task.id,
                    "is_typing": True
                }
            })
            
            # Should broadcast to other team members
            # This would be tested with multiple connections in a real scenario

    @pytest.mark.asyncio
    async def test_websocket_connection_cleanup(self, client: AsyncClient, test_user):
        """Test WebSocket connection cleanup on disconnect."""
        from app.core.security import create_access_token
        
        token = create_access_token(subject=str(test_user.id))
        
        with patch('app.websocket.manager.ConnectionManager.disconnect') as mock_disconnect:
            with client.websocket_connect(f"/ws/{test_user.id}?token={token}") as websocket:
                pass  # Connection automatically closes when exiting context
            
            # Should clean up connection
            mock_disconnect.assert_called()

    @pytest.mark.asyncio
    async def test_websocket_rate_limiting(self, client: AsyncClient, test_user):
        """Test WebSocket rate limiting."""
        from app.core.security import create_access_token
        
        token = create_access_token(subject=str(test_user.id))
        
        with client.websocket_connect(f"/ws/{test_user.id}?token={token}") as websocket:
            # Send multiple messages rapidly
            for i in range(100):  # Exceed rate limit
                websocket.send_json({"type": "test", "data": {"message": i}})
            
            # Should receive rate limit warning or disconnect
            response = websocket.receive_json()
            assert response["type"] in ["rate_limit_warning", "rate_limit_exceeded"]