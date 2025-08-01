const tar = require("tar");
const fs = require("fs");

const NPM_URL = "https://registry.npmjs.org";
const ROOT = "public/assets"; // This is where the assets will be stored

const FFMPEG_VERSION = "0.12.15"; // Version of @ffmpeg/ffmpeg
const UTIL_VERSION = "0.12.2";    // Version of @ffmpeg/util
const CORE_VERSION = "0.12.10";  // Version of @ffmpeg/core
const CORE_MT_VERSION = "0.12.10"; // Version of @ffmpeg/core-mt (multi-threaded)

const FFMPEG_TGZ = `ffmpeg-${FFMPEG_VERSION}.tgz`;
const UTIL_TGZ = `util-${UTIL_VERSION}.tgz`;
const CORE_TGZ = `core-${CORE_VERSION}.tgz`;
const CORE_MT_TGZ = `core-mt-${CORE_MT_VERSION}.tgz`;

// URLs for the compressed tarball files on NPM
const FFMPEG_TGZ_URL = `${NPM_URL}/@ffmpeg/ffmpeg/-/${FFMPEG_TGZ}`;
const UTIL_TGZ_URL = `${NPM_URL}/@ffmpeg/util/-/${UTIL_TGZ}`;
const CORE_TGZ_URL = `${NPM_URL}/@ffmpeg/core/-/${CORE_TGZ}`;
const CORE_MT_TGZ_URL = `${NPM_URL}/@ffmpeg/core-mt/-/${CORE_MT_TGZ}`;

// Helper function to create a directory if it doesn't exist
const mkdir = (dir) => {
  !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }); // recursive: true creates parent directories if they don't exist
};

// Function to download a tarball and extract its contents
const downloadAndUntar = async (url, tgzName, dst) => {
  const dir = `${ROOT}/${dst}`;
  // Check if the destination directory already exists, if so, skip download
  if (fs.existsSync(dir)) {
    console.log(`found @ffmpeg/${dst} assets. Skipping download.`);
    return;
  }
  console.log(`Downloading and untarring ${url} into ${dir}`);
  mkdir(dir); // Create the destination directory

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tgzName, data); // Write the downloaded tarball to a temporary file

    // Extract the tarball
    await tar.x({ file: tgzName, C: dir, stripComponents: 1 }); // stripComponents: 1 removes the top-level folder from the tarball
    fs.unlinkSync(tgzName); // Delete the temporary tarball file
    console.log(`Successfully downloaded and untarred ${tgzName}`);
  } catch (error) {
    console.error(`Error processing ${tgzName}:`, error);
  }
};

// Main execution block
(async () => {
  mkdir(ROOT); // Ensure the root assets directory exists
  await downloadAndUntar(FFMPEG_TGZ_URL, FFMPEG_TGZ, "ffmpeg");
  await downloadAndUntar(UTIL_TGZ_URL, UTIL_TGZ, "util");
  await downloadAndUntar(CORE_TGZ_URL, CORE_TGZ, "core");
  await downloadAndUntar(CORE_MT_TGZ_URL, CORE_MT_TGZ, "core-mt");
  console.log("FFmpeg core assets download process complete.");
})();
