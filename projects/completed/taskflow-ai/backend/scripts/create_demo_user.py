#!/usr/bin/env python3
"""
Create demo user with sample data for TaskFlow AI testing.
Run this script to set up a rich testing environment.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from typing import List

# Add the parent directory to the path to import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.models.user import User
from app.models.team import Team
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.team_membership import TeamMembership, TeamRole
from app.core.security import get_password_hash
from app.core.database import async_session_factory

async def create_demo_data():
    """Create comprehensive demo data for testing."""
    
    async with async_session_factory() as session:
        try:
            # Create demo user
            demo_user = User(
                email="demo@taskflow.dev",
                full_name="Demo User",
                hashed_password=get_password_hash("DemoPass123!"),
                is_active=True,
                is_verified=True
            )
            session.add(demo_user)
            await session.flush()  # Get the ID
            
            # Create additional team members
            team_members = [
                User(
                    email="alice@taskflow.dev",
                    full_name="Alice Johnson",
                    hashed_password=get_password_hash("AlicePass123!"),
                    is_active=True,
                    is_verified=True
                ),
                User(
                    email="bob@taskflow.dev", 
                    full_name="Bob Smith",
                    hashed_password=get_password_hash("BobPass123!"),
                    is_active=True,
                    is_verified=True
                ),
                User(
                    email="carol@taskflow.dev",
                    full_name="Carol Davis",
                    hashed_password=get_password_hash("CarolPass123!"),
                    is_active=True,
                    is_verified=True
                )
            ]
            
            for member in team_members:
                session.add(member)
            
            await session.flush()  # Get IDs for all users
            
            # Create demo team
            demo_team = Team(
                name="TaskFlow Demo Team",
                description="A sample team to showcase TaskFlow AI features",
                owner_id=demo_user.id
            )
            session.add(demo_team)
            await session.flush()
            
            # Add team memberships
            memberships = [
                TeamMembership(
                    team_id=demo_team.id,
                    user_id=demo_user.id,
                    role=TeamRole.OWNER
                ),
                TeamMembership(
                    team_id=demo_team.id,
                    user_id=team_members[0].id,
                    role=TeamRole.ADMIN
                ),
                TeamMembership(
                    team_id=demo_team.id,
                    user_id=team_members[1].id,
                    role=TeamRole.MEMBER
                ),
                TeamMembership(
                    team_id=demo_team.id,
                    user_id=team_members[2].id,
                    role=TeamRole.MEMBER
                )
            ]
            
            for membership in memberships:
                session.add(membership)
            
            # Create sample tasks with variety
            sample_tasks = [
                # High Priority Tasks
                Task(
                    title="🚀 Launch TaskFlow AI Beta",
                    description="Prepare and launch the beta version of TaskFlow AI with core features",
                    status=TaskStatus.IN_PROGRESS,
                    priority=TaskPriority.HIGH,
                    team_id=demo_team.id,
                    assignee_id=demo_user.id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=7),
                    estimated_hours=40,
                    ai_priority_score=9.5
                ),
                Task(
                    title="🔐 Implement Advanced Security Features",
                    description="Add 2FA, SSO, and enterprise security features",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    team_id=demo_team.id,
                    assignee_id=team_members[0].id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=14),
                    estimated_hours=30,
                    ai_priority_score=9.2
                ),
                
                # Medium Priority Tasks
                Task(
                    title="📊 Build Advanced Analytics Dashboard",
                    description="Create comprehensive analytics with AI insights and export features",
                    status=TaskStatus.IN_PROGRESS,
                    priority=TaskPriority.MEDIUM,
                    team_id=demo_team.id,
                    assignee_id=team_members[1].id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=10),
                    estimated_hours=25,
                    ai_priority_score=7.8
                ),
                Task(
                    title="📱 Mobile App Development",
                    description="Develop native mobile apps for iOS and Android",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.MEDIUM,
                    team_id=demo_team.id,
                    assignee_id=team_members[2].id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=21),
                    estimated_hours=60,
                    ai_priority_score=7.5
                ),
                
                # Completed Tasks for Analytics
                Task(
                    title="✅ Set up CI/CD Pipeline",
                    description="Automated testing and deployment pipeline with GitHub Actions",
                    status=TaskStatus.DONE,
                    priority=TaskPriority.HIGH,
                    team_id=demo_team.id,
                    assignee_id=team_members[0].id,
                    creator_id=demo_user.id,
                    completed_at=datetime.utcnow() - timedelta(days=2),
                    estimated_hours=16,
                    actual_hours=18,
                    ai_priority_score=8.5
                ),
                Task(
                    title="✅ Design System Implementation",
                    description="Implement consistent design system with shadcn/ui components",
                    status=TaskStatus.DONE,
                    priority=TaskPriority.MEDIUM,
                    team_id=demo_team.id,
                    assignee_id=team_members[1].id,
                    creator_id=demo_user.id,
                    completed_at=datetime.utcnow() - timedelta(days=5),
                    estimated_hours=12,
                    actual_hours=10,
                    ai_priority_score=7.0
                ),
                
                # Various Status Tasks
                Task(
                    title="🔍 User Research & Feedback Collection",
                    description="Conduct user interviews and collect feedback for feature prioritization",
                    status=TaskStatus.IN_REVIEW,
                    priority=TaskPriority.MEDIUM,
                    team_id=demo_team.id,
                    assignee_id=team_members[2].id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=5),
                    estimated_hours=20,
                    ai_priority_score=6.8
                ),
                Task(
                    title="📝 API Documentation Update",
                    description="Update API documentation with new endpoints and examples",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.LOW,
                    team_id=demo_team.id,
                    assignee_id=demo_user.id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() + timedelta(days=12),
                    estimated_hours=8,
                    ai_priority_score=5.5
                ),
                Task(
                    title="🎨 UI/UX Improvements",
                    description="Implement user feedback and improve overall user experience",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.LOW,
                    team_id=demo_team.id,
                    assignee_id=team_members[1].id,
                    creator_id=demo_user.id,
                    estimated_hours=15,
                    ai_priority_score=6.2
                ),
                
                # Overdue task for testing
                Task(
                    title="⚠️ Performance Optimization",
                    description="Optimize database queries and API response times",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    team_id=demo_team.id,
                    assignee_id=team_members[0].id,
                    creator_id=demo_user.id,
                    due_date=datetime.utcnow() - timedelta(days=1),  # Overdue
                    estimated_hours=20,
                    ai_priority_score=8.8
                )
            ]
            
            for task in sample_tasks:
                session.add(task)
            
            await session.commit()
            
            print("✅ Demo data created successfully!")
            print("\n🔑 Login credentials:")
            print("Email: demo@taskflow.dev")
            print("Password: DemoPass123!")
            print("\n👥 Additional team members:")
            print("Alice: alice@taskflow.dev / AlicePass123!")
            print("Bob: bob@taskflow.dev / BobPass123!")
            print("Carol: carol@taskflow.dev / CarolPass123!")
            print("\n🚀 Features to test:")
            print("- Task board with drag & drop")
            print("- Analytics dashboard with real data")
            print("- Team collaboration features")
            print("- AI-powered task insights")
            print("- Mobile responsive design")
            print("\n🌐 Access at: http://localhost:3000")
            
        except Exception as e:
            print(f"❌ Error creating demo data: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_demo_data())