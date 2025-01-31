import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import settings from "../settings.json";

// Create the context
const SocketContext = createContext();

// Custom hook to access the context
export const useSocket = () => useContext(SocketContext);

// SocketProvider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize the socket connection
    const newSocket = io(`http://${settings.site}:${settings.port}`); // Replace with your server URL
    setSocket(newSocket);

    console.log("Socket initialized");

    // Handle socket cleanup when tab/window is closed
    const handleTabClose = () => {
      console.log("Disconnecting socket on tab close");
      newSocket.disconnect();
      newSocket.off();
      newSocket.close();
    };

    window.addEventListener("beforeunload", handleTabClose);

    // Cleanup listeners and socket when the component unmounts
    return () => {
      console.log("Cleanup: Removing listeners and keeping socket for navigation");
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
