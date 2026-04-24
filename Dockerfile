# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built files and the server file from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
