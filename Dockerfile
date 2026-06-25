# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Vite project for production
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy the built assets from the build stage to Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html

# Update Nginx config to listen on port 3000 instead of 80
RUN sed -i 's/listen  *80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
