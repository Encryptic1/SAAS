import type { Config } from "tailwindcss";
import preset from "@market-standard/config/tailwind";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [preset],
};

export default config;
