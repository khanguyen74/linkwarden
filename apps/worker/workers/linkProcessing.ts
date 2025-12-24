import archiveHandler from "../lib/archiveHandler";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types";
import { delay } from "@linkwarden/lib";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";
import { launchBrowser } from "../lib/browser";
import { countUnprocessedBillableLinks } from "../lib/countUnprocessedBillableLinks";
import { Browser } from "playwright";

const ARCHIVE_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;
const BROWSER_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const BROWSER_TIMEOUT_MS =
  (Number(process.env.BROWSER_TIMEOUT_MINUTES) || 5) * 60 * 1000;

export async function linkProcessing(interval = 10) {
  console.log("\x1b[34m%s\x1b[0m", "Starting link processing...");

  let browser: Browser | null = null;
  let browserStartTs = Date.now();

  // Helper to (re)launch browser
  const restartBrowser = async (reason: string) => {
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
    } catch {}
    console.log("\x1b[34m%s\x1b[0m", `Restarting main browser (${reason})...`);
    browser = await launchBrowser();
    browserStartTs = Date.now();
  };

  while (true) {
    // Restart every 30 minutes to prevent clogging
    if (
      browser?.isConnected() &&
      Date.now() - browserStartTs >= BROWSER_MAX_AGE_MS
    ) {
      await restartBrowser("30-minute rotation");
    }

    const links = await getLinkBatchFairly({
      maxBatchLinks: ARCHIVE_TAKE_COUNT,
    });

    if (links.length === 0) {
      if (
        browser?.isConnected() &&
        Date.now() - browserStartTs >= BROWSER_TIMEOUT_MS
      ) {
        // Close browser after inactivity timeout
        await browser.close();
        console.log(
          "\x1b[34m%s\x1b[0m",
          "Closing browser due to inactivity..."
        );
      }
      await delay(interval);
      continue;
    }

    if (
      !browser?.isConnected() &&
      process.env.DISABLE_PRESERVATION?.toLowerCase() !== "true"
    ) {
      browser = await launchBrowser();
      console.log("\x1b[34m%s\x1b[0m", "Launched new browser instance.");
      browserStartTs = Date.now();
    }

    const archiveLink = async (link: LinkWithCollectionOwnerAndTags) => {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `- Link ${link.url} for user ${link.collection.ownerId}`
        );

        await archiveHandler(link, browser);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );

        if (
          !browser?.isConnected() &&
          process.env.DISABLE_PRESERVATION?.toLowerCase() !== "true"
        ) {
          await restartBrowser("browser disconnected");
        }
      }
    };

    const processingPromises = links.map((e) => archiveLink(e));
    await Promise.allSettled(processingPromises);

    const unprocessedLinkCount = await countUnprocessedBillableLinks();

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${unprocessedLinkCount} left.`
    );

    await delay(interval);
  }
}
