import { NextApiRequest, NextApiResponse } from "next";
import semver from "semver";
import packageJson from "../../../../package.json";

const LATEST_VERSION_URL =
  "https://api.github.com/repos/linkwarden/linkwarden/releases/latest";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { version } = packageJson;
    try {
      const latestVersionResponse = await fetch(LATEST_VERSION_URL, {
        next: { revalidate: 3600 },
      });
      const latestVersionData = await latestVersionResponse.json();
      const latestVersion = latestVersionData.tag_name;
      let updateAvailable = false;
      if (semver.gt(latestVersion, version)) {
        updateAvailable = true;
      }

      return res.status(200).json({
        updateAvailable,
        currentVersion: version,
        latestVersion,
      });
    } catch (error) {
      console.error("Error fetching latest version:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching latest version." });
    }
  }
}
