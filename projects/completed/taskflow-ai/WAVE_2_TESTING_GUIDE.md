# 🧪 Wave 2 Testing Guide

Comprehensive testing strategy for Wave 2 features including team collaboration, analytics, file uploads, mobile responsiveness, and real-time functionality.

## 📋 Testing Overview

Wave 2 introduces sophisticated features that require comprehensive testing across multiple dimensions:

- **Team Collaboration**: Multi-user workflows, permissions, real-time updates
- **Analytics**: Data accuracy, performance, export functionality
- **File Management**: Security, performance, various file types
- **Mobile Experience**: Touch interactions, responsive layouts, gestures
- **Real-time Features**: WebSocket connections, live updates, presence
- **Integration**: End-to-end workflows across all features

## 🎯 Coverage Goals

- **85%+ Code Coverage** across all new features
- **100% Critical Path Coverage** for core team workflows
- **Cross-browser Compatibility** on 10+ device/browser combinations
- **Performance Benchmarks** met for all new endpoints
- **Security Validation** for file uploads and team permissions

## 🏗️ Test Architecture

### Backend Testing

```
backend/tests/
├── conftest.py                 # Test configuration and fixtures
├── factories.py               # Extended test data factories
├── test_team_collaboration.py # Team management and workflows
├── test_analytics.py          # Analytics accuracy and performance
├── test_file_upload.py        # File security and performance
├── test_email_service.py      # Email templates and delivery
├── test_websocket_realtime.py # Real-time features
├── test_load_wave2.py         # Load testing for new features
└── run_comprehensive_tests.py # Orchestrated test runner
```

### Frontend Testing

```
frontend/tests/
├── setup.ts                   # Test environment setup
├── utils/
│   ├── test-utils.tsx         # Enhanced testing utilities
│   └── mobile-test-utils.tsx  # Mobile-specific helpers
├── components/               # Component unit tests
├── services/                # API service tests
├── stores/                  # State management tests
└── e2e/                     # End-to-end tests
    ├── mobile-team-collaboration.spec.ts
    └── team-workflow-integration.spec.ts
```

## 🚀 Running Tests

### Quick Start

```bash
# Backend - Run all Wave 2 tests
cd backend
python run_comprehensive_tests.py

# Frontend - Run all tests including mobile
cd frontend
npm run test:all

# Full integration testing
npm run test:wave2
```

### Specific Test Suites

```bash
# Team collaboration testing
python run_comprehensive_tests.py --suite team
npm run test:e2e -- --grep "team"

# Analytics testing
python run_comprehensive_tests.py --suite analytics

# Mobile testing
npm run test:e2e:mobile

# Load testing
python run_comprehensive_tests.py --load
locust -f tests/test_load_wave2.py --host http://localhost:8000
```

### CI/CD Integration

```bash
# CI-optimized run (faster, excludes load tests)
python run_comprehensive_tests.py --fast --coverage 85

# Generate reports
python run_comprehensive_tests.py --coverage 90
npm run test:coverage
```

## 📱 Mobile Testing

### Device Coverage

Tests run across multiple device configurations:

- **iPhone**: SE, 12 Pro, 13 (portrait/landscape)
- **Android**: Pixel 5, Galaxy S21 (portrait/landscape)
- **Tablet**: iPad Pro (portrait/landscape)
- **Desktop**: Various screen sizes (1200px to 2560px)

### Mobile Test Features

```typescript
// Example mobile test
test('should handle team task creation on mobile', async ({ page }) => {
  await page.tap('[data-testid="mobile-add-task-fab"]')
  await page.fill('[data-testid="task-title-input"]', 'Mobile Task')
  
  // Test touch interactions
  await page.tap('[data-testid="priority-select"]')
  await page.tap('[data-testid="priority-high"]')
  
  // Test drag and drop on mobile
  const taskCard = page.locator('[data-testid="task-card"]')
  const inProgressColumn = page.locator('[data-testid="column-in-progress"]')
  await taskCard.dragTo(inProgressColumn)
})
```

### Mobile Gesture Testing

```typescript
import { MobileGestureSimulator } from './utils/mobile-test-utils'

// Test swipe gestures
const simulator = new MobileGestureSimulator(element)
await simulator.swipe('left', 200)
await simulator.pinch(2.0) // Zoom in
await simulator.longPress(800) // Long press
```

## 👥 Team Collaboration Testing

### Multi-User Scenarios

```python
@pytest.mark.asyncio
async def test_real_time_collaboration(self, db_session):
    """Test real-time updates between team members."""
    # Create team with multiple members
    scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
    
    # Simulate concurrent actions
    # Member 1 creates task
    # Member 2 moves task
    # Member 3 adds comment
    # Verify all see updates in real-time
```

### Permission Testing

```python
@pytest.mark.asyncio 
async def test_role_based_permissions(self, authenticated_client, db_session):
    """Test that team roles are properly enforced."""
    team, admins, members = await TestScenarioFactories.create_team_with_members(
        db_session, num_members=5, admin_count=2
    )
    
    # Test admin can manage team
    # Test member cannot manage team
    # Test member can view/edit assigned tasks
    # Test member cannot delete team
```

### Activity Feed Testing

```python
@pytest.mark.asyncio
async def test_activity_feed_real_time_updates(self, db_session):
    """Test activity feed updates in real-time."""
    # Create activities
    # Verify feed updates
    # Test pagination
    # Test filtering by action type
```

## 📊 Analytics Testing

### Data Accuracy Testing

```python
@pytest.mark.asyncio
async def test_analytics_data_accuracy(self, db_session):
    """Verify analytics calculations are mathematically correct."""
    # Create known test data
    scenario = await TestScenarioFactories.create_analytics_test_data(db_session)
    
    # Calculate expected metrics manually
    expected_completion_rate = completed_tasks / total_tasks * 100
    
    # Get analytics from service
    analytics = await AnalyticsService.get_team_productivity_metrics(team_id)
    
    # Verify accuracy
    assert abs(analytics.completion_rate - expected_completion_rate) < 0.01
```

### Performance Testing

```python
@pytest.mark.asyncio
async def test_analytics_performance_large_dataset(self, db_session):
    """Test analytics performance with large datasets."""
    # Create 1000+ tasks
    # Measure query performance
    # Verify sub-second response times
    # Test concurrent analytics queries
```

### Export Testing

```python
@pytest.mark.asyncio
async def test_analytics_export_formats(self, authenticated_client, db_session):
    """Test analytics export in multiple formats."""
    # Test CSV export
    # Test PDF export  
    # Verify data integrity
    # Test custom date ranges
```

## 📁 File Upload Testing

### Security Testing

```python
@pytest.mark.asyncio
async def test_malicious_file_detection(self):
    """Test detection and blocking of malicious files."""
    malicious_files = [
        (b'\x4d\x5a', 'malware.exe', 'application/x-executable'),
        (b'<?php system($_GET["cmd"]); ?>', 'backdoor.php', 'application/x-php'),
    ]
    
    for content, filename, content_type in malicious_files:
        with pytest.raises(FileValidationError):
            await file_service.validate_file_security(
                BytesIO(content), filename, content_type
            )
```

### Performance Testing

```python
@pytest.mark.asyncio
async def test_large_file_upload_performance(self):
    """Test performance with large file uploads."""
    # Test 10MB file upload
    # Measure upload time
    # Verify memory usage
    # Test concurrent uploads
```

### File Type Testing

```python
@pytest.mark.asyncio
async def test_file_type_validation(self):
    """Test file type restrictions and validation."""
    # Test allowed file types (images, PDFs, text)
    # Test blocked file types (executables, scripts)
    # Test content-type spoofing detection
    # Test file size limits
```

## 🌐 Real-time Testing

### WebSocket Connection Testing

```python
@pytest.mark.asyncio
async def test_websocket_connection_management(self, db_session):
    """Test WebSocket connection lifecycle."""
    manager = ConnectionManager()
    
    # Test connection establishment
    # Test multiple connections per user
    # Test connection cleanup
    # Test error handling
```

### Real-time Collaboration

```python
@pytest.mark.asyncio
async def test_live_cursor_tracking(self, db_session):
    """Test live cursor position sharing."""
    # Connect multiple users
    # Send cursor updates
    # Verify other users receive updates
    # Test cursor cleanup on disconnect
```

### Notification Testing

```python
@pytest.mark.asyncio
async def test_real_time_notifications(self, db_session):
    """Test real-time notification delivery."""
    # Test task assignment notifications
    # Test @mention notifications
    # Test team announcements
    # Test notification queuing for offline users
```

## 📧 Email Testing

### Template Testing

```python
@pytest.mark.asyncio
async def test_email_template_rendering(self, email_service):
    """Test email template generation."""
    # Test team invitation template
    # Test task assignment template
    # Test mention notification template
    # Verify HTML and text versions
```

### Delivery Testing (with MailHog)

```python
@pytest.mark.asyncio
async def test_email_delivery(self, email_service, mailhog_client, db_session):
    """Test email delivery using MailHog."""
    # Send test email
    # Verify receipt in MailHog
    # Check email content
    # Test delivery failure handling
```

### Bulk Operations

```python
@pytest.mark.asyncio
async def test_bulk_email_operations(self, email_service, mailhog_client):
    """Test bulk email sending performance."""
    # Send team invitations to 50 users
    # Verify all emails delivered
    # Measure sending performance
    # Test rate limiting
```

## 🔄 Integration Testing

### End-to-End Workflows

```typescript
test('should complete team onboarding workflow', async ({ page }) => {
  // 1. User signs up
  // 2. Creates team
  // 3. Invites members
  // 4. Creates project
  // 5. Assigns tasks
  // 6. Collaborates in real-time
  // 7. Views analytics
  // 8. Exports reports
})
```

### Cross-Feature Integration

```typescript
test('should sync data across features', async ({ browser }) => {
  // Test that task updates trigger:
  // - Real-time notifications
  // - Activity feed updates
  // - Analytics recalculation
  // - Email notifications
  // - WebSocket broadcasts
})
```

## 📈 Load Testing

### Team Collaboration Load

```python
class TeamCollaborationUser(HttpUser):
    @task(3)
    def create_and_manage_team(self):
        # Create team
        # Invite members
        # Manage team settings
    
    @task(5)
    def create_and_manage_tasks(self):
        # Create tasks
        # Update tasks
        # Add comments
        # Upload attachments
```

### Analytics Load

```python
class AnalyticsHeavyUser(HttpUser):
    @task(3)
    def get_productivity_analytics(self):
        # Get team metrics
        # Apply date filters
        # Request different views
    
    @task(1)
    def export_analytics_data(self):
        # Export CSV
        # Export PDF
        # Test large dataset exports
```

### File Upload Load

```python
class FileUploadHeavyUser(HttpUser):
    @task(4)
    def upload_small_files(self):
        # Upload files 1KB-100KB
    
    @task(1)
    def upload_large_files(self):
        # Upload files 5MB-25MB
        # Measure performance
```

## 📊 Performance Benchmarks

### Response Time Targets

- **Team Operations**: < 200ms
- **Task Operations**: < 150ms
- **Analytics Queries**: < 500ms
- **File Uploads**: < 2s per MB
- **Real-time Updates**: < 100ms
- **Page Load Times**: < 2s initial, < 1s subsequent

### Throughput Targets

- **Concurrent Users**: 100+ without degradation
- **File Uploads**: 50+ concurrent uploads
- **WebSocket Connections**: 500+ concurrent connections
- **Analytics Queries**: 20+ concurrent complex queries

### Resource Usage

- **Memory**: < 512MB per backend process
- **CPU**: < 80% under normal load
- **Database**: < 100ms average query time
- **Storage**: Efficient file storage and cleanup

## 🔍 Debugging Test Failures

### Common Issues

1. **Flaky Tests**: Add proper waits and retries
2. **Network Timeouts**: Increase timeouts for slow operations
3. **Race Conditions**: Use proper synchronization
4. **Memory Leaks**: Ensure proper cleanup in teardown

### Debug Commands

```bash
# Run single test with debug output
pytest tests/test_team_collaboration.py::test_specific_function -v -s

# Run E2E test in debug mode
npm run test:e2e:debug

# Generate detailed coverage report
pytest --cov=app --cov-report=html --cov-report=term-missing

# Run load test with UI
locust -f tests/test_load_wave2.py --host http://localhost:8000
```

### Logging and Monitoring

- All tests generate detailed logs
- Performance metrics tracked automatically  
- Coverage reports generated after each run
- Test results saved in machine-readable format

## 📋 Test Checklist

### Before Release

- [ ] All test suites pass (unit, integration, E2E)
- [ ] Coverage above 85% threshold
- [ ] Mobile tests pass on all target devices
- [ ] Load tests meet performance benchmarks
- [ ] Security tests pass for file uploads
- [ ] Email templates render correctly
- [ ] Real-time features work across browsers
- [ ] Analytics data accuracy verified
- [ ] Cross-browser compatibility confirmed
- [ ] Accessibility standards met

### Continuous Monitoring

- [ ] Test execution time tracking
- [ ] Flaky test identification and fixing
- [ ] Coverage trend monitoring
- [ ] Performance regression detection
- [ ] Test environment maintenance

## 🎯 Success Metrics

- **Test Coverage**: 85%+ maintained
- **Test Execution Time**: < 10 minutes full suite
- **Flaky Test Rate**: < 2%
- **Bug Detection Rate**: 95%+ of bugs caught in testing
- **Performance Compliance**: 100% of benchmarks met

---

## 🛠️ Quick Commands Reference

```bash
# Run all Wave 2 tests
python backend/run_comprehensive_tests.py
npm run test:wave2

# Run specific suites
python backend/run_comprehensive_tests.py --suite team
npm run test:e2e:mobile

# Generate coverage
python backend/run_comprehensive_tests.py --coverage 90
npm run test:coverage

# Load testing
locust -f backend/tests/test_load_wave2.py TeamCollaborationUser

# Debug failing tests
pytest backend/tests/test_specific.py -v -s --pdb
npm run test:e2e:debug
```

This comprehensive testing strategy ensures Wave 2 features are robust, performant, and ready for production deployment! 🚀