FROM node:24-alpine
ENV NODE_ENV=production
RUN apk add --no-cache tzdata
ENV TZ=Europe/Paris
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server/server.js server/migrate.js ./
COPY public ./public
RUN mkdir -p /app/data /app/branding
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "server.js"]
