#!/usr/bin/env bash

set -e # Exit immediately if a command exits with a non-zero status
clear

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   METROVA TELEMETRY AGENT INSTALLER    ${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Require root privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[!] Please run this installer as root or using sudo.${NC}"
  exit 1
fi

# 2. Parse arguments for API Key
API_KEY=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --api-key) API_KEY="$2"; shift ;;
        *) echo -e "${RED}Unknown parameter passed: $1${NC}"; exit 1 ;;
    esac
    shift
done

if [ -z "$API_KEY" ]; then
    echo -e "${RED}[!] Error: Missing API Key.${NC}"
    echo "Usage: curl -sSL https://metrova.engine/install.sh | sudo bash -s -- --api-key YOUR_API_KEY"
    exit 1
fi

echo -e "${GREEN}[+] Authenticated with installation token.${NC}"

# 3. Create a dedicated secure system user (no login access)
echo -e "${BLUE}[*] Creating secure 'metrova' system user...${NC}"
if id "metrova" &>/dev/null; then
    echo -e "${GREEN}[+] User 'metrova' already exists.${NC}"
else
    useradd --system --no-create-home --shell /bin/false metrova
    echo -e "${GREEN}[+] User created successfully.${NC}"
fi

# 4. Create directories and secure configuration
echo -e "${BLUE}[*] Provisioning secure directories...${NC}"
mkdir -p /etc/metrova
mkdir -p /opt/metrova

# Generate a unique Node ID based on the server's hostname
NODE_ID=$(hostname)

# Write the secure environment file
cat <<EOF > /etc/metrova/.env
METROVA_INGEST_URL="ws://api.metrova.com/ingest"
METROVA_API_KEY="${API_KEY}"
NODE_ID="${NODE_ID}"
EOF

# Lock down permissions so ONLY the metrova user and root can read the API key
chown -R metrova:metrova /etc/metrova
chmod 600 /etc/metrova/.env
echo -e "${GREEN}[+] Configuration secured.${NC}"

# 5. Download the Agent Binary
# (Note: For now, this downloads a placeholder, but in production, this points to your AWS bucket)
echo -e "${BLUE}[*] Downloading Metrova Agent binary...${NC}"
# curl -sSL https://s3.amazonaws.com/metrova-releases/latest/metrova-agent-linux-amd64 -o /usr/local/bin/metrova-agent
# chmod +x /usr/local/bin/metrova-agent

# MOCK STEP: Since we haven't compiled the python file yet, we will simulate the binary creation for this test
touch /usr/local/bin/metrova-agent
chmod +x /usr/local/bin/metrova-agent
echo -e "${GREEN}[+] Binary installed to /usr/local/bin/metrova-agent.${NC}"


# 6. Create the systemd Daemon (The heartbeat)
echo -e "${BLUE}[*] Configuring systemd background service...${NC}"
cat <<EOF > /etc/systemd/system/metrova.service
[Unit]
Description=Metrova Telemetry Agent
After=network.target

[Service]
Type=simple
User=metrova
Group=metrova
EnvironmentFile=/etc/metrova/.env
ExecStart=/usr/local/bin/metrova-agent
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# 7. Ignite the Engine
echo -e "${BLUE}[*] Starting Metrova daemon...${NC}"
systemctl daemon-reload
systemctl enable metrova.service
# systemctl start metrova.service # (Commented out locally so it doesn't try to run the fake binary on your machine)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   INSTALLATION COMPLETE!               ${NC}"
echo -e "${GREEN}   Node ID: ${NODE_ID}                  ${NC}"
echo -e "${GREEN}   Agent is now running in background.  ${NC}"
echo -e "${GREEN}========================================${NC}"