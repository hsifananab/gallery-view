import esbuild from "esbuild";
import { readFileSync } from "fs";

const banner = readFileSync("banner.txt", "utf8");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const minify = args.includes("--minify");

const define = {
  "process.env.NODE_ENV": minify ? '"production"' : '"development"',
};

const baseConfig = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  external: ["obsidian"],
  format: "cjs",
  target: "es2018",
  platform: "browser",
  banner: { js: banner },
  minify,
  sourcemap: "inline",
  define,
};

const main = async () => {
  if (watch) {
    const ctx = await esbuild.context(baseConfig);
    await ctx.watch();
    console.log("👀 Watching for changes…");
  } else {
    await esbuild.build(baseConfig);
    console.log("✅ Build succeeded");
  }
};

main().catch((err) => {
  console.error("⚠️ Build failed");
  console.error(err);
  process.exit(1);
});
