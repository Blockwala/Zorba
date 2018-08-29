kill -9 $(lsof -i:3000 -t)
export NODE_ENV=development
npm start
