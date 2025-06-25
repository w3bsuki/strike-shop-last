# 🔑 TaskFlow AI - Test Login Guide

## Quick Start Testing

### 1. Start the Application
```bash
cd /home/w3bsuki/MATRIX/claude-workspace/projects/taskflow-ai
docker-compose up -d
```

Wait for all services to be ready (check with `docker-compose logs -f`)

### 2. Create a Test User Account

**Option A: Use the Signup Page**
1. Go to: http://localhost:3000/signup
2. Fill out the registration form:
   - **Email**: `test@taskflow.dev`
   - **Full Name**: `Test User`
   - **Password**: `TestPass123!`
3. Click "Create Account"

**Option B: Create via API (for quick testing)**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@taskflow.dev",
    "full_name": "Test User",
    "password": "TestPass123!"
  }'
```

### 3. Login and Test Features

**Login Details:**
- **URL**: http://localhost:3000/login
- **Email**: `test@taskflow.dev`
- **Password**: `TestPass123!`

### 4. Test the Main Features

Once logged in, you can test:

1. **Task Board**: Drag and drop tasks between columns
2. **Analytics**: Go to `/analytics` for productivity insights
3. **Team Features**: Create a team and invite members
4. **AI Features**: Create tasks with natural language
5. **Mobile**: Test on mobile browser or use browser dev tools

## 🚀 Demo User with Sample Data

For a richer testing experience, I can create a demo user with sample projects and tasks:

```bash
# Run this script to create demo data
cd backend
python scripts/create_demo_user.py
```

This creates:
- **Email**: `demo@taskflow.dev`
- **Password**: `DemoPass123!`
- **Sample projects** with tasks
- **Team with multiple members**
- **Analytics data** for testing

## 🔍 Testing Checklist

- [ ] Login/Logout functionality
- [ ] Task creation and editing
- [ ] Drag and drop on task board
- [ ] Real-time updates (open in 2 tabs)
- [ ] Team creation and invitations
- [ ] Analytics dashboard
- [ ] File attachments
- [ ] Mobile responsive design
- [ ] AI task suggestions

## 🐛 Troubleshooting

**If you can't log in:**
1. Check if backend is running: `curl http://localhost:8000/health`
2. Check database connection: `docker-compose logs postgres`
3. Verify user exists: Check the database or try signup again

**If features aren't working:**
1. Check browser console for errors
2. Verify API responses: `docker-compose logs backend`
3. Check WebSocket connection for real-time features

**Need fresh start:**
```bash
# Reset database and create clean demo user
docker-compose down -v
docker-compose up -d
# Wait for services, then create demo user again
```

## 📧 Email Testing

Email features are configured but need SMTP setup. For testing:
1. Check `docker-compose logs mailhog` for email interface
2. Access MailHog at: http://localhost:8025
3. Test invitation emails and notifications

## 🌟 Pro Tips

1. **Use browser dev tools** to test mobile responsiveness
2. **Open multiple tabs** to test real-time collaboration
3. **Check the network tab** to see API calls
4. **Test with different user roles** (create multiple accounts)
5. **Try the AI features** - they use real OpenAI integration if API key is set

Happy testing! 🎉