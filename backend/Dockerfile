FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

# Install production dependencies without requiring a lockfile
RUN npm install --omit=dev

COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001

CMD ["npm", "start"]
