"""
Test data factories using factory_boy
"""
import factory
from factory import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import Optional

from app.models.user import User, user_teams
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.team import Team
from app.models.activity import Activity
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.team_membership import TeamMembership, TeamInvitation
from app.models.notification import Notification, NotificationPreference
from app.models.file_attachment import FileAttachment
from app.models.analytics import AnalyticsInsight
from app.core.security import get_password_hash


class AsyncSQLAlchemyModelFactory(factory.Factory):
    """Base factory for SQLAlchemy models with async support."""
    
    @classmethod
    async def create_async(cls, session: AsyncSession, **kwargs):
        """Create an instance asynchronously."""
        instance = cls.build(**kwargs)
        session.add(instance)
        await session.commit()
        await session.refresh(instance)
        return instance
    
    @classmethod
    async def create_batch_async(cls, session: AsyncSession, size: int, **kwargs):
        """Create multiple instances asynchronously."""
        instances = []
        for _ in range(size):
            instance = cls.build(**kwargs)
            session.add(instance)
            instances.append(instance)
        
        await session.commit()
        
        for instance in instances:
            await session.refresh(instance)
        
        return instances


class UserFactory(AsyncSQLAlchemyModelFactory):
    """Factory for User model."""
    
    class Meta:
        model = User
    
    email = Faker('email')
    username = Faker('user_name')
    full_name = Faker('name')
    hashed_password = factory.LazyFunction(lambda: get_password_hash('testpass123'))
    is_active = True
    is_superuser = False
    is_verified = True
    avatar_url = Faker('image_url')
    timezone = 'UTC'
    notification_preferences = '{"email": true, "push": true, "mentions": true}'


class AdminUserFactory(UserFactory):
    """Factory for admin user."""
    
    is_superuser = True
    email = 'admin@example.com'
    username = 'admin'
    full_name = 'Admin User'


class TeamFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Team model."""
    
    class Meta:
        model = Team
    
    name = Faker('company')
    slug = factory.LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
    description = Faker('text', max_nb_chars=500)
    logo_url = Faker('image_url')
    is_active = True
    default_task_view = 'kanban'
    ai_features_enabled = True
    max_members = 50


class ActivityFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Activity model."""
    
    class Meta:
        model = Activity
    
    action = factory.Iterator(['created', 'updated', 'deleted', 'completed', 'assigned'])
    entity_type = factory.Iterator(['task', 'project', 'team', 'comment'])
    entity_id = factory.Faker('uuid4')
    old_value = factory.Faker('json')
    new_value = factory.Faker('json')
    ip_address = Faker('ipv4')
    user_agent = Faker('user_agent')


class AttachmentFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Attachment model."""
    
    class Meta:
        model = Attachment
    
    filename = Faker('file_name')
    original_filename = factory.LazyAttribute(lambda obj: obj.filename)
    file_size = Faker('random_int', min=1024, max=10485760)  # 1KB to 10MB
    content_type = factory.Iterator(['image/png', 'image/jpeg', 'application/pdf', 'text/plain'])
    s3_key = factory.LazyAttribute(lambda obj: f'attachments/{obj.filename}')
    s3_bucket = 'taskflow-attachments'
    is_public = False


class CommentFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Comment model."""
    
    class Meta:
        model = Comment
    
    content = Faker('text', max_nb_chars=1000)
    is_edited = False
    mentions = factory.List([])
    parent_id = None


class TaskFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Task model."""
    
    class Meta:
        model = Task
    
    title = Faker('sentence', nb_words=4)
    description = Faker('text', max_nb_chars=200)
    status = factory.Iterator([status.value for status in TaskStatus])
    priority = factory.Iterator([priority.value for priority in TaskPriority])
    created_by = factory.SubFactory(UserFactory)
    assignee_id = factory.LazyAttribute(lambda obj: obj.created_by)
    due_date = Faker('future_datetime', end_date='+30d', tzinfo=timezone.utc)
    tags = factory.List([
        factory.Faker('word') for _ in range(factory.Faker('random_int', min=0, max=3))
    ])
    ai_score = Faker('random_int', min=0, max=100)
    estimated_hours = Faker('random_int', min=1, max=40)
    actual_hours = None
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class TodoTaskFactory(TaskFactory):
    """Factory for TODO tasks."""
    
    status = TaskStatus.TODO.value


class InProgressTaskFactory(TaskFactory):
    """Factory for IN_PROGRESS tasks."""
    
    status = TaskStatus.IN_PROGRESS.value
    actual_hours = Faker('random_int', min=1, max=10)


class CompletedTaskFactory(TaskFactory):
    """Factory for COMPLETED tasks."""
    
    status = TaskStatus.COMPLETED.value
    actual_hours = Faker('random_int', min=1, max=20)
    completed_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class UrgentTaskFactory(TaskFactory):
    """Factory for urgent tasks."""
    
    priority = TaskPriority.URGENT.value
    due_date = Faker('future_datetime', end_date='+3d', tzinfo=timezone.utc)


class TeamMembershipFactory(AsyncSQLAlchemyModelFactory):
    """Factory for TeamMembership model."""
    
    class Meta:
        model = TeamMembership
    
    role = factory.Iterator(['owner', 'admin', 'member', 'viewer'])
    status = 'active'
    joined_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    is_favorite = False


class TeamInvitationFactory(AsyncSQLAlchemyModelFactory):
    """Factory for TeamInvitation model."""
    
    class Meta:
        model = TeamInvitation
    
    email = Faker('email')
    role = factory.Iterator(['admin', 'member', 'viewer'])
    token = factory.LazyFunction(lambda: f"invite_token_{Faker('uuid4')}")
    message = Faker('text', max_nb_chars=200)
    status = 'pending'
    expires_at = Faker('future_datetime', end_date='+7d', tzinfo=timezone.utc)


class NotificationFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Notification model."""
    
    class Meta:
        model = Notification
    
    type = factory.Iterator(['task_assigned', 'task_completed', 'mention', 'team_invite'])
    title = Faker('sentence', nb_words=4)
    message = Faker('text', max_nb_chars=200)
    priority = factory.Iterator(['low', 'normal', 'high', 'urgent'])
    category = factory.Iterator(['task', 'team', 'project', 'system'])
    is_read = False


class NotificationPreferenceFactory(AsyncSQLAlchemyModelFactory):
    """Factory for NotificationPreference model."""
    
    class Meta:
        model = NotificationPreference
    
    email_enabled = True
    email_task_assigned = True
    email_task_completed = True
    email_mentions = True
    email_team_invites = True
    email_digest_frequency = 'daily'
    push_enabled = True
    push_task_assigned = True
    push_task_completed = False
    push_mentions = True
    push_team_invites = True
    quiet_hours_enabled = False


class FileAttachmentFactory(AsyncSQLAlchemyModelFactory):
    """Factory for FileAttachment model."""
    
    class Meta:
        model = FileAttachment
    
    filename = factory.LazyFunction(lambda: f"{Faker('uuid4')}.txt")
    original_filename = Faker('file_name')
    content_type = factory.Iterator(['text/plain', 'image/png', 'image/jpeg', 'application/pdf'])
    file_size = Faker('random_int', min=1024, max=10485760)  # 1KB to 10MB
    file_path = factory.LazyAttribute(lambda obj: f"uploads/{obj.filename}")
    file_hash = factory.LazyFunction(lambda: Faker('sha256'))
    is_image = factory.LazyAttribute(lambda obj: obj.content_type.startswith('image/'))
    is_public = False
    virus_scan_status = 'clean'
    download_count = 0


class AnalyticsInsightFactory(AsyncSQLAlchemyModelFactory):
    """Factory for AnalyticsInsight model."""
    
    class Meta:
        model = AnalyticsInsight
    
    type = factory.Iterator(['productivity', 'bottleneck', 'trend', 'recommendation'])
    category = factory.Iterator(['performance', 'collaboration', 'efficiency'])
    title = Faker('sentence', nb_words=5)
    description = Faker('text', max_nb_chars=300)
    confidence_score = Faker('random.uniform', a=0.5, b=1.0)
    impact_score = Faker('random.uniform', a=0.3, b=1.0)
    is_actionable = factory.Iterator([True, False])
    status = 'active'


class ProjectFactory(AsyncSQLAlchemyModelFactory):
    """Factory for Project model (if it exists)."""
    
    # This would need to be implemented based on your Project model
    pass


# Sequences for unique values
email_sequence = factory.Sequence(lambda n: f"user{n}@example.com")
title_sequence = factory.Sequence(lambda n: f"Task {n}")


class UserFactoryWithSequence(UserFactory):
    """User factory with unique email sequence."""
    
    email = email_sequence


class TaskFactoryWithSequence(TaskFactory):
    """Task factory with unique title sequence."""
    
    title = title_sequence


# Factory traits for specific scenarios
class TaskFactoryTraits:
    """Common task factory traits."""
    
    @staticmethod
    def overdue():
        """Create an overdue task."""
        return {
            'due_date': Faker('past_datetime', start_date='-7d', tzinfo=timezone.utc),
            'status': TaskStatus.TODO.value,
        }
    
    @staticmethod
    def high_priority():
        """Create a high priority task."""
        return {
            'priority': TaskPriority.HIGH.value,
        }
    
    @staticmethod
    def with_ai_prediction():
        """Create a task with AI predictions."""
        return {
            'ai_score': Faker('random_int', min=80, max=100),
            'predicted_completion_date': Faker('future_datetime', end_date='+14d', tzinfo=timezone.utc),
        }
    
    @staticmethod
    def with_tags(tags: list[str]):
        """Create a task with specific tags."""
        return {
            'tags': tags,
        }


# Preset factories for common test scenarios
class TestScenarioFactories:
    """Factories for common test scenarios."""
    
    @staticmethod
    async def create_user_with_tasks(
        session: AsyncSession, 
        num_tasks: int = 5
    ) -> tuple[User, list[Task]]:
        """Create a user with multiple tasks."""
        user = await UserFactory.create_async(session)
        tasks = await TaskFactory.create_batch_async(
            session, 
            size=num_tasks, 
            created_by=user.id,
            assignee_id=user.id
        )
        return user, tasks
    
    @staticmethod
    async def create_task_board_scenario(
        session: AsyncSession
    ) -> tuple[User, dict[str, list[Task]]]:
        """Create a full task board scenario with tasks in different statuses."""
        user = await UserFactory.create_async(session)
        
        tasks_by_status = {
            'todo': await TodoTaskFactory.create_batch_async(
                session, 3, created_by=user.id, assignee_id=user.id
            ),
            'in_progress': await InProgressTaskFactory.create_batch_async(
                session, 2, created_by=user.id, assignee_id=user.id
            ),
            'completed': await CompletedTaskFactory.create_batch_async(
                session, 4, created_by=user.id, assignee_id=user.id
            ),
        }
        
        return user, tasks_by_status
    
    @staticmethod
    async def create_team_with_members(
        session: AsyncSession,
        num_members: int = 5,
        admin_count: int = 1
    ) -> tuple[Team, list[User], list[User]]:
        """Create a team with members and admins."""
        team = await TeamFactory.create_async(session)
        
        # Create admin users
        admins = await UserFactory.create_batch_async(session, admin_count)
        
        # Create regular members
        members = await UserFactory.create_batch_async(session, num_members - admin_count)
        
        # Add users to team with roles
        for admin in admins:
            await session.execute(
                user_teams.insert().values(
                    user_id=admin.id,
                    team_id=team.id,
                    role='admin'
                )
            )
        
        for member in members:
            await session.execute(
                user_teams.insert().values(
                    user_id=member.id,
                    team_id=team.id,
                    role='member'
                )
            )
        
        await session.commit()
        return team, admins, members
    
    @staticmethod
    async def create_team_collaboration_scenario(
        session: AsyncSession
    ) -> dict:
        """Create a full team collaboration scenario with tasks, comments, and activities."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(session, 8, 2)
        all_users = admins + members
        
        # Create tasks assigned to different team members
        tasks = []
        for i, user in enumerate(all_users[:5]):
            task = await TaskFactory.create_async(
                session,
                team_id=team.id,
                creator_id=admins[0].id,
                assignee_id=user.id,
                title=f"Team Task {i+1}"
            )
            tasks.append(task)
        
        # Create comments on tasks
        comments = []
        for task in tasks[:3]:
            comment = await CommentFactory.create_async(
                session,
                task_id=task.id,
                author_id=factory.random.choice(all_users).id,
                content=f"Comment on {task.title}"
            )
            comments.append(comment)
        
        # Create activities
        activities = []
        for task in tasks:
            activity = await ActivityFactory.create_async(
                session,
                user_id=task.creator_id,
                team_id=team.id,
                action='created',
                entity_type='task',
                entity_id=task.id
            )
            activities.append(activity)
        
        return {
            'team': team,
            'admins': admins,
            'members': members,
            'all_users': all_users,
            'tasks': tasks,
            'comments': comments,
            'activities': activities
        }
    
    @staticmethod
    async def create_analytics_test_data(
        session: AsyncSession,
        days_back: int = 30
    ) -> dict:
        """Create comprehensive test data for analytics testing."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(session, 10, 2)
        all_users = admins + members
        
        # Create tasks over time period
        tasks = []
        for i in range(50):
            # Distribute tasks over the time period
            days_offset = i % days_back
            created_date = datetime.now(timezone.utc).replace(
                day=datetime.now().day - days_offset if datetime.now().day > days_offset else 1 
            )
            
            task = await TaskFactory.create_async(
                session,
                team_id=team.id,
                creator_id=factory.random.choice(admins).id,
                assignee_id=factory.random.choice(all_users).id,
                created_at=created_date,
                status=factory.random.choice(['todo', 'in_progress', 'completed']),
                priority=factory.random.choice(['low', 'medium', 'high', 'urgent']),
                estimated_hours=factory.random.randint(1, 16),
                actual_hours=factory.random.randint(1, 20) if factory.random.choice([True, False]) else None
            )
            tasks.append(task)
        
        # Create activities for analytics
        activities = []
        for task in tasks:
            activity = await ActivityFactory.create_async(
                session,
                user_id=task.creator_id,
                team_id=team.id,
                action='created',
                entity_type='task',
                entity_id=task.id,
                created_at=task.created_at
            )
            activities.append(activity)
        
        return {
            'team': team,
            'users': all_users,
            'tasks': tasks,
            'activities': activities,
            'date_range': (
                datetime.now(timezone.utc) - timezone.timedelta(days=days_back),
                datetime.now(timezone.utc)
            )
        }