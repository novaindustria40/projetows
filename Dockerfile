# Stage 1: Build the React frontend
FROM node:18-alpine AS build

WORKDIR /app

# Copy frontend package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Setup the Node.js backend
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies from the server directory
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --production

# Copy the rest of the backend source code from the server directory
COPY server/ ./server/

# Copy the built frontend from the 'build' stage
COPY --from=build /app/dist ./dist

# Copy the uploads directory (optional, if you have initial uploads)
# COPY --from=build /app/uploads ./uploads

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["node", "server/index.js"]
