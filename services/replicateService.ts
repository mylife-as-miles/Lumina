import { FiboPrompt } from "../types";

// Use a CORS proxy to allow client-side requests to Replicate
// Note: In a production Next.js app, this should be a Server Action or API Route.
const PROXY = "https://corsproxy.io/?";

export const generateImage = async (params: FiboPrompt): Promise<string> => {
  // STRICTLY use Replicate tokens. Do not fall back to generic API_KEY which is reserved for Gemini.
  const apiKey = process.env.REPLICATE_API_TOKEN || 
                 process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;
  
  if (!apiKey) {
    throw new Error("Missing Replicate API Token. Please set REPLICATE_API_TOKEN or NEXT_PUBLIC_REPLICATE_API_TOKEN in your environment.");
  }

  const modelEndpoint = "https://api.replicate.com/v1/models/bria/fibo/predictions";
  // Encode the target URL to pass it through the proxy
  const url = `${PROXY}${encodeURIComponent(modelEndpoint)}`;

  // 1. Initiate Prediction
  const createResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: params.prompt,
        // Map fields flatly as per likely model expectation
        camera_lens: params.structured_prompt.camera.lens,
        camera_view: params.structured_prompt.camera.view,
        camera_aperture: params.structured_prompt.camera.aperture,
        lighting_direction: params.structured_prompt.lighting.direction,
        lighting_style: params.structured_prompt.lighting.style,
        // Passing the full config object as well in case the model prioritizes it
        structured_config: JSON.stringify(params.structured_prompt),
        aspect_ratio: "16:9",
        num_outputs: 1,
        disable_safety_checker: true
      }
    })
  });

  if (!createResponse.ok) {
    // Handle potential proxy errors or API errors
    const errorText = await createResponse.text().catch(() => "Unknown error");
    let errorDetail = errorText;
    try {
        const json = JSON.parse(errorText);
        errorDetail = json.detail || json.error || errorText;
    } catch (e) {
      // If parsing fails, use the raw text (might be HTML from proxy)
    }
    
    throw new Error(`Replicate API Error (${createResponse.status}): ${errorDetail}`);
  }

  let prediction = await createResponse.json();
  
  // 2. Poll for Completion
  // prediction.urls.get is the Replicate API URL. We need to proxy this too.
  const pollUrl = prediction.urls.get;
  
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    // Wait 1 second before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const proxiedPollUrl = `${PROXY}${encodeURIComponent(pollUrl)}`;
    
    const pollResponse = await fetch(proxiedPollUrl, {
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!pollResponse.ok) {
       const errorData = await pollResponse.json().catch(() => ({}));
       throw new Error(`Polling Error: ${pollResponse.status} ${errorData.detail || pollResponse.statusText}`);
    }

    prediction = await pollResponse.json();
  }

  // 3. Handle Result
  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(`Prediction ${prediction.status}: ${prediction.error || "Unknown error"}`);
  }

  if (!prediction.output || prediction.output.length === 0) {
    throw new Error("Prediction succeeded but returned no output.");
  }

  // Output is usually an array of URLs, sometimes it's a string depending on model
  return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
};