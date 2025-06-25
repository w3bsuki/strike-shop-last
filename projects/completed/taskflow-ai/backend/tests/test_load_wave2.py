"""
Load testing for Wave 2 features
Extended load testing with team collaboration, analytics, and file uploads
"""
import asyncio
import time
import statistics
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from locust import HttpUser, task, between, events
from locust.clients import ResponseContextManager
import json
import random
import string
import tempfile
import os


class TeamCollaborationUser(HttpUser):
    """Load test user simulating team collaboration patterns."""
    
    wait_time = between(1, 5)
    
    def on_start(self):
        """Initialize user session."""
        self.authenticate()
        self.team_id = None
        self.project_id = None
        self.task_ids = []
        self.user_id = None
        
    def authenticate(self):
        """Authenticate user for load testing."""
        # Create test user
        user_data = {
            "email": f"loadtest_{random.randint(1000, 9999)}@example.com",
            "password": "testpass123",
            "full_name": f"Load Test User {random.randint(1, 1000)}"
        }
        
        response = self.client.post("/api/v1/auth/register", json=user_data)
        if response.status_code == 201:
            self.user_id = response.json()["id"]
            
            # Login to get token
            login_response = self.client.post("/api/v1/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            
            if login_response.status_code == 200:
                token = login_response.json()["access_token"]
                self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    @task(3)
    def create_and_manage_team(self):
        """Test team creation and management under load."""
        if not self.team_id:
            # Create team
            team_data = {
                "name": f"Load Test Team {random.randint(1, 10000)}",
                "description": "Team created during load testing",
                "default_task_view": random.choice(["kanban", "list", "calendar"])
            }
            
            with self.client.post("/api/v1/teams", json=team_data, catch_response=True) as response:
                if response.status_code == 201:
                    self.team_id = response.json()["id"]
                    response.success()
                else:
                    response.failure(f"Failed to create team: {response.status_code}")
        
        if self.team_id:
            # Get team details
            self.client.get(f"/api/v1/teams/{self.team_id}")
            
            # Invite team members (simulate)
            if random.random() < 0.3:  # 30% chance to invite
                invite_data = {
                    "email": f"member_{random.randint(1, 1000)}@example.com",
                    "role": random.choice(["member", "admin"]),
                    "message": "Join our load testing team!"
                }
                self.client.post(f"/api/v1/teams/{self.team_id}/invite", json=invite_data)
    
    @task(5)
    def create_and_manage_tasks(self):
        """Test task creation and management under load."""
        if not self.team_id:
            return
            
        # Create tasks
        if len(self.task_ids) < 10:  # Limit to 10 tasks per user
            task_data = {
                "title": f"Load Test Task {random.randint(1, 10000)}",
                "description": f"Task created during load testing at {datetime.now()}",
                "priority": random.choice(["low", "medium", "high", "urgent"]),
                "status": "todo",
                "team_id": self.team_id,
                "estimated_hours": random.randint(1, 16)
            }
            
            with self.client.post("/api/v1/tasks", json=task_data, catch_response=True) as response:
                if response.status_code == 201:
                    task_id = response.json()["id"]
                    self.task_ids.append(task_id)
                    response.success()
                else:
                    response.failure(f"Failed to create task: {response.status_code}")
        
        # Update existing tasks
        if self.task_ids:
            task_id = random.choice(self.task_ids)
            
            # Get task details
            self.client.get(f"/api/v1/tasks/{task_id}")
            
            # Update task
            if random.random() < 0.4:  # 40% chance to update
                update_data = {
                    "status": random.choice(["todo", "in_progress", "completed"]),
                    "actual_hours": random.randint(1, 20) if random.random() < 0.5 else None
                }
                self.client.patch(f"/api/v1/tasks/{task_id}", json=update_data)
            
            # Add comment
            if random.random() < 0.3:  # 30% chance to comment
                comment_data = {
                    "content": f"Load test comment at {datetime.now()}",
                    "task_id": task_id
                }
                self.client.post("/api/v1/comments", json=comment_data)
    
    @task(2)
    def team_activity_and_analytics(self):
        """Test team activity feed and analytics under load."""
        if not self.team_id:
            return
        
        # Get team activity feed
        self.client.get(f"/api/v1/teams/{self.team_id}/activity?limit=20")
        
        # Get team analytics
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/productivity")
        
        # Get member performance
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/members")
        
        # Test date filtering
        start_date = (datetime.now() - timedelta(days=30)).date().isoformat()
        end_date = datetime.now().date().isoformat()
        self.client.get(
            f"/api/v1/teams/{self.team_id}/analytics/productivity"
            f"?start_date={start_date}&end_date={end_date}"
        )
    
    @task(1)
    def file_upload_simulation(self):
        """Test file upload under load."""
        if not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        
        # Create temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            # Generate random content
            content = ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(100, 1000)))
            f.write(content)
            temp_file_path = f.name
        
        try:
            # Upload file
            with open(temp_file_path, 'rb') as file:
                files = {'file': (os.path.basename(temp_file_path), file, 'text/plain')}
                data = {'task_id': task_id}
                
                with self.client.post("/api/v1/attachments/upload", 
                                    files=files, data=data, catch_response=True) as response:
                    if response.status_code == 201:
                        response.success()
                    else:
                        response.failure(f"File upload failed: {response.status_code}")
        finally:
            # Cleanup temp file
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
    
    @task(1)
    def search_and_filter_operations(self):
        """Test search and filter operations under load."""
        if not self.team_id:
            return
        
        # Search tasks
        search_terms = ["test", "load", "task", "bug", "feature"]
        search_term = random.choice(search_terms)
        self.client.get(f"/api/v1/tasks/search?q={search_term}&team_id={self.team_id}")
        
        # Filter tasks by status
        status = random.choice(["todo", "in_progress", "completed"])
        self.client.get(f"/api/v1/teams/{self.team_id}/tasks?status={status}")
        
        # Filter by priority
        priority = random.choice(["low", "medium", "high", "urgent"])
        self.client.get(f"/api/v1/teams/{self.team_id}/tasks?priority={priority}")
        
        # Filter by assignee
        if self.user_id:
            self.client.get(f"/api/v1/teams/{self.team_id}/tasks?assignee_id={self.user_id}")


class AnalyticsHeavyUser(HttpUser):
    """User focused on analytics and reporting operations."""
    
    wait_time = between(2, 8)
    
    def on_start(self):
        self.authenticate()
        self.team_id = self.create_team_with_data()
    
    def authenticate(self):
        """Authenticate user."""
        user_data = {
            "email": f"analytics_{random.randint(1000, 9999)}@example.com",
            "password": "testpass123",
            "full_name": f"Analytics User {random.randint(1, 1000)}"
        }
        
        response = self.client.post("/api/v1/auth/register", json=user_data)
        if response.status_code == 201:
            login_response = self.client.post("/api/v1/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            
            if login_response.status_code == 200:
                token = login_response.json()["access_token"]
                self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    def create_team_with_data(self):
        """Create team and populate with test data."""
        team_data = {
            "name": f"Analytics Team {random.randint(1, 10000)}",
            "description": "Team for analytics load testing"
        }
        
        response = self.client.post("/api/v1/teams", json=team_data)
        if response.status_code == 201:
            team_id = response.json()["id"]
            
            # Create multiple tasks for analytics
            for i in range(random.randint(20, 50)):
                task_data = {
                    "title": f"Analytics Task {i}",
                    "description": f"Task for analytics testing",
                    "priority": random.choice(["low", "medium", "high", "urgent"]),
                    "status": random.choice(["todo", "in_progress", "completed"]),
                    "team_id": team_id,
                    "estimated_hours": random.randint(1, 16),
                    "actual_hours": random.randint(1, 20) if random.random() < 0.6 else None
                }
                self.client.post("/api/v1/tasks", json=task_data)
            
            return team_id
        return None
    
    @task(3)
    def get_productivity_analytics(self):
        """Test productivity analytics endpoints."""
        if not self.team_id:
            return
        
        # Basic productivity metrics
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/productivity")
        
        # With different date ranges
        date_ranges = [
            (7, "week"),
            (30, "month"),
            (90, "quarter"),
            (365, "year")
        ]
        
        days_back, period = random.choice(date_ranges)
        start_date = (datetime.now() - timedelta(days=days_back)).date().isoformat()
        end_date = datetime.now().date().isoformat()
        
        self.client.get(
            f"/api/v1/teams/{self.team_id}/analytics/productivity"
            f"?start_date={start_date}&end_date={end_date}&period={period}"
        )
    
    @task(2)
    def get_member_performance_analytics(self):
        """Test member performance analytics."""
        if not self.team_id:
            return
        
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/members")
        
        # Get individual member analytics
        members_response = self.client.get(f"/api/v1/teams/{self.team_id}/members")
        if members_response.status_code == 200:
            members = members_response.json().get("members", [])
            if members:
                member_id = random.choice(members)["user_id"]
                self.client.get(f"/api/v1/teams/{self.team_id}/members/{member_id}/analytics")
    
    @task(2)
    def get_time_tracking_analytics(self):
        """Test time tracking analytics."""
        if not self.team_id:
            return
        
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/time-tracking")
        
        # Get burndown chart data
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/burndown")
        
        # Get velocity metrics
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/velocity?weeks=4")
    
    @task(1)
    def export_analytics_data(self):
        """Test analytics export functionality."""
        if not self.team_id:
            return
        
        # Export CSV
        self.client.get(f"/api/v1/teams/{self.team_id}/analytics/export/csv")
        
        # Export PDF (less frequently due to resource intensity)
        if random.random() < 0.3:
            self.client.get(f"/api/v1/teams/{self.team_id}/analytics/export/pdf")


class FileUploadHeavyUser(HttpUser):
    """User focused on file upload operations."""
    
    wait_time = between(3, 10)
    
    def on_start(self):
        self.authenticate()
        self.team_id = self.setup_team()
        self.task_ids = self.create_tasks()
    
    def authenticate(self):
        """Authenticate user."""
        user_data = {
            "email": f"fileuser_{random.randint(1000, 9999)}@example.com",
            "password": "testpass123",
            "full_name": f"File User {random.randint(1, 1000)}"
        }
        
        response = self.client.post("/api/v1/auth/register", json=user_data)
        if response.status_code == 201:
            login_response = self.client.post("/api/v1/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            
            if login_response.status_code == 200:
                token = login_response.json()["access_token"]
                self.client.headers.update({"Authorization": f"Bearer {token}"})
    
    def setup_team(self):
        """Setup team for file testing."""
        team_data = {
            "name": f"File Team {random.randint(1, 10000)}",
            "description": "Team for file upload testing"
        }
        
        response = self.client.post("/api/v1/teams", json=team_data)
        return response.json()["id"] if response.status_code == 201 else None
    
    def create_tasks(self):
        """Create tasks for file attachments."""
        if not self.team_id:
            return []
        
        task_ids = []
        for i in range(5):
            task_data = {
                "title": f"File Task {i}",
                "description": "Task for file upload testing",
                "team_id": self.team_id
            }
            response = self.client.post("/api/v1/tasks", json=task_data)
            if response.status_code == 201:
                task_ids.append(response.json()["id"])
        
        return task_ids
    
    @task(4)
    def upload_small_files(self):
        """Test uploading small files."""
        if not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        
        # Create small file (1KB - 100KB)
        file_size = random.randint(1024, 100 * 1024)
        content = ''.join(random.choices(string.ascii_letters + string.digits, k=file_size))
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {'file': (f'small_file_{random.randint(1, 1000)}.txt', file, 'text/plain')}
                data = {'task_id': task_id}
                
                start_time = time.time()
                response = self.client.post("/api/v1/attachments/upload", files=files, data=data)
                upload_time = time.time() - start_time
                
                # Track upload performance
                events.request.fire(
                    request_type="FILE_UPLOAD",
                    name=f"small_file_{file_size}B",
                    response_time=upload_time * 1000,
                    response_length=len(content),
                    exception=None if response.status_code == 201 else Exception(f"Upload failed: {response.status_code}")
                )
        finally:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
    
    @task(2)
    def upload_medium_files(self):
        """Test uploading medium files."""
        if not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        
        # Create medium file (100KB - 5MB)
        file_size = random.randint(100 * 1024, 5 * 1024 * 1024)
        
        with tempfile.NamedTemporaryFile(delete=False) as f:
            # Write random bytes
            for _ in range(file_size // 1024):
                f.write(os.urandom(1024))
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {'file': (f'medium_file_{random.randint(1, 1000)}.bin', file, 'application/octet-stream')}
                data = {'task_id': task_id}
                
                start_time = time.time()
                response = self.client.post("/api/v1/attachments/upload", files=files, data=data)
                upload_time = time.time() - start_time
                
                events.request.fire(
                    request_type="FILE_UPLOAD",
                    name=f"medium_file_{file_size}B",
                    response_time=upload_time * 1000,
                    response_length=file_size,
                    exception=None if response.status_code == 201 else Exception(f"Upload failed: {response.status_code}")
                )
        finally:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
    
    @task(1)
    def upload_large_files(self):
        """Test uploading large files (stress test)."""
        if not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        
        # Create large file (5MB - 25MB)
        file_size = random.randint(5 * 1024 * 1024, 25 * 1024 * 1024)
        
        with tempfile.NamedTemporaryFile(delete=False) as f:
            # Write in chunks to avoid memory issues
            chunk_size = 1024 * 1024  # 1MB chunks
            for _ in range(file_size // chunk_size):
                f.write(os.urandom(chunk_size))
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {'file': (f'large_file_{random.randint(1, 1000)}.bin', file, 'application/octet-stream')}
                data = {'task_id': task_id}
                
                start_time = time.time()
                with self.client.post("/api/v1/attachments/upload", files=files, data=data, catch_response=True) as response:
                    upload_time = time.time() - start_time
                    
                    if response.status_code == 201:
                        response.success()
                    else:
                        response.failure(f"Large file upload failed: {response.status_code}")
                    
                    events.request.fire(
                        request_type="FILE_UPLOAD",
                        name=f"large_file_{file_size}B",
                        response_time=upload_time * 1000,
                        response_length=file_size,
                        exception=None if response.status_code == 201 else Exception(f"Upload failed: {response.status_code}")
                    )
        finally:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
    
    @task(2)
    def download_files(self):
        """Test file download operations."""
        # Get list of attachments
        response = self.client.get("/api/v1/attachments")
        if response.status_code == 200:
            attachments = response.json().get("items", [])
            if attachments:
                attachment = random.choice(attachments)
                attachment_id = attachment["id"]
                
                # Download file
                start_time = time.time()
                download_response = self.client.get(f"/api/v1/attachments/{attachment_id}/download")
                download_time = time.time() - start_time
                
                events.request.fire(
                    request_type="FILE_DOWNLOAD",
                    name=f"download_{attachment.get('filename', 'unknown')}",
                    response_time=download_time * 1000,
                    response_length=len(download_response.content) if download_response.status_code == 200 else 0,
                    exception=None if download_response.status_code in [200, 302] else Exception(f"Download failed: {download_response.status_code}")
                )


class RealtimeCollaborationUser(HttpUser):
    """User simulating real-time collaboration patterns."""
    
    wait_time = between(1, 3)
    
    def on_start(self):
        self.authenticate()
        self.team_id = self.join_or_create_team()
        self.setup_websocket()
    
    def authenticate(self):
        """Authenticate user."""
        user_data = {
            "email": f"realtime_{random.randint(1000, 9999)}@example.com",
            "password": "testpass123",
            "full_name": f"Realtime User {random.randint(1, 1000)}"
        }
        
        response = self.client.post("/api/v1/auth/register", json=user_data)
        if response.status_code == 201:
            self.user_id = response.json()["id"]
            
            login_response = self.client.post("/api/v1/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            
            if login_response.status_code == 200:
                token = login_response.json()["access_token"]
                self.client.headers.update({"Authorization": f"Bearer {token}"})
                self.auth_token = token
    
    def join_or_create_team(self):
        """Join existing team or create new one."""
        # Try to get list of teams first
        response = self.client.get("/api/v1/teams")
        if response.status_code == 200:
            teams = response.json().get("items", [])
            if teams and random.random() < 0.7:  # 70% chance to join existing
                return random.choice(teams)["id"]
        
        # Create new team
        team_data = {
            "name": f"Realtime Team {random.randint(1, 10000)}",
            "description": "Team for real-time collaboration testing"
        }
        
        response = self.client.post("/api/v1/teams", json=team_data)
        return response.json()["id"] if response.status_code == 201 else None
    
    def setup_websocket(self):
        """Setup WebSocket connection for real-time features."""
        # In a real load test, you would establish actual WebSocket connections
        # For now, we'll simulate the HTTP endpoints that would trigger WebSocket events
        pass
    
    @task(3)
    def rapid_task_updates(self):
        """Simulate rapid task updates that trigger real-time events."""
        if not self.team_id:
            return
        
        # Get team tasks
        response = self.client.get(f"/api/v1/teams/{self.team_id}/tasks")
        if response.status_code == 200:
            tasks = response.json().get("items", [])
            if tasks:
                task = random.choice(tasks)
                task_id = task["id"]
                
                # Rapid status updates
                statuses = ["todo", "in_progress", "completed"]
                new_status = random.choice(statuses)
                
                self.client.patch(f"/api/v1/tasks/{task_id}", json={"status": new_status})
                
                # Add comment (triggers mention notifications)
                if random.random() < 0.4:
                    comment_data = {
                        "content": f"Real-time update at {datetime.now().isoformat()}",
                        "task_id": task_id
                    }
                    self.client.post("/api/v1/comments", json=comment_data)
    
    @task(2)
    def activity_feed_polling(self):
        """Simulate frequent activity feed updates."""
        if not self.team_id:
            return
        
        # Poll activity feed frequently (simulates real-time updates)
        self.client.get(f"/api/v1/teams/{self.team_id}/activity?limit=10")
        
        # Check for new notifications
        self.client.get("/api/v1/notifications?unread=true")
    
    @task(1)
    def presence_updates(self):
        """Simulate presence updates."""
        if not self.team_id:
            return
        
        # Update user presence
        presence_data = {
            "status": random.choice(["online", "away", "busy"]),
            "current_page": random.choice(["dashboard", "tasks", "calendar", "settings"])
        }
        
        self.client.post("/api/v1/presence", json=presence_data)
        
        # Get team presence
        self.client.get(f"/api/v1/teams/{self.team_id}/presence")


# Performance metrics tracking
upload_times = []
download_times = []
response_times = []

@events.request.add_listener
def track_performance(request_type, name, response_time, response_length, **kwargs):
    """Track performance metrics for analysis."""
    response_times.append(response_time)
    
    if request_type == "FILE_UPLOAD":
        upload_times.append(response_time)
    elif request_type == "FILE_DOWNLOAD":
        download_times.append(response_time)

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Print performance summary when test stops."""
    if response_times:
        print(f"\n--- Performance Summary ---")
        print(f"Total requests: {len(response_times)}")
        print(f"Average response time: {statistics.mean(response_times):.2f}ms")
        print(f"Median response time: {statistics.median(response_times):.2f}ms")
        print(f"95th percentile: {statistics.quantiles(response_times, n=20)[18]:.2f}ms")
        
        if upload_times:
            print(f"\nFile Upload Performance:")
            print(f"Average upload time: {statistics.mean(upload_times):.2f}ms")
            print(f"Median upload time: {statistics.median(upload_times):.2f}ms")
        
        if download_times:
            print(f"\nFile Download Performance:")
            print(f"Average download time: {statistics.mean(download_times):.2f}ms")
            print(f"Median download time: {statistics.median(download_times):.2f}ms")


# Example usage:
# Run team collaboration load test:
# locust -f test_load_wave2.py TeamCollaborationUser --host http://localhost:8000

# Run analytics heavy load test:
# locust -f test_load_wave2.py AnalyticsHeavyUser --host http://localhost:8000

# Run file upload load test:
# locust -f test_load_wave2.py FileUploadHeavyUser --host http://localhost:8000

# Run all user types together:
# locust -f test_load_wave2.py --host http://localhost:8000