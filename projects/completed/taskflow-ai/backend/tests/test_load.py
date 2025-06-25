"""
Load testing with Locust
"""
import random
import json
from locust import HttpUser, task, between, events
from locust.env import Environment


class TaskFlowUser(HttpUser):
    """Simulate a TaskFlow AI user."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Login user when starting."""
        self.login()
    
    def login(self):
        """Login and get access token."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": f"testuser{random.randint(1, 1000)}@example.com",
            "password": "testpass123"
        })
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            self.client.headers["Authorization"] = f"Bearer {token}"
        elif response.status_code == 401:
            # User doesn't exist, register first
            self.register()
    
    def register(self):
        """Register a new user."""
        email = f"testuser{random.randint(1, 10000)}@example.com"
        response = self.client.post("/api/v1/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": f"Test User {random.randint(1, 1000)}"
        })
        
        if response.status_code == 201:
            token = response.json()["access_token"]
            self.client.headers["Authorization"] = f"Bearer {token}"
    
    @task(3)
    def view_tasks(self):
        """View user's tasks."""
        self.client.get("/api/v1/tasks")
    
    @task(2)
    def create_task(self):
        """Create a new task."""
        task_data = {
            "title": f"Load Test Task {random.randint(1, 1000)}",
            "description": "This is a task created during load testing",
            "priority": random.choice(["low", "medium", "high", "urgent"]),
            "tags": [f"tag{i}" for i in range(random.randint(1, 3))]
        }
        
        self.client.post("/api/v1/tasks", json=task_data)
    
    @task(2)
    def update_task(self):
        """Update an existing task."""
        # First get tasks to find one to update
        response = self.client.get("/api/v1/tasks")
        if response.status_code == 200:
            tasks = response.json().get("items", [])
            if tasks:
                task = random.choice(tasks)
                update_data = {
                    "status": random.choice(["todo", "in_progress", "in_review", "completed"]),
                    "priority": random.choice(["low", "medium", "high", "urgent"])
                }
                
                self.client.put(f"/api/v1/tasks/{task['id']}", json=update_data)
    
    @task(1)
    def delete_task(self):
        """Delete a task."""
        # Get tasks to find one to delete
        response = self.client.get("/api/v1/tasks")
        if response.status_code == 200:
            tasks = response.json().get("items", [])
            if tasks:
                task = random.choice(tasks)
                self.client.delete(f"/api/v1/tasks/{task['id']}")
    
    @task(1)
    def get_task_analytics(self):
        """Get task analytics."""
        self.client.get("/api/v1/tasks/analytics")
    
    @task(1)
    def ai_suggest_tasks(self):
        """Get AI task suggestions."""
        contexts = [
            "I need to prepare for a client meeting",
            "Planning a product launch",
            "Organizing a team workshop",
            "Preparing quarterly reports",
            "Setting up a development environment"
        ]
        
        self.client.post("/api/v1/ai/suggest-tasks", json={
            "context": random.choice(contexts)
        })
    
    @task(1)
    def ai_analyze_productivity(self):
        """Get AI productivity analysis."""
        self.client.post("/api/v1/ai/analyze-productivity")


class AuthenticationUser(HttpUser):
    """User focused on authentication operations."""
    
    wait_time = between(0.5, 2)
    
    @task(4)
    def login(self):
        """Test login endpoint."""
        self.client.post("/api/v1/auth/login", json={
            "email": f"testuser{random.randint(1, 100)}@example.com",
            "password": "testpass123"
        })
    
    @task(2)
    def register(self):
        """Test registration endpoint."""
        self.client.post("/api/v1/auth/register", json={
            "email": f"newuser{random.randint(1, 10000)}@example.com",
            "password": "testpass123",
            "name": f"New User {random.randint(1, 1000)}"
        })
    
    @task(1)
    def password_reset_request(self):
        """Test password reset request."""
        self.client.post("/api/v1/auth/password-reset", json={
            "email": f"testuser{random.randint(1, 100)}@example.com"
        })


class APIStressUser(HttpUser):
    """User for stress testing API endpoints."""
    
    wait_time = between(0.1, 0.5)  # Faster requests for stress testing
    
    def on_start(self):
        """Login user when starting."""
        response = self.client.post("/api/v1/auth/register", json={
            "email": f"stressuser{random.randint(1, 100000)}@example.com",
            "password": "testpass123",
            "name": f"Stress User {random.randint(1, 1000)}"
        })
        
        if response.status_code == 201:
            token = response.json()["access_token"]
            self.client.headers["Authorization"] = f"Bearer {token}"
    
    @task
    def rapid_task_operations(self):
        """Perform rapid task operations."""
        operations = [
            self.create_task,
            self.view_tasks,
            self.update_random_task,
            self.view_tasks,
        ]
        
        operation = random.choice(operations)
        operation()
    
    def create_task(self):
        """Create a task."""
        self.client.post("/api/v1/tasks", json={
            "title": f"Stress Task {random.randint(1, 10000)}",
            "priority": random.choice(["low", "medium", "high"])
        })
    
    def view_tasks(self):
        """View tasks."""
        self.client.get("/api/v1/tasks", params={
            "page": random.randint(1, 5),
            "size": random.randint(10, 50)
        })
    
    def update_random_task(self):
        """Update a random task."""
        # This would need to maintain a list of created task IDs
        # For simplicity, we'll just make the request
        fake_id = random.randint(1, 1000)
        self.client.put(f"/api/v1/tasks/{fake_id}", json={
            "status": random.choice(["todo", "in_progress", "completed"])
        })


class WebSocketUser(HttpUser):
    """User for WebSocket testing."""
    
    wait_time = between(1, 5)
    
    def on_start(self):
        """Setup WebSocket connection."""
        # Login first
        response = self.client.post("/api/v1/auth/login", json={
            "email": f"wsuser{random.randint(1, 1000)}@example.com",
            "password": "testpass123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
        else:
            # Register if login fails
            response = self.client.post("/api/v1/auth/register", json={
                "email": f"wsuser{random.randint(1, 10000)}@example.com",
                "password": "testpass123",
                "name": f"WS User {random.randint(1, 1000)}"
            })
            if response.status_code == 201:
                self.token = response.json()["access_token"]
    
    @task
    def websocket_operations(self):
        """Simulate WebSocket operations."""
        # This would require a WebSocket client implementation
        # For now, we'll simulate with HTTP requests that trigger WebSocket events
        
        # Create a task (triggers WebSocket notification)
        self.client.post("/api/v1/tasks", 
                        headers={"Authorization": f"Bearer {self.token}"},
                        json={
                            "title": f"WS Task {random.randint(1, 1000)}",
                            "description": "Task created for WebSocket testing"
                        })


# Custom events for performance monitoring
@events.request.add_listener
def request_handler(request_type, name, response_time, response_length, exception, context, **kwargs):
    """Handle request events for custom monitoring."""
    if exception:
        print(f"Request failed: {name} - {exception}")
    
    # Log slow requests
    if response_time > 2000:  # 2 seconds
        print(f"Slow request detected: {name} took {response_time}ms")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("Load test starting...")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("Load test completed.")
    
    # Print summary statistics
    stats = environment.stats
    print(f"Total requests: {stats.total.num_requests}")
    print(f"Total failures: {stats.total.num_failures}")
    print(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    print(f"Max response time: {stats.total.max_response_time:.2f}ms")


# Load test scenarios
class QuickLoadTest(TaskFlowUser):
    """Quick load test with fewer users."""
    weight = 3


class HeavyLoadTest(APIStressUser):
    """Heavy load test for stress testing."""
    weight = 1


if __name__ == "__main__":
    # Run load test programmatically
    env = Environment(user_classes=[TaskFlowUser, AuthenticationUser])
    env.create_local_runner()
    
    # Start load test
    env.runner.start(user_count=50, spawn_rate=10)
    
    # Run for 5 minutes
    import time
    time.sleep(300)
    
    # Stop test
    env.runner.stop()
    
    print("Load test completed!")