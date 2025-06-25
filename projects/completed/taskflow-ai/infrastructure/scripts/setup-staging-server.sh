#!/bin/bash

# Staging server setup script for TaskFlow AI
# Run this script on a fresh Ubuntu 20.04+ server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        htop \
        tree \
        vim \
        ufw \
        fail2ban \
        certbot \
        awscli
    success "System packages updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Install dependencies
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download latest version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Enable firewall
    sudo ufw --force enable
    
    success "Firewall configured"
}

# Configure fail2ban
setup_fail2ban() {
    log "Configuring fail2ban..."
    
    # Copy default configuration
    sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    
    # Create custom nginx configuration
    sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null <<EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 10
findtime = 600
bantime = 3600
EOF

    # Start and enable fail2ban
    sudo systemctl start fail2ban
    sudo systemctl enable fail2ban
    
    success "Fail2ban configured"
}

# Setup swap file
setup_swap() {
    log "Setting up swap file..."
    
    # Check if swap already exists
    if ! swapon --show | grep -q '/swapfile'; then
        # Create 2GB swap file
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        
        # Make permanent
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        
        # Optimize swap usage
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
        
        success "Swap file created and configured"
    else
        log "Swap file already exists"
    fi
}

# Create deployment user and directories
setup_deployment() {
    log "Setting up deployment environment..."
    
    # Create application directory
    mkdir -p ~/taskflow-ai
    mkdir -p ~/taskflow-ai/logs
    mkdir -p ~/taskflow-ai/backups
    
    # Set up log rotation
    sudo tee /etc/logrotate.d/taskflow > /dev/null <<EOF
~/taskflow-ai/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF
    
    success "Deployment environment configured"
}

# Install monitoring tools
install_monitoring() {
    log "Installing monitoring tools..."
    
    # Install node_exporter for system metrics
    NODE_EXPORTER_VERSION="1.6.1"
    cd /tmp
    wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
    tar xzf node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
    sudo mv node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
    
    # Create node_exporter user
    sudo useradd --no-create-home --shell /bin/false node_exporter
    sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
    
    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF
    
    # Start and enable node_exporter
    sudo systemctl daemon-reload
    sudo systemctl start node_exporter
    sudo systemctl enable node_exporter
    
    success "Monitoring tools installed"
}

# Optimize system performance
optimize_system() {
    log "Optimizing system performance..."
    
    # Increase file descriptor limits
    echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # Optimize network settings
    sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# Network optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# Security settings
net.ipv4.tcp_syncookies = 1
net.ipv4.ip_forward = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
EOF
    
    # Apply sysctl settings
    sudo sysctl -p
    
    success "System optimized"
}

# Setup SSH hardening
harden_ssh() {
    log "Hardening SSH configuration..."
    
    # Backup original config
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Configure SSH
    sudo tee -a /etc/ssh/sshd_config > /dev/null <<EOF

# TaskFlow AI SSH Hardening
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 600
ClientAliveCountMax 0
MaxAuthTries 3
MaxSessions 2
Protocol 2
EOF
    
    # Restart SSH service
    sudo systemctl restart sshd
    
    success "SSH hardened"
}

# Install and configure automatic updates
setup_auto_updates() {
    log "Setting up automatic security updates..."
    
    sudo apt-get install -y unattended-upgrades
    
    # Configure automatic updates
    sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Enable automatic updates
    sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
    
    success "Automatic updates configured"
}

# Main setup function
main() {
    log "Starting TaskFlow AI staging server setup..."
    
    check_root
    update_system
    install_docker
    install_docker_compose
    setup_swap
    setup_firewall
    setup_fail2ban
    setup_deployment
    install_monitoring
    optimize_system
    harden_ssh
    setup_auto_updates
    
    success "Server setup completed successfully!"
    
    warning "Please reboot the server to ensure all changes take effect:"
    warning "sudo reboot"
    
    log "After reboot, you can proceed with the application deployment."
    log "Make sure to:"
    log "1. Copy your SSH public key to ~/.ssh/authorized_keys"
    log "2. Configure DNS records for staging.taskflow-ai.dev and staging-api.taskflow-ai.dev"
    log "3. Set up GitHub Actions secrets for deployment"
    log "4. Run the deployment process"
}

# Run main function
main "$@"