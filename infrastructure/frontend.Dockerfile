# Use Node.js for building
FROM node:20-slim AS build-stage

# Set work directory
WORKDIR /app

# Copy package files
COPY monorepo/frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY monorepo/frontend/ ./

# Build the application
RUN npm run build

# Use Nginx for serving
FROM nginx:alpine

# Copy build artifacts from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
