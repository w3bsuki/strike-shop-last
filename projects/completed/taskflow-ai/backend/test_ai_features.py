#!/usr/bin/env python3
"""
Test script for TaskFlow AI features
Run this to verify AI functionality is working correctly
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import ai_service
from app.services.cache_service import cache_service
from app.models.task import Task
from app.core.config import settings


class MockTask:
    """Mock task for testing purposes"""
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', 'test-task-123')
        self.title = kwargs.get('title', 'Test Task')
        self.description = kwargs.get('description', 'Test description')
        self.priority = kwargs.get('priority', 'medium')
        self.status = kwargs.get('status', 'todo')
        self.created_at = kwargs.get('created_at', datetime.now())
        self.due_date = kwargs.get('due_date')
        self.estimated_hours = kwargs.get('estimated_hours', 4.0)
        self.ai_tags = kwargs.get('ai_tags', [])
        self.assignee_id = kwargs.get('assignee_id')
        self.team_id = kwargs.get('team_id', 'test-team')
        self.dependencies = kwargs.get('dependencies', [])
        self.dependents = kwargs.get('dependents', [])


async def test_ai_initialization():
    """Test if AI services are properly initialized"""
    print("🔧 Testing AI Service Initialization...")
    
    # Check OpenAI client
    if ai_service.client:
        print("✅ OpenAI client initialized")
        print(f"   Model: {ai_service.model}")
    else:
        print("❌ OpenAI client not initialized")
        print(f"   API Key configured: {settings.OPENAI_API_KEY is not None}")
        return False
    
    # Check Redis cache
    if cache_service.redis_client:
        try:
            await cache_service.redis_client.ping()
            print("✅ Redis cache connected")
        except Exception as e:
            print(f"❌ Redis cache connection failed: {e}")
            return False
    else:
        print("❌ Redis cache not initialized")
        return False
    
    return True


async def test_natural_language_parsing():
    """Test natural language task parsing"""
    print("\n🗣️  Testing Natural Language Parsing...")
    
    test_inputs = [
        "Create a login page with React by tomorrow, high priority, estimated 6 hours",
        "Fix the database connection bug ASAP",
        "Update documentation for the API endpoints next week",
        "Add user authentication to the mobile app"
    ]
    
    for i, input_text in enumerate(test_inputs, 1):
        try:
            print(f"\n   Test {i}: '{input_text}'")
            result = await ai_service.parse_natural_language_task(input_text)
            
            print(f"   ✅ Title: {result.get('title', 'N/A')}")
            print(f"   ✅ Priority: {result.get('priority', 'N/A')}")
            print(f"   ✅ Estimated Hours: {result.get('estimated_hours', 'N/A')}")
            print(f"   ✅ Tags: {result.get('tags', [])}")
            
            if result.get('due_date'):
                print(f"   ✅ Due Date: {result['due_date']}")
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            return False
    
    return True


async def test_task_tagging():
    """Test automatic task tagging"""
    print("\n🏷️  Testing Task Tagging...")
    
    test_tasks = [
        MockTask(
            title="Implement user authentication",
            description="Add login and registration functionality with JWT tokens"
        ),
        MockTask(
            title="Fix CSS styling issues",
            description="The homepage layout is broken on mobile devices"
        ),
        MockTask(
            title="Optimize database queries",
            description="Some queries are running slowly and need indexing"
        )
    ]
    
    for i, task in enumerate(test_tasks, 1):
        try:
            print(f"\n   Task {i}: '{task.title}'")
            tags = await ai_service.generate_task_tags(task)
            print(f"   ✅ Generated tags: {tags}")
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            return False
    
    return True


async def test_priority_scoring():
    """Test AI priority scoring"""
    print("\n🎯 Testing Priority Scoring...")
    
    test_task = MockTask(
        title="Critical security vulnerability fix",
        description="SQL injection vulnerability in user login",
        priority="urgent",
        due_date=datetime.now()
    )
    
    try:
        score = await ai_service.calculate_task_priority_score(
            test_task, [], {}
        )
        print(f"   ✅ Priority score: {score}/10")
        
        if 7 <= score <= 10:
            print("   ✅ Score in expected range for urgent task")
        else:
            print(f"   ⚠️  Score seems low for urgent task: {score}")
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    
    return True


async def test_time_estimation():
    """Test task time estimation"""
    print("\n⏱️  Testing Time Estimation...")
    
    test_task = MockTask(
        title="Build user dashboard",
        description="Create a React dashboard with charts and user data display"
    )
    
    try:
        estimated_hours, completion_date = await ai_service.estimate_task_completion_time(
            test_task, []
        )
        
        print(f"   ✅ Estimated hours: {estimated_hours}")
        print(f"   ✅ Predicted completion: {completion_date.strftime('%Y-%m-%d %H:%M')}")
        
        if 0.5 <= estimated_hours <= 100:
            print("   ✅ Estimate in reasonable range")
        else:
            print(f"   ⚠️  Estimate seems unrealistic: {estimated_hours} hours")
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    
    return True


async def test_embeddings():
    """Test task embedding generation"""
    print("\n🔍 Testing Embeddings...")
    
    test_task = MockTask(
        title="Implement search functionality",
        description="Add full-text search with filters and sorting"
    )
    
    try:
        embedding = await ai_service.generate_task_embedding(test_task)
        
        if embedding and len(embedding) > 0:
            print(f"   ✅ Generated embedding vector (length: {len(embedding)})")
            print(f"   ✅ Sample values: {embedding[:5]}...")
        else:
            print("   ❌ No embedding generated")
            return False
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    
    return True


async def test_caching():
    """Test caching functionality"""
    print("\n💾 Testing Caching...")
    
    try:
        # Test basic cache operations
        test_key = "test_cache_key"
        test_value = {"test": "data", "timestamp": datetime.now().isoformat()}
        
        # Set cache
        success = await cache_service.set("test", test_key, test_value, ttl=60)
        if success:
            print("   ✅ Cache SET operation successful")
        else:
            print("   ❌ Cache SET operation failed")
            return False
        
        # Get cache
        cached_value = await cache_service.get("test", test_key)
        if cached_value == test_value:
            print("   ✅ Cache GET operation successful")
        else:
            print(f"   ❌ Cache GET mismatch: {cached_value} != {test_value}")
            return False
        
        # Delete cache
        deleted = await cache_service.delete("test", test_key)
        if deleted:
            print("   ✅ Cache DELETE operation successful")
        else:
            print("   ❌ Cache DELETE operation failed")
            return False
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    
    return True


async def test_bottleneck_detection():
    """Test bottleneck detection"""
    print("\n🚧 Testing Bottleneck Detection...")
    
    # Create mock tasks with dependencies
    tasks = [
        MockTask(id="task-1", title="Backend API", status="in_progress"),
        MockTask(id="task-2", title="Frontend UI", status="todo"),
        MockTask(id="task-3", title="Database setup", status="todo"),
        MockTask(id="task-4", title="Testing", status="todo")
    ]
    
    # Mock dependencies (tasks 2, 3, 4 depend on task 1)
    dependencies = [
        {"task_id": "task-2", "depends_on_id": "task-1"},
        {"task_id": "task-3", "depends_on_id": "task-1"}, 
        {"task_id": "task-4", "depends_on_id": "task-1"}
    ]
    
    try:
        bottlenecks = await ai_service.detect_bottlenecks(tasks, dependencies)
        
        if bottlenecks:
            print(f"   ✅ Detected {len(bottlenecks)} bottlenecks")
            for bottleneck in bottlenecks:
                print(f"   ✅ Bottleneck: {bottleneck.get('task_title')} (risk: {bottleneck.get('risk_score')})")
        else:
            print("   ✅ No bottlenecks detected (or empty dataset)")
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    
    return True


async def main():
    """Run all AI feature tests"""
    print("🤖 TaskFlow AI - Feature Test Suite")
    print("=" * 50)
    
    # Track test results
    tests = [
        ("AI Initialization", test_ai_initialization),
        ("Natural Language Parsing", test_natural_language_parsing),
        ("Task Tagging", test_task_tagging),
        ("Priority Scoring", test_priority_scoring),
        ("Time Estimation", test_time_estimation),
        ("Embeddings", test_embeddings),
        ("Caching", test_caching),
        ("Bottleneck Detection", test_bottleneck_detection)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            if result:
                passed += 1
            else:
                failed += 1
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            failed += 1
            print(f"❌ {test_name} ERROR: {e}")
    
    # Results summary
    print("\n" + "=" * 50)
    print("🧪 Test Results Summary")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! AI features are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check configuration and try again.")
        
        if not settings.OPENAI_API_KEY:
            print("\n💡 Tip: Make sure OPENAI_API_KEY is set in your .env file")
        
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())