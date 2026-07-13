import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

import { authenticate } from "../shopify.server";

const WEBHOOKS_DIRECTORY = join(cwd(), "workshop", "events");
const SAFE_FILENAME_PART = /^[A-Za-z0-9_-]+$/;

const isSafeFilenamePart = (value) =>
  typeof value === "string" && SAFE_FILENAME_PART.test(value);

export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  //Read from headers
  const eventHandle = request.headers.get("shopify-handle");
  const webhookId = request.headers.get("shopify-webhook-id");

  if (![eventHandle, webhookId].every(isSafeFilenamePart)) {
    console.error(
      `Invalid webhook name or ID for ${topic} webhook from ${shop}`,
    );
    return new Response("Invalid webhook name or ID", { status: 400 });
  }

  const filename = `${eventHandle}-${Date.now()}.${webhookId}.json`;
  const contents = `${JSON.stringify(payload, null, 2)}\n`;

  await mkdir(WEBHOOKS_DIRECTORY, { recursive: true });
  await writeFile(join(WEBHOOKS_DIRECTORY, filename), contents, "utf8");

  console.log(`--> Saved ${topic} event for ${shop} to ${filename}`);

  return new Response();
};
