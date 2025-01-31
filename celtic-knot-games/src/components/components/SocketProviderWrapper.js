import React from "react";
import { SocketProvider } from "./socketProvider";
import App from "../App"; 

/**
 * A wrapper component that provides a socket connection context to the entire application.
 * This component wraps the main App component with the SocketProvider.
 */

const SocketProviderWrapper = () => {
  return (
    <SocketProvider>
      <App />
    </SocketProvider>
  );
};

export default SocketProviderWrapper;
