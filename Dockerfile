# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# iTtEk POS - unified image. Builds the frontend (static export) and backend,
# then runs a single Node process that serves both the web app and the API.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --include=dev
COPY . .
RUN npm run build:unified

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --omit=dev
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/public ./apps/backend/public
EXPOSE 4000
CMD ["npm", "start"]
