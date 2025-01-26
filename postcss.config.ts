import tailwindcss from "@tailwindcss/postcss7-compat";
import autoprefixer from "autoprefixer";
import type { Config } from "postcss-load-config";

export default {
  plugins: [tailwindcss, autoprefixer],
} satisfies Config;
