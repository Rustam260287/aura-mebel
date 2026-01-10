
# ==========================================
# STAGE 1: Production Environment
# ==========================================
FROM node:18-bullseye-slim

# 1. Install System Dependencies
# We use minimal deps required for Blender 3.6+ headless to run.
# libgl1, libxrender1, libxi6, libxfixes3 - graphics libs (even for headless)
# curl, xz-utils - for downloading/unpacking
# zip - for packing USDZ
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    xz-utils \
    libgl1-mesa-glx \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libxfixes3 \
    libxcursor1 \
    libxinerama1 \
    libxrandr2 \
    zip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Blender 3.6.5 LTS (Official Binary)
# Why? apt installs v2.83 (broken USD). We need robust USD export.
WORKDIR /usr/local
RUN wget -q https://download.blender.org/release/Blender3.6/blender-3.6.5-linux-x64.tar.xz \
    && tar -xJf blender-3.6.5-linux-x64.tar.xz \
    && mv blender-3.6.5-linux-x64 blender \
    && rm blender-3.6.5-linux-x64.tar.xz

# Add Blender to PATH
ENV PATH="/usr/local/blender:$PATH"
ENV BLENDER_PATH="/usr/local/blender/blender"

# 3. Setup Application
WORKDIR /app

# Install Node Deps
COPY package.json ./
RUN npm install --production

# Copy Code
COPY server.js .
COPY convert.py .

# 4. Configuration
ENV PORT=8080
ENV NODE_ENV=production

# 5. Start
CMD ["node", "server.js"]
