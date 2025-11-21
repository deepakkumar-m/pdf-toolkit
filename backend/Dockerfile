FROM node:18-slim

# Install Ghostscript
RUN apt-get update && \
    apt-get install -y ghostscript && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify Ghostscript installation
RUN gs -v

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create temp directory
RUN mkdir -p /tmp && chmod 1777 /tmp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Run the application
CMD ["node", "server.js"]
