# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Expose app port
EXPOSE 3000

# Start app
CMD ["node", "index.js"]
