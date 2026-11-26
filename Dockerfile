# Quick IMG Convert — admin (Next.js 14, port 3001).
# Dependencies are installed INSIDE the image (npm ci from the lockfile);
# .dockerignore keeps host node_modules / .next out of the build context,
# so nothing on the build host can overwrite the installed dependencies.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
# NOTE: no `COPY --from=build /app/public` here — the admin has no
# public/ directory (no logo or other static assets; it references
# none), and Docker fails the whole build with
# "/app/public: not found" if the source path does not exist in the
# build stage. The favicon is an App Router file (app/favicon.ico),
# which `npm run build` emits into .next, so it ships with the
# `.next` COPY above and needs no public/ directory. The web
# Dockerfile keeps its public COPY because web/public exists.
# If the admin ever gains static assets, add the directory first,
# then add the COPY line back.
COPY package.json next.config.js ./
EXPOSE 3001
CMD ["npm", "start"]
