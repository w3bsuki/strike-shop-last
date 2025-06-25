"""
Email service testing with MailHog integration
"""
import pytest
import asyncio
import aiohttp
import json
from datetime import datetime, timezone
from typing import Dict, List, Any
from unittest.mock import AsyncMock, patch

from app.services.email_service import EmailService, EmailTemplate
from app.models.user import User
from app.models.team import Team
from tests.factories import UserFactory, TeamFactory, TestScenarioFactories


class MailHogClient:
    """Client for interacting with MailHog during testing."""
    
    def __init__(self, base_url: str = "http://localhost:8025"):
        self.base_url = base_url
        
    async def get_messages(self) -> List[Dict[str, Any]]:
        """Get all messages from MailHog."""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/v2/messages") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('items', [])
                return []
    
    async def clear_messages(self) -> None:
        """Clear all messages from MailHog."""
        async with aiohttp.ClientSession() as session:
            async with session.delete(f"{self.base_url}/api/v1/messages") as response:
                return response.status == 200
    
    async def get_latest_message(self) -> Dict[str, Any] | None:
        """Get the most recent message."""
        messages = await self.get_messages()
        return messages[0] if messages else None
    
    async def find_message_by_recipient(self, email: str) -> Dict[str, Any] | None:
        """Find a message by recipient email."""
        messages = await self.get_messages()
        for message in messages:
            if any(to_addr['Mailbox'] == email.split('@')[0] for to_addr in message.get('To', [])):
                return message
        return None


@pytest.fixture
async def mailhog_client():
    """Fixture for MailHog client."""
    client = MailHogClient()
    await client.clear_messages()  # Clean slate for each test
    yield client
    await client.clear_messages()  # Cleanup after test


@pytest.fixture
async def email_service():
    """Fixture for EmailService with test configuration."""
    service = EmailService(
        smtp_host="localhost",
        smtp_port=1025,  # MailHog SMTP port
        smtp_user="test",
        smtp_password="test",
        from_email="noreply@taskflow.test",
        from_name="TaskFlow AI Test"
    )
    return service


class TestEmailTemplates:
    """Test email template generation and rendering."""
    
    @pytest.mark.asyncio
    async def test_team_invitation_template(self, email_service):
        """Test team invitation email template."""
        template_data = {
            'inviter_name': 'John Doe', 
            'team_name': 'Development Team',
            'invite_url': 'https://taskflow.ai/invite/abc123',
            'team_description': 'Our awesome development team'
        }
        
        html_content, text_content = await email_service.render_template(
            EmailTemplate.TEAM_INVITATION,
            template_data
        )
        
        # Verify template rendering
        assert 'John Doe' in html_content
        assert 'Development Team' in html_content
        assert 'https://taskflow.ai/invite/abc123' in html_content
        assert 'John Doe' in text_content
        assert 'Development Team' in text_content
    
    @pytest.mark.asyncio
    async def test_task_assignment_template(self, email_service):
        """Test task assignment email template."""
        template_data = {
            'assignee_name': 'Jane Smith',
            'task_title': 'Implement user authentication',
            'task_description': 'Add OAuth and JWT support',
            'task_url': 'https://taskflow.ai/tasks/456',
            'assigner_name': 'John Doe',
            'due_date': '2024-01-15'
        }
        
        html_content, text_content = await email_service.render_template(
            EmailTemplate.TASK_ASSIGNMENT,
            template_data
        )
        
        assert 'Jane Smith' in html_content
        assert 'Implement user authentication' in html_content
        assert 'John Doe' in html_content
        assert '2024-01-15' in html_content
    
    @pytest.mark.asyncio
    async def test_mention_notification_template(self, email_service):
        """Test mention notification email template."""
        template_data = {
            'mentioned_user': 'Alice Johnson',
            'mentioner_name': 'Bob Wilson',
            'context_type': 'task',
            'context_title': 'Fix bug in payment system',
            'context_url': 'https://taskflow.ai/tasks/789',
            'mention_content': '@alice Can you review this fix?'
        }
        
        html_content, text_content = await email_service.render_template(
            EmailTemplate.MENTION_NOTIFICATION,
            template_data
        )
        
        assert 'Alice Johnson' in html_content
        assert 'Bob Wilson' in html_content
        assert 'Fix bug in payment system' in html_content
        assert '@alice Can you review this fix?' in html_content


class TestEmailDelivery:
    """Test email delivery with MailHog."""
    
    @pytest.mark.asyncio
    async def test_send_team_invitation_email(self, email_service, mailhog_client, db_session):
        """Test sending team invitation email."""
        # Create test data
        team = await TeamFactory.create_async(db_session, name="Test Team")
        inviter = await UserFactory.create_async(db_session, full_name="John Doe")
        invitee_email = "test@example.com"
        
        # Send invitation
        await email_service.send_team_invitation(
            invitee_email=invitee_email,
            inviter=inviter,
            team=team,
            invite_token="test-token-123"
        )
        
        # Wait for email to be received
        await asyncio.sleep(0.5)
        
        # Check MailHog received the email
        message = await mailhog_client.find_message_by_recipient(invitee_email)
        assert message is not None
        assert team.name in message['Content']['Body']
        assert inviter.full_name in message['Content']['Body']
    
    @pytest.mark.asyncio
    async def test_send_task_assignment_email(self, email_service, mailhog_client, db_session):
        """Test sending task assignment email."""
        # Create test data
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        assignee = scenario['members'][0]
        assigner = scenario['admins'][0]
        
        # Send assignment email
        await email_service.send_task_assignment(
            assignee=assignee,
            task=task,
            assigner=assigner
        )
        
        # Wait and verify
        await asyncio.sleep(0.5)
        message = await mailhog_client.find_message_by_recipient(assignee.email)
        assert message is not None
        assert task.title in message['Content']['Body']
        assert assigner.full_name in message['Content']['Body']
    
    @pytest.mark.asyncio
    async def test_send_mention_notification(self, email_service, mailhog_client, db_session):
        """Test sending mention notification email."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        mentioned_user = scenario['members'][0]
        mentioner = scenario['members'][1]
        task = scenario['tasks'][0]
        
        await email_service.send_mention_notification(
            mentioned_user=mentioned_user,
            mentioner=mentioner,
            context_type="task",
            context_title=task.title,
            context_url=f"https://taskflow.ai/tasks/{task.id}",
            mention_content=f"@{mentioned_user.username} please review this"
        )
        
        await asyncio.sleep(0.5)
        message = await mailhog_client.find_message_by_recipient(mentioned_user.email)
        assert message is not None
        assert mentioned_user.full_name in message['Content']['Body']
        assert mentioner.full_name in message['Content']['Body']


class TestEmailPreferences:
    """Test email preference management."""
    
    @pytest.mark.asyncio
    async def test_user_email_preferences(self, email_service, db_session):
        """Test that email preferences are respected."""
        user = await UserFactory.create_async(
            db_session,
            notification_preferences='{"email": false, "mentions": true}'
        )
        
        # Should not send email if email notifications disabled
        should_send = await email_service.should_send_email(user, 'task_assignment')
        assert not should_send
        
        # Should send mention notifications even if email disabled
        should_send = await email_service.should_send_email(user, 'mention')
        assert should_send
    
    @pytest.mark.asyncio
    async def test_unsubscribe_functionality(self, email_service, mailhog_client, db_session):
        """Test unsubscribe link functionality."""
        user = await UserFactory.create_async(db_session)
        
        # Send email with unsubscribe link
        await email_service.send_weekly_digest(
            user=user,
            digest_data={'tasks_completed': 5, 'tasks_created': 3}
        )
        
        await asyncio.sleep(0.5)
        message = await mailhog_client.find_message_by_recipient(user.email)
        assert message is not None
        
        # Check unsubscribe link is present
        body = message['Content']['Body']
        assert 'unsubscribe' in body.lower()
        assert f'user/{user.id}/unsubscribe' in body or f'unsubscribe/{user.id}' in body


class TestEmailErrorHandling:
    """Test email error handling and resilience."""
    
    @pytest.mark.asyncio
    async def test_smtp_connection_failure(self, db_session):
        """Test handling SMTP connection failures."""
        # Configure service with invalid SMTP settings
        email_service = EmailService(
            smtp_host="invalid-host",
            smtp_port=9999,
            smtp_user="test",
            smtp_password="test",
            from_email="test@example.com"
        )
        
        user = await UserFactory.create_async(db_session)
        
        # Should handle connection failure gracefully
        with pytest.raises(Exception):  # Expect connection error
            await email_service.send_welcome_email(user)
    
    @pytest.mark.asyncio
    async def test_invalid_email_address(self, email_service, db_session):
        """Test handling invalid email addresses."""
        user = await UserFactory.create_async(db_session, email="invalid-email")
        
        # Should handle invalid email gracefully
        with pytest.raises(ValueError):
            await email_service.send_welcome_email(user)
    
    @pytest.mark.asyncio
    async def test_template_rendering_error(self, email_service):
        """Test handling template rendering errors."""
        # Missing required template data
        with pytest.raises(KeyError):
            await email_service.render_template(
                EmailTemplate.TEAM_INVITATION,
                {}  # Empty data should cause template error
            )


class TestEmailBulkOperations:
    """Test bulk email operations and performance."""
    
    @pytest.mark.asyncio
    async def test_bulk_team_invitations(self, email_service, mailhog_client, db_session):
        """Test sending bulk team invitations."""
        team = await TeamFactory.create_async(db_session)
        inviter = await UserFactory.create_async(db_session)
        
        # Send invitations to multiple users
        invitee_emails = [f"user{i}@example.com" for i in range(5)]
        
        await email_service.send_bulk_team_invitations(
            invitee_emails=invitee_emails,
            inviter=inviter,
            team=team
        )
        
        # Wait for all emails to be processed
        await asyncio.sleep(2)
        
        # Verify all emails were sent
        messages = await mailhog_client.get_messages()
        assert len(messages) == 5
        
        # Verify each recipient got their email
        for email in invitee_emails:
            message = await mailhog_client.find_message_by_recipient(email)
            assert message is not None
    
    @pytest.mark.asyncio
    async def test_weekly_digest_bulk_send(self, email_service, mailhog_client, db_session):
        """Test sending weekly digest to all team members."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        
        digest_data = {
            'team_name': scenario['team'].name,
            'tasks_completed': 15,
            'tasks_created': 8,
            'top_contributors': [user.full_name for user in scenario['all_users'][:3]]
        }
        
        await email_service.send_team_weekly_digest(
            team=scenario['team'],
            digest_data=digest_data
        )
        
        await asyncio.sleep(2)
        
        # Should send digest to all team members
        messages = await mailhog_client.get_messages()
        assert len(messages) == len(scenario['all_users'])


class TestEmailMetrics:
    """Test email metrics and monitoring."""
    
    @pytest.mark.asyncio
    async def test_email_delivery_tracking(self, email_service, db_session):
        """Test email delivery metrics tracking."""
        user = await UserFactory.create_async(db_session)
        
        # Mock metrics tracking
        with patch.object(email_service, 'track_email_sent') as mock_track:
            await email_service.send_welcome_email(user)
            mock_track.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_email_bounce_handling(self, email_service, db_session):
        """Test handling email bounces and failures."""
        user = await UserFactory.create_async(db_session)
        
        # Simulate bounce handling
        bounce_data = {
            'email': user.email,
            'bounce_type': 'permanent',
            'timestamp': datetime.now(timezone.utc)
        }
        
        await email_service.handle_bounce(bounce_data)
        
        # User should be marked as having bounce issues
        await db_session.refresh(user)
        # This would depend on your user model having a bounce tracking field


@pytest.mark.integration
class TestEmailIntegration:
    """Integration tests for email functionality."""
    
    @pytest.mark.asyncio
    async def test_complete_team_invitation_flow(self, email_service, mailhog_client, db_session):
        """Test complete team invitation workflow."""
        # Create team and inviter
        team = await TeamFactory.create_async(db_session, name="Integration Test Team")
        inviter = await UserFactory.create_async(db_session, full_name="Team Admin")
        invitee_email = "newmember@example.com"
        
        # Send invitation
        invite_token = "integration-test-token"
        await email_service.send_team_invitation(
            invitee_email=invitee_email,
            inviter=inviter,
            team=team,
            invite_token=invite_token
        )
        
        # Verify email was sent
        await asyncio.sleep(0.5)
        message = await mailhog_client.find_message_by_recipient(invitee_email)
        assert message is not None
        
        # Verify email content contains all necessary information
        body = message['Content']['Body']
        assert team.name in body
        assert inviter.full_name in body
        assert invite_token in body
        
        # Verify HTML and text versions
        assert 'text/html' in message['MIME']['Parts'][0]['Headers']['Content-Type'][0]
        assert len(message['MIME']['Parts']) >= 2  # Should have both HTML and text parts
    
    @pytest.mark.asyncio
    async def test_email_template_cross_client_compatibility(self, email_service):
        """Test email templates work across different email clients."""
        template_data = {
            'user_name': 'Test User',
            'team_name': 'Test Team',
            'task_title': 'Test Task'
        }
        
        html_content, text_content = await email_service.render_template(
            EmailTemplate.TASK_ASSIGNMENT,
            template_data
        )
        
        # Check for email client compatibility
        assert 'DOCTYPE html' not in html_content  # Avoid DOCTYPE for better compatibility
        assert 'table' in html_content.lower()  # Use tables for layout
        assert len(text_content) > 0  # Always include text version
        assert text_content.count('\n') > 3  # Proper text formatting