# Stage 1: Build the frontend
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create the production-ready backend image
FROM node:18-bullseye AS backend
WORKDIR /usr/src/app

# Install Chromium, which is required by whatsapp-web.js
# We use bullseye as it has a compatible version of Chromium in its repositories
RUN apt-get update && \
    apt-get install -y chromium --no-install-recommends

# Copy server dependencies and install them
COPY server/package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY server/ ./

# Copy the built frontend from the 'frontend' stage
COPY --from=frontend /app/dist ./dist

# Copy existing uploads into the container
# Note: A volume should be used to persist uploads in docker-compose
COPY uploads/ ./uploads/

# Set environment variable for Puppeteer to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose the port the server will run on
EXPOSE 3001

# The command to start the server
CMD ["node", "index.js"]
