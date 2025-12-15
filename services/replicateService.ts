import { FiboPrompt } from "../types";

// In a real production app, this would call a backend endpoint 
// which then calls the Replicate API to protect the API key.
// For this demo, we simulate the network delay and return a placeholder 
// that matches the "vibe" of the prompt conceptually via keywords.

export const generateImage = async (params: FiboPrompt): Promise<string> => {
  return new Promise((resolve) => {
    console.log("Mocking Replicate Call with params:", params);
    
    setTimeout(() => {
      // Generate a deterministic placeholder based on prompt length/content
      const keywords = params.prompt.split(' ').join(',');
      const seed = Math.floor(Math.random() * 1000);
      const url = `https://picsum.photos/seed/${seed}/1024/1024`;
      resolve(url);
    }, 2500); // Simulate 2.5s generation time
  });
};