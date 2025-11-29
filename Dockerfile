# Stage 1: Build the React frontend
# Use a Debian-based image for better compatibility
FROM node:20-bullseye-slim AS build

WORKDIR /app

# Copy frontend package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend
RUN npm run build

# -----------------------------------------------------------

# Stage 2: Setup the production Node.js backend
# Use the same Debian-based image
FROM node:20-bullseye-slim

WORKDIR /app

# Install dependencies for whatsapp-web.js (Puppeteer/Chromium)
# This is the crucial step to make it run on any host
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libasound2 \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and install production dependencies for the server
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --production

# Copy the backend source code
COPY server/ ./server/

# Copy the built frontend from the 'build' stage
COPY --from=build /app/dist ./dist

# Create the uploads directory and set permissions for the 'node' user
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Expose the port the app runs on
EXPOSE 80

# Set the user to a non-root user for better security
USER node

# Command to run the application
# We need to tell whatsapp-web.js to use the installed Chromium
# and to run in headless mode without a sandbox, which is common for Docker.
CMD ["node", "server/index.js", "--no-sandbox"]