# 🎭 FaceGrid Studio

An advanced, interactive 3D face geometry simulator built entirely with WebGL and Three.js. Experience instant, hardware-accelerated spatial depth mapping right inside your browser—**0% AI APIs, 100% Pure Mathematical Client-Side Precision.**

[🔗 Launch Live Demo / כניסה לאפליקציה](https://yourusername.github.io/facegrid) *(החליפי פה לקישור של ה-GitHub Pages שלך לאחר שתפעילי אותו)*

---

## ✨ Features

* 📷 **Real-Time Depth Mapping:** Instantly converts your live webcam stream into a responsive 3D spatial matrix.
* 🌊 **Futuristic Effects:** Toggle between cutting-edge visual states like *Liquid Metal Waves*, *Digital Matrix Rain*, *Geometric Meshes*, and *Floating Cyber Pixels*.
* 🎨 **Dynamic Color Studio:** Seamlessly switch between premium lighting profiles, including Neon Aqua, Hot Pink, Cosmic Gold, and a Clean Slate White default.
* 🎛️ **Depth Intensity Control:** Integrated a precise, hardware-accelerated range slider to alter the 3D extrusion depth on the fly.
* 🔄 **Calibrated Mirror Responsive Move:** Built-in 1-to-1 matrix flipping so the avatar's movements perfectly mirror yours with zero latency.
* 📸 **Smart Capture System:** Features a 4-second visual countdown workflow for clean, mouse-free avatar snapshots.
* 🎥 **Native Canvas Recording:** Capture and download high-framerate 3D motion clips directly as WebM/VP9 video files.
* 🌐 **Dual-Language Interface:** Full Hebrew (RTL) and English (LTR) toggle built natively into the UI.

---

## 🛠️ Architecture & Performance Optimization

Unlike most modern web demos that rely heavily on heavy server-side AI models or cloud APIs, **FaceGrid** achieves a flawless 60 FPS rendering loop by utilizing direct hardware acceleration:

1. **Pixel Sampling:** Captures frame buffers downsampled to a clean $128 \times 128$ matrix.
2. **Luminance Calculation:** Parses grayscale brightness vectors on the client side.
3. **Vertex Displacement:** Mutates the Z-indices of a plane geometry dynamically inside the WebGL render loop.

*No tracking, no backend servers, completely private and instant.*

---

## 🚀 Quick Start (Local Run)

1. Clone this repository:
   ```bash
   git clone [https://github.com/yourusername/facegrid.git](https://github.com/yourusername/facegrid.git)