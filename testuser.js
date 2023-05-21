import jwt from 'jsonwebtoken'
import { io } from "socket.io-client";

// Generate a JWT when the user logs in or registers
const token = jwt.sign({ userId: 1337 }, 'verysecretkey');

// Add the JWT to the query string or header when connecting to the socket.io server
const socket = io('http://localhost:4122', {
  query: { token },
});

socket.on('connect', () => {
    console.log('Connected!');
})