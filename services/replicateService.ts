
import { FiboPrompt } from "../types";

// Use a CORS proxy to allow client-side requests to Replicate
// Note: In a production Next.js app, this should be a Server Action or API Route.
const PROXY = "https://corsproxy.io/?";

export const generateImage = async (params: FiboPrompt, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Missing Replicate API Token.");
  }

  const modelEndpoint = "https://api.replicate.com/v1/models/bria/fibo/predictions";
  const url = `${PROXY}${encodeURIComponent(modelEndpoint)}`;

  const sp = params.structured_prompt;

  // Construct a very rich text prompt from the structure since the model might primarily use text
  // but we also send specific keys if they are supported or for metadata.
  const richPrompt = `
    ${sp.short_description}.
    Style: ${sp.style_medium}, ${sp.artistic_style}.
    Camera: ${sp.photographic_characteristics.lens_focal_length}, ${sp.photographic_characteristics.camera_angle}, ${sp.photographic_characteristics.depth_of_field}.
    Lighting: ${sp.lighting.direction}, ${sp.lighting.conditions}, ${sp.lighting.shadows}.
    Mood: ${sp.aesthetics.mood_atmosphere}, ${sp.aesthetics.color_scheme}.
    Composition: ${sp.aesthetics.composition}.
    Subject Pose: ${sp.objects[0]?.action_pose || 'Natural'}.
  `.replace(/\s+/g, ' ').trim();

  // 1. Initiate Prediction
  console.log("Starting Replicate prediction...");
  const createResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: richPrompt,
        // Mapping specific parameters if the model supports them, otherwise they are in the prompt
        camera: sp.photographic_characteristics.lens_focal_length,
        aperture: sp.photographic_characteristics.depth_of_field,
        lighting: sp.lighting.direction,
        // Pass the raw structured object as a string for models that might parse it
        structured_data: JSON.stringify(sp),
        aspect_ratio: "16:9",
        num_outputs: 1,
        disable_safety_checker: true
      }
    })
  });

  if (!createResponse.ok) {
    // Return the FULL error message without truncation
    const errorText = await createResponse.text().catch(() => "Unknown error");
    throw new Error(`Replicate API Error (${createResponse.status}): ${errorText}`);
  }

  let prediction = await createResponse.json();
  console.log("Prediction initialized:", prediction.id);
  
  // 2. Poll for Completion
  const pollUrl = prediction.urls?.get;
  
  if (!pollUrl) {
    throw new Error("Replicate API did not return a polling URL.");
  }
  
  let attempts = 0;
  const MAX_ATTEMPTS = 60; // 60 seconds roughly

  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    if (attempts >= MAX_ATTEMPTS) {
       throw new Error("Prediction timed out (60s limit).");
    }
    attempts++;
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // CRITICAL FIX: Aggressive Cache Busting
    // We add both a timestamp AND a random nonce to ensure the proxy always fetches fresh data.
    const separator = pollUrl.includes('?') ? '&' : '?';
    const urlWithCacheBust = `${pollUrl}${separator}t=${Date.now()}&nonce=${Math.random().toString(36).substring(7)}`;
    const proxiedPollUrl = `${PROXY}${encodeURIComponent(urlWithCacheBust)}`;

    try {
      const pollResponse = await fetch(proxiedPollUrl, {
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        },
      });

      if (!pollResponse.ok) {
         console.warn(`Polling status check failed: ${pollResponse.status}`);
         continue; 
      }
      
      const updatedPrediction = await pollResponse.json();
      
      // Ensure we actually got a valid object back before overwriting
      if (updatedPrediction && updatedPrediction.status) {
        prediction = updatedPrediction;
        console.log(`Polling attempt ${attempts}: ${prediction.status}`);
      }
    } catch (e) {
      console.warn("Polling network error", e);
      // Continue polling loop despite network hiccup
    }
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Prediction ${prediction.status}: ${prediction.error || "Unknown error"}`);
  }

  // 3. Robust Output Handling
  const output = prediction.output;
  console.log("Generation complete. Output:", output);
  
  if (!output) {
    throw new Error("Generation succeeded but no output URL was returned by the model.");
  }

  // Replicate models can return a single string or an array of strings. 
  return Array.isArray(output) ? output[0] : output;
};
