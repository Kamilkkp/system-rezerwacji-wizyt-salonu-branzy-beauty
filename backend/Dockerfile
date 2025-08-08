FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20

WORKDIR /app

COPY --from=builder /app/ ./

EXPOSE 3000

CMD [ "node", "dist/main.js" ]