import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // In production, Vite serves from the same domain/port as the Express server
        // In development, Express runs on 3000, Vite on 5173 (default)
        const SERVER_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect(); // Clean up on unmount
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};