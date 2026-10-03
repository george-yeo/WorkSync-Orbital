# Build from the repository root:  docker build -f server/Dockerfile .
# (the root package-lock.json covers both workspaces)

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --workspace server --include-workspace-root=false
COPY server/ server/
RUN npm run build --workspace server

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --workspace server --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist server/dist
USER node
EXPOSE 8000
ENV PORT=8000
CMD ["node", "server/dist/server.js"]
