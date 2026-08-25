# Mangoo Connect+ — serveur temps réel
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dépendances (uniquement ws, requis par server.cjs)
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Code du serveur + pages statiques + assets
COPY . .

EXPOSE 8080 8443

CMD ["node", "server.cjs"]
