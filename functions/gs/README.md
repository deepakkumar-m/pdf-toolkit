# Ghostscript Binary for Netlify Functions

To enable PDF compression on Netlify, you must provide a static Ghostscript binary compatible with AWS Lambda/Netlify Functions (Amazon Linux 2).

## Steps:
1. Download or build a static Ghostscript binary for Amazon Linux 2.
   - You can find prebuilt binaries or build from source.
2. Place the binary in this directory and name it `gs` (no extension).
3. In your Netlify site settings, set the environment variable:
   ```
   GS_EXEC=/var/task/functions/gs/gs
   ```
4. Ensure your `netlify.toml` includes:
   ```toml
   [functions]
   included_files = ["functions/gs/**"]
   ```

## Resources:
- https://github.com/ArtifexSoftware/ghostpdl-downloads/releases
- https://github.com/netlify/pod-the-builder/issues/6

If you need help building a static binary, let me know!