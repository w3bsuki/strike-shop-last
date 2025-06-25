"""
WebSocket and real-time functionality testing
"""
import pytest
import asyncio
import json
import websockets
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from typing import List, Dict, Any

from app.websocket.manager import ConnectionManager, WebSocketConnection
from app.models.user import User
from app.models.team import Team
from app.models.task import Task
from app.models.activity import Activity
from app.services.notification_service import NotificationService
from tests.factories import (
    UserFactory, TeamFactory, TaskFactory, ActivityFactory,
    TestScenarioFactories
)


class MockWebSocket:
    """Mock WebSocket for testing."""
    
    def __init__(self):
        self.messages_sent = []
        self.is_closed = False
        self.close_code = None
        
    async def send(self, message: str):
        if self.is_closed:
            raise websockets.exceptions.ConnectionClosed(None, None)
        self.messages_sent.append(message)
    
    async def close(self, code: int = 1000):
        self.is_closed = True
        self.close_code = code
    
    def get_sent_messages(self) -> List[Dict[str, Any]]:
        return [json.loads(msg) for msg in self.messages_sent]


class TestWebSocketConnectionManager:
    """Test WebSocket connection management."""
    
    @pytest.mark.asyncio
    async def test_connection_establishment(self, db_session):
        """Test establishing WebSocket connections."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Create mock WebSocket
        mock_ws = MockWebSocket()
        
        # Add connection
        await manager.connect(mock_ws, user.id)
        
        # Verify connection stored
        assert user.id in manager.active_connections
        assert len(manager.active_connections[user.id]) == 1
        assert manager.active_connections[user.id][0].websocket == mock_ws
    
    @pytest.mark.asyncio
    async def test_multiple_connections_per_user(self, db_session):
        """Test multiple connections for same user (multiple devices)."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Add multiple connections for same user
        mock_ws1 = MockWebSocket()
        mock_ws2 = MockWebSocket()
        mock_ws3 = MockWebSocket()
        
        await manager.connect(mock_ws1, user.id)
        await manager.connect(mock_ws2, user.id)
        await manager.connect(mock_ws3, user.id)
        
        # Verify all connections stored
        assert len(manager.active_connections[user.id]) == 3
    
    @pytest.mark.asyncio
    async def test_connection_cleanup_on_disconnect(self, db_session):
        """Test connection cleanup when user disconnects."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        mock_ws = MockWebSocket()
        await manager.connect(mock_ws, user.id)
        
        # Disconnect
        await manager.disconnect(mock_ws, user.id)
        
        # Verify connection removed
        assert user.id not in manager.active_connections or len(manager.active_connections[user.id]) == 0
    
    @pytest.mark.asyncio
    async def test_broadcast_to_user(self, db_session):
        """Test broadcasting messages to specific user."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Add multiple connections for user
        mock_ws1 = MockWebSocket()
        mock_ws2 = MockWebSocket()
        
        await manager.connect(mock_ws1, user.id)
        await manager.connect(mock_ws2, user.id)
        
        # Broadcast message
        message = {"type": "notification", "data": {"message": "Hello!"}}
        await manager.send_to_user(user.id, message)
        
        # Verify message sent to all user connections
        messages1 = mock_ws1.get_sent_messages()
        messages2 = mock_ws2.get_sent_messages()
        
        assert len(messages1) == 1
        assert len(messages2) == 1
        assert messages1[0] == message
        assert messages2[0] == message
    
    @pytest.mark.asyncio
    async def test_broadcast_to_team(self, db_session):
        """Test broadcasting messages to team members."""
        manager = ConnectionManager()
        
        # Create team with members
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=5, admin_count=2
        )
        all_users = admins + members
        
        # Connect users
        user_websockets = {}
        for user in all_users:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            user_websockets[user.id] = mock_ws
        
        # Broadcast to team
        message = {"type": "team_update", "data": {"team_id": str(team.id), "message": "Team announcement"}}
        await manager.send_to_team(team.id, message)
        
        # Verify all team members received message
        for user in all_users:
            messages = user_websockets[user.id].get_sent_messages()
            assert len(messages) == 1
            assert messages[0] == message
    
    @pytest.mark.asyncio
    async def test_connection_error_handling(self, db_session):
        """Test handling connection errors and cleanup."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Create mock WebSocket that will fail
        class FailingWebSocket(MockWebSocket):
            async def send(self, message: str):
                raise websockets.exceptions.ConnectionClosed(None, None)
        
        failing_ws = FailingWebSocket()
        await manager.connect(failing_ws, user.id)
        
        # Try to send message - should handle error and clean up connection
        message = {"type": "test", "data": {}}
        await manager.send_to_user(user.id, message)
        
        # Connection should be cleaned up
        assert user.id not in manager.active_connections or len(manager.active_connections[user.id]) == 0


class TestRealTimeNotifications:
    """Test real-time notification delivery."""
    
    @pytest.mark.asyncio
    async def test_task_assignment_notification(self, db_session):
        """Test real-time notification when task is assigned."""
        manager = ConnectionManager()
        notification_service = NotificationService(manager)
        
        # Create test data
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        assignee = scenario['members'][0]
        assigner = scenario['admins'][0]
        
        # Connect assignee
        mock_ws = MockWebSocket()
        await manager.connect(mock_ws, assignee.id)
        
        # Send task assignment notification
        await notification_service.send_task_assignment_notification(
            task=task,
            assignee=assignee,
            assigner=assigner
        )
        
        # Verify notification received
        messages = mock_ws.get_sent_messages()
        assert len(messages) == 1
        
        notification = messages[0]
        assert notification['type'] == 'task_assigned'
        assert notification['data']['task_id'] == str(task.id)
        assert notification['data']['assigner_name'] == assigner.full_name
        assert notification['data']['task_title'] == task.title
    
    @pytest.mark.asyncio
    async def test_mention_notification(self, db_session):
        """Test real-time notification for @mentions."""
        manager = ConnectionManager()
        notification_service = NotificationService(manager)
        
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        mentioned_user = scenario['members'][0]
        mentioner = scenario['members'][1]
        task = scenario['tasks'][0]
        
        # Connect mentioned user
        mock_ws = MockWebSocket()
        await manager.connect(mock_ws, mentioned_user.id)
        
        # Send mention notification
        await notification_service.send_mention_notification(
            mentioned_user=mentioned_user,
            mentioner=mentioner,
            context_type='task',
            context_id=task.id,
            context_title=task.title,
            mention_content=f'@{mentioned_user.username} please review this'
        )
        
        # Verify mention notification
        messages = mock_ws.get_sent_messages()
        assert len(messages) == 1
        
        notification = messages[0]
        assert notification['type'] == 'mention'
        assert notification['data']['mentioned_by'] == mentioner.full_name
        assert notification['data']['context_type'] == 'task'
        assert f'@{mentioned_user.username}' in notification['data']['content']
    
    @pytest.mark.asyncio
    async def test_team_activity_updates(self, db_session):
        """Test real-time team activity updates."""
        manager = ConnectionManager()
        notification_service = NotificationService(manager)
        
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        team = scenario['team']
        all_users = scenario['all_users']
        
        # Connect all team members
        user_websockets = {}
        for user in all_users:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            user_websockets[user.id] = mock_ws
        
        # Create activity
        activity = await ActivityFactory.create_async(
            db_session,
            user_id=all_users[0].id,
            team_id=team.id,
            action='completed',
            entity_type='task',
            entity_id=scenario['tasks'][0].id
        )
        
        # Send activity update to team
        await notification_service.send_team_activity_update(
            team_id=team.id,
            activity=activity
        )
        
        # Verify all team members received activity update
        for user in all_users:
            messages = user_websockets[user.id].get_sent_messages()
            assert len(messages) == 1
            
            update = messages[0]
            assert update['type'] == 'team_activity'
            assert update['data']['team_id'] == str(team.id)
            assert update['data']['action'] == 'completed'
            assert update['data']['entity_type'] == 'task'


class TestRealTimeCollaboration:
    """Test real-time collaboration features."""
    
    @pytest.mark.asyncio
    async def test_live_cursor_tracking(self, db_session):
        """Test live cursor position tracking."""
        manager = ConnectionManager()
        
        # Create team members
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        # Connect users
        user_websockets = {}
        for user in admins + members:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            user_websockets[user.id] = mock_ws
        
        # User moves cursor
        cursor_data = {
            "type": "cursor_move",
            "data": {
                "user_id": str(admins[0].id),
                "x": 100,
                "y": 200,
                "page": "dashboard",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Broadcast cursor position to team
        await manager.send_to_team(team.id, cursor_data, exclude_user=admins[0].id)
        
        # Verify other team members received cursor update (but not the sender)
        admin_messages = user_websockets[admins[0].id].get_sent_messages()
        assert len(admin_messages) == 0  # Sender shouldn't receive their own cursor updates
        
        for member in members:
            messages = user_websockets[member.id].get_sent_messages()
            assert len(messages) == 1
            assert messages[0]['type'] == 'cursor_move'
            assert messages[0]['data']['x'] == 100
            assert messages[0]['data']['y'] == 200
    
    @pytest.mark.asyncio
    async def test_typing_indicators(self, db_session):
        """Test typing indicators for comments."""
        manager = ConnectionManager()
        
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        typing_user = scenario['members'][0]
        other_users = scenario['members'][1:] + scenario['admins']
        
        # Connect users
        user_websockets = {}
        for user in scenario['all_users']:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            user_websockets[user.id] = mock_ws
        
        # User starts typing
        typing_start = {
            "type": "typing_start",
            "data": {
                "user_id": str(typing_user.id),
                "user_name": typing_user.full_name,
                "context_type": "task",
                "context_id": str(task.id)
            }
        }
        
        # Send typing indicator to task context
        await manager.send_to_task_context(task.id, typing_start, exclude_user=typing_user.id)
        
        # Verify other users received typing indicator
        typing_user_messages = user_websockets[typing_user.id].get_sent_messages()
        assert len(typing_user_messages) == 0  # Typing user shouldn't see their own indicator
        
        for user in other_users:
            messages = user_websockets[user.id].get_sent_messages()
            assert len(messages) == 1
            assert messages[0]['type'] == 'typing_start'
            assert messages[0]['data']['user_name'] == typing_user.full_name
        
        # User stops typing
        typing_stop = {
            "type": "typing_stop",
            "data": {
                "user_id": str(typing_user.id),
                "context_type": "task",
                "context_id": str(task.id)
            }
        }
        
        await manager.send_to_task_context(task.id, typing_stop, exclude_user=typing_user.id)
        
        # Verify typing stop received
        for user in other_users:
            messages = user_websockets[user.id].get_sent_messages()
            assert len(messages) == 2  # Start + Stop
            assert messages[1]['type'] == 'typing_stop'
    
    @pytest.mark.asyncio
    async def test_presence_indicators(self, db_session):
        """Test user presence tracking."""
        manager = ConnectionManager()
        
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=5, admin_count=2
        )
        
        # Users come online
        online_users = []
        for user in admins + members[:2]:  # 4 users online
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            online_users.append(user)
        
        # Get presence for team
        presence_data = await manager.get_team_presence(team.id)
        
        # Verify presence data
        assert len(presence_data['online_users']) == 4
        assert all(str(user.id) in presence_data['online_users'] for user in online_users)
        
        # User goes offline
        await manager.disconnect_user(online_users[0].id)
        
        # Check updated presence
        updated_presence = await manager.get_team_presence(team.id)
        assert len(updated_presence['online_users']) == 3
        assert str(online_users[0].id) not in updated_presence['online_users']


class TestWebSocketAuthentication:
    """Test WebSocket authentication and authorization."""
    
    @pytest.mark.asyncio
    async def test_websocket_authentication(self, db_session):
        """Test WebSocket connection authentication."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Mock authentication service
        with patch('app.services.auth_service.verify_websocket_token') as mock_verify:
            mock_verify.return_value = user
            
            mock_ws = MockWebSocket()
            
            # Authenticate connection
            auth_result = await manager.authenticate_connection(mock_ws, "valid-token")
            
            assert auth_result is True
            mock_verify.assert_called_once_with("valid-token")
    
    @pytest.mark.asyncio
    async def test_websocket_authorization_for_team(self, db_session):
        """Test WebSocket authorization for team-specific events."""
        manager = ConnectionManager()
        
        # Create team with members
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        # Create non-team member
        outsider = await UserFactory.create_async(db_session)
        
        # Connect team member
        member_ws = MockWebSocket()
        await manager.connect(member_ws, members[0].id)
        
        # Connect outsider
        outsider_ws = MockWebSocket()
        await manager.connect(outsider_ws, outsider.id)
        
        # Send team-specific message
        team_message = {
            "type": "team_announcement",
            "data": {"message": "Secret team info"}
        }
        
        # Should only send to team members
        await manager.send_to_team(team.id, team_message)
        
        # Verify team member received message
        member_messages = member_ws.get_sent_messages()
        assert len(member_messages) == 1
        
        # Verify outsider did not receive message
        outsider_messages = outsider_ws.get_sent_messages()
        assert len(outsider_messages) == 0
    
    @pytest.mark.asyncio
    async def test_websocket_rate_limiting(self, db_session):
        """Test WebSocket rate limiting."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        mock_ws = MockWebSocket()
        await manager.connect(mock_ws, user.id)
        
        # Simulate rapid message sending
        messages_sent = 0
        rate_limited = False
        
        for i in range(100):  # Try to send 100 messages quickly
            try:
                await manager.handle_message(mock_ws, user.id, {
                    "type": "ping",
                    "data": {"sequence": i}
                })
                messages_sent += 1
            except Exception as e:
                if "rate limit" in str(e).lower():
                    rate_limited = True
                    break
        
        # Should hit rate limit before sending all messages
        assert rate_limited
        assert messages_sent < 100


class TestWebSocketPerformance:
    """Test WebSocket performance under load."""
    
    @pytest.mark.asyncio
    async def test_large_number_of_connections(self, db_session):
        """Test handling large number of WebSocket connections."""
        manager = ConnectionManager()
        
        # Create many users
        users = await UserFactory.create_batch_async(db_session, 100)
        
        # Connect all users
        start_time = datetime.now()
        
        for user in users:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
        
        connection_time = datetime.now() - start_time
        
        # Should handle 100 connections quickly
        assert connection_time.total_seconds() < 5.0
        assert len(manager.active_connections) == 100
    
    @pytest.mark.asyncio
    async def test_broadcast_performance(self, db_session):
        """Test broadcast performance to many users."""
        manager = ConnectionManager()
        
        # Create team with many members
        team = await TeamFactory.create_async(db_session)
        users = await UserFactory.create_batch_async(db_session, 50)
        
        # Connect all users
        for user in users:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
        
        # Broadcast message to all
        message = {"type": "announcement", "data": {"message": "Hello everyone!"}}
        
        start_time = datetime.now()
        await manager.broadcast_to_all(message)
        broadcast_time = datetime.now() - start_time
        
        # Should broadcast to 50 users quickly
        assert broadcast_time.total_seconds() < 2.0
        
        # Verify all users received message
        connection_count = sum(len(connections) for connections in manager.active_connections.values())
        assert connection_count == 50
    
    @pytest.mark.asyncio
    async def test_memory_usage_with_many_connections(self, db_session):
        """Test memory usage doesn't grow excessively with many connections."""
        manager = ConnectionManager()
        
        # Create and connect many users
        for i in range(200):
            user = await UserFactory.create_async(db_session)
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
        
        # Simulate some activity
        for i in range(50):
            message = {"type": "heartbeat", "data": {"timestamp": datetime.now().isoformat()}}
            await manager.broadcast_to_all(message)
        
        # Disconnect half the users
        user_ids = list(manager.active_connections.keys())
        for user_id in user_ids[:100]:
            await manager.disconnect_user(user_id)
        
        # Verify connections cleaned up properly
        assert len(manager.active_connections) == 100
        
        # Memory usage should be reasonable
        # (In a real implementation, you might check actual memory usage)
        active_connection_count = sum(len(connections) for connections in manager.active_connections.values())
        assert active_connection_count == 100


class TestWebSocketErrorRecovery:
    """Test WebSocket error handling and recovery."""
    
    @pytest.mark.asyncio
    async def test_automatic_reconnection_handling(self, db_session):
        """Test handling automatic reconnection attempts."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # Initial connection
        mock_ws1 = MockWebSocket()
        await manager.connect(mock_ws1, user.id)
        
        # Simulate connection drop
        mock_ws1.is_closed = True
        await manager.handle_connection_drop(mock_ws1, user.id)
        
        # Verify connection cleaned up
        assert user.id not in manager.active_connections or len(manager.active_connections[user.id]) == 0
        
        # Simulate reconnection
        mock_ws2 = MockWebSocket()
        await manager.connect(mock_ws2, user.id)
        
        # Verify new connection established
        assert len(manager.active_connections[user.id]) == 1
        assert manager.active_connections[user.id][0].websocket == mock_ws2
    
    @pytest.mark.asyncio
    async def test_message_queue_during_disconnection(self, db_session):
        """Test message queuing when user is disconnected."""
        manager = ConnectionManager()
        user = await UserFactory.create_async(db_session)
        
        # User is offline
        message = {"type": "important_notification", "data": {"message": "You have a new task"}}
        
        # Try to send message to offline user - should queue it
        await manager.send_to_user(user.id, message, queue_if_offline=True)
        
        # Verify message queued
        assert user.id in manager.message_queue
        assert len(manager.message_queue[user.id]) == 1
        
        # User comes online
        mock_ws = MockWebSocket()
        await manager.connect(mock_ws, user.id)
        
        # Should deliver queued messages
        messages = mock_ws.get_sent_messages()
        assert len(messages) == 1
        assert messages[0] == message
        
        # Queue should be cleared
        assert user.id not in manager.message_queue or len(manager.message_queue[user.id]) == 0
    
    @pytest.mark.asyncio
    async def test_graceful_shutdown(self, db_session):
        """Test graceful WebSocket manager shutdown."""
        manager = ConnectionManager()
        
        # Connect several users
        users = await UserFactory.create_batch_async(db_session, 5)
        websockets = []
        
        for user in users:
            mock_ws = MockWebSocket()
            await manager.connect(mock_ws, user.id)
            websockets.append(mock_ws)
        
        # Initiate graceful shutdown
        await manager.shutdown_gracefully()
        
        # Verify all connections closed gracefully
        for ws in websockets:
            assert ws.is_closed
            assert ws.close_code == 1001  # Going away code
        
        # Verify connection manager cleaned up
        assert len(manager.active_connections) == 0