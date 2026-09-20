import { defineConfig } from "vite";

// Project Pages live at /<repository>/ rather than the domain root. Local and
// Sites builds retain the root path, while GitHub Actions derives its path from
// the repository that triggered the deployment.
const githubRepository = process.env.GITHUB_REPOSITORY?.split("/").at(-1);

export default defineConfig({
  base:
    process.env.GITHUB_ACTIONS && githubRepository
      ? `/${githubRepository}/`
      : "/",
});
