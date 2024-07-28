# WebGL Project

This project includes a simple WebGL scene with a day and night cycle, multiple objects, and a simple camera system. All objects are imported via an OBJ importer and the scene is rendered with a toon shader.

## Features

- Simple interaction with the scene (rotate with boundaries & smoothened zoom) including a simple camera system
- Sphere texture mapping (Sun and Moon texture)
- Lighting system with ambient and directional light
- Multiple objects in the scene, managed by an OBJ importer
- Toon shading for a cartoonish look
- Day and night cycle with a moving sun and moon, color-ease, and configurable speed and light distance

## Setup

1. Clone the repository
2. Run `pnpm install` in the root directory
3. Run `pnpm dev` to start the development server
4. Open `http://localhost:5173/` in your browser to view the project

> **Note**  
> The project is also deployed on [cg.robinschmidt.dev](https://cg.robinschmidt.dev/).

## Special Quirks

Important: When using the OBJ importer, the OBJ file and the MTL file must be in the same directory and both files must have the same name. Also, when exporting models/scenes from Blender, make sure to select the option "Triangulated Mesh" in the export settings.

## Formatting

- This project uses [Prettier](https://prettier.io/) for formatting.
- WebStorm has built-in support for Prettier:
  - Please enable it on save!
  - You can set it up in `Settings > Languages & Frameworks > JavaScript > Prettier`.
- VS Code requires a bit more setup. Check out [this guide](https://www.robinwieruch.de/how-to-use-prettier-vscode/) for more info.
- To format the code, run `pnpm format`.

## Appendix

- Sun & Moon textures: [Solar System Scope](https://www.solarsystemscope.com/textures/)
- OBJ file: [TurboSquid](https://www.turbosquid.com/3d-models/3d-model-low-poly-house-1910430)
