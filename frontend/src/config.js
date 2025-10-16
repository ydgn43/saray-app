// This file reads the variable from the environment
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!BASE_URL) {
  console.error("REACT_APP_API_BASE_URL is not defined!");
  // Provide a safe fallback for development
}

export const API_URL = `${BASE_URL}`;
// Export other constants like port, endpoints, etc.