# Multi-stage: the builder stage has devDependencies (needed for `prisma generate`, which
# reads schema.prisma and writes generated client code into node_modules), the runtime
# stage only ships production deps + that already-generated client — smaller final image.
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

EXPOSE 5000

CMD ["node", "server.js"]
