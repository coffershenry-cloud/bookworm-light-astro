import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "astro-auto-import";
import gtm from "astro-gtm-lite";
import { defineConfig, fontProviders, sharpImageService } from "astro/config";
import config from "./src/config/config.json";
import theme from "./src/config/theme.json";

/*
 * Fix migrated HTML tables that Markdown mistakenly interprets
 * as code blocks. Convert those blocks back into actual HTML.
 */
function remarkRenderHtmlTables() {
  return (tree) => {
    const visit = (node) => {
      if (
        node.type === "code" &&
        !node.lang &&
        /<table\b[\s\S]*<\/table>/i.test(node.value)
      ) {
        node.type = "html";
        node.value = node.value.trim();
        delete node.lang;
        delete node.meta;
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  };
}

// Helper to parse font string format.
function parseFontString(fontStr) {
  const [name, weightPart] = fontStr.split(":");
  let weights = [400];

  if (weightPart) {
    const weightMatch = weightPart.match(/wght@?([\d;]+)/);

    if (weightMatch) {
      weights = weightMatch[1]
        .split(";")
        .map((w) => parseInt(w, 10));
    }
  }

  const cleanName = name.replace(/\+/g, " ");

  return { name: cleanName, weights };
}

// Build fonts configuration from theme.json.
const fontsConfig = Object.entries(theme.fonts.font_family)
  .filter(([key]) => !key.includes("_type"))
  .map(([key, fontStr]) => {
    const { name, weights } = parseFontString(fontStr);
    const typeKey = `${key}_type`;
    const fallback = theme.fonts.font_family[typeKey] || "sans-serif";

    return {
      name,
      cssVariable: `--font-${key}`,
      provider: fontProviders.google(),
      weights,
      display: "swap",
      fallbacks: [fallback],
    };
  });

// Astro configuration.
export default defineConfig({
  site: config.site.base_url
    ? config.site.base_url
    : "http://examplesite.com",

  base: config.site.base_path
    ? config.site.base_path
    : "/",

  trailingSlash: config.site.trailing_slash
    ? "always"
    : "never",

  image: {
    service: sharpImageService(),
  },

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: fontsConfig,

  integrations: [
    react(),
    sitemap(),

    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),

    mdx(),

    gtm({
      enable: config.google_tag_manager.enable,
      id: config.google_tag_manager.gtm_id,
      devMode: true,
    }),
  ],

  markdown: {
    processor: unified({
      remarkPlugins: [remarkRenderHtmlTables],
    }),

    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
});
