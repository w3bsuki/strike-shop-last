# 🌐 How to Access Your Medusa Admin Panel

## WSL2 Access Issues - Solutions:

### Option 1: Use WSL IP Address (Recommended)
Access via: **http://172.30.205.219:9000/app**

### Option 2: Windows PowerShell Port Forwarding
Run this in Windows PowerShell as Administrator:
```powershell
netsh interface portproxy add v4tov4 listenport=9000 listenaddress=0.0.0.0 connectport=9000 connectaddress=172.30.205.219
```
Then access via: **http://localhost:9000/app**

### Option 3: Use Windows Terminal Preview
1. Install Windows Terminal Preview from Microsoft Store
2. It has better WSL2 integration
3. Try http://localhost:9000/app again

### Option 4: Access from WSL Browser
```bash
# Install a browser in WSL
sudo apt update
sudo apt install firefox -y
firefox http://localhost:9000/app
```

### Option 5: Use VS Code
1. Open VS Code
2. Install "Live Preview" extension
3. Open http://localhost:9000/app in VS Code browser

## Quick Test
From WSL terminal:
```bash
curl http://localhost:9000/app
# Should return HTML
```

## Login Credentials
- Email: admin@strikeshop.com
- Password: AdminPass2025

## If Still Not Working:
1. Check Windows Firewall isn't blocking port 9000
2. Restart WSL: `wsl --shutdown` (from PowerShell)
3. Try a different port by changing PORT in .env to 3333