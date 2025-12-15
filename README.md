# LUMINA | Spatial Prompting Studio

![Status](https://img.shields.io/badge/Status-Beta-00f0ff)
![Tech](https://img.shields.io/badge/Stack-Next.js_14_|_R3F_|_Gemini-white)

**Lumina** is a next-generation "Spatial Prompting" interface designed for the **Bria FIBO** AI model. Instead of writing complex, nested JSON parameters manually, Lumina allows creators to direct scenes visually. By manipulating a virtual camera and light source in a 3D studio, the application mathematically calculates the precise optical and lighting parameters required by the Generative AI.

It features a **"Director Agent"** powered by Google Gemini 2.5, which can translate abstract natural language requests (e.g., "Make it look like a horror movie") into precise 3D coordinate placements.

---

## 🌟 Key Features

### 1. Spatial Math Engine
Lumina replaces text-based parameter tuning with trigonometry.
-   **Lens Calculation:** Distance from the subject automatically selects appropriate focal lengths (18mm Fisheye vs 200mm Telephoto).
-   **Lighting Logic:** The angle of the light source determines Key, Fill, Rim, or Butterfly lighting automatically.
-   **Angle Detection:** Z-axis manipulation switches between Hero Views (Low Angle) and Bird's Eye Views.

### 2. The Studio Canvas
A React Three Fiber (R3F) powered 3D environment.
-   **Interactive Props:** Drag-and-drop Camera and Light representations.
-   **3D Gizmos:** Visual feedback for shadows, field of view, and subject placement.
-   **Z-Axis Control:** Hold `SHIFT` while dragging to manipulate height.

### 3. Gemini Director Agent
An embedded AI agent that controls the interface.
-   **Natural Language to Coordinates:** Describe a shot, and Gemini calculates the vector positions for the camera and lights to achieve that look.
-   **Context Awareness:** The agent is aware of the current state of the studio and modifies it relative to existing positions.

### 4. Real-time Matrix View
-   Watch the **Bria FIBO JSON** structure generate in real-time as you move objects.
-   Toggle FX filters (Film Grain, Chromatic Aberration, etc.) which are dynamically mapped to specific prompt fields.
-   Export/Copy JSON for external use.

---

## 🛠 Tech Stack

-   **Frontend:** React 18, TypeScript, Tailwind CSS
-   **3D Rendering:** Three.js, @react-three/fiber, @react-three/drei
-   **Animations:** Framer Motion
-   **AI Logic:** Google Gemini API (`gemini-2.5-flash`)
-   **Image Generation:** Replicate API (`bria/fibo`)

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   A Google Gemini API Key
-   A Replicate API Token

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/lumina.git
    cd lumina
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory (or use your deployment platform's environment variables).
    ```env
    # Required for the Director Agent
    API_KEY=your_google_gemini_api_key

    # Required for Image Rendering
    REPLICATE_API_TOKEN=your_replicate_api_token
    # OR for client-side usage in this demo structure:
    NEXT_PUBLIC_REPLICATE_API_TOKEN=your_replicate_api_token
    ```

4.  **Run Development Server**
    ```bash
    npm start
    ```
    Open `http://localhost:8080` (or the port specified by your bundler).

---

## 🎮 Usage Guide

### Manual Mode
1.  **Move the Camera (Blue):**
    *   Drag closer/further to change focal length.
    *   Drag left/right to change the composition (Rule of Thirds).
    *   **Shift + Drag** up/down to change the Camera Height (Low/High Angle).
2.  **Move the Light (Orange):**
    *   Drag around the subject to change lighting direction (Side, Rim, Front).
    *   **Shift + Drag** to create Overhead or Uplighting (Horror) effects.
3.  **Adjust Settings:**
    *   Open the Sidebar (Matrix View) to adjust Aperture (f-stop).
    *   Toggle Filters like "Vignette" or "Film Grain".

### Agent Mode
1.  Type a request in the bottom text bar.
    *   *Example: "Give me a dramatic, moody hero shot."*
    *   *Example: "Setup a bright commercial product look."*
2.  Click the **Sparkles** icon or press Enter.
3.  Watch the icons animate to their new calculated positions.

### Rendering
1.  Once satisfied with the spatial setup, click **RENDER**.
2.  The app will send the generated JSON to Replicate.
3.  The final image will appear in an overlay.

---

## 📐 Coordinate System

Lumina uses a modified Cartesian coordinate system centered on the Subject (0,0,0).

| Axis | Representation | Logic |
| :--- | :--- | :--- |
| **X** | Horizontal | Left (-) / Right (+) relative to subject. Affects Profile/Side views. |
| **Y** | Depth | Back (-) / Front (+) relative to subject. Affects Distance (Focal Length). |
| **Z** | Height | Down (-) / Up (+) relative to eye-level. Affects Angles. |

---

## 🔮 Future Roadmap

-   **Multi-Light Support:** Adding secondary fill/rim lights.
-   **Pose Editor:** Simple skeleton manipulation for the subject.
-   **WebVR Support:** Step into the studio using VR headsets.
-   **Local Models:** Support for ComfyUI backend integration.

---

**License:** MIT
**Created by:** [Your Name/Org]
