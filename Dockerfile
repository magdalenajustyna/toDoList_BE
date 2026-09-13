# Image for Node.js application from Docke Hub (slim = without unnecessary tools and libraries)
FROM node:24-slim

# directory for the application inside the container
WORKDIR /app

# copy package.json and package-lock.json to the working directory
COPY package*.json ./
# install dependencies (ci = clean install, checks package-lock file)
RUN npm ci --omit=dev

# copy the whole application code to the working directory (except .dockerignore)
COPY . .

# set environment variables for production and the port the application will run on
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# change to a non-root user and start the application
USER node
CMD ["node", "server.js"]