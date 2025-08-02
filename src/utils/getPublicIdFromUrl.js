export const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  // Split the URL path
  const parts = url.split("/");

  // Find and remove the version (starts with "v" and is numeric)
  const versionIndex = parts.findIndex(part => /^v\d+/.test(part));
  if (versionIndex !== -1) {
    parts.splice(versionIndex, 1);
  }

  const fileNameWithExt = parts.pop(); // "mp2s0ppprqnarcentn71.jpg"
  const publicId = fileNameWithExt.split(".")[0]; // "mp2s0ppprqnarcentn71"

  return publicId;
};
