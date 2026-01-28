import type { DeviceType, EnvironmentComponent } from "@cuss/cuss2-ts";
import { ComponentInterrogation } from "../../src/componentInterrogation.ts";

export function getComponentType(component: EnvironmentComponent): DeviceType {
  if (ComponentInterrogation.isBarcodeReader(component)) {
    return "BARCODE_READER";
  }
  if (ComponentInterrogation.isBagTagPrinter(component)) {
    return "BAG_TAG_PRINTER";
  }
  if (ComponentInterrogation.isBoardingPassPrinter(component)) {
    return "BOARDING_PASS_PRINTER";
  }
  if (ComponentInterrogation.isDocumentReader(component)) {
    return "PASSPORT_READER";
  }
  if (ComponentInterrogation.isCardReader(component)) {
    return "MSR_READER";
  }
  if (ComponentInterrogation.isKeypad(component)) {
    return "KEY_PAD";
  }
  if (ComponentInterrogation.isHeadset(component)) {
    return "HEADSET";
  }
  if (ComponentInterrogation.isScale(component)) {
    return "SCALE";
  }
  if (ComponentInterrogation.isIllumination(component)) {
    return "ILLUMINATION";
  }
  if (ComponentInterrogation.isAnnouncement(component)) {
    return "ANNOUNCEMENT";
  }
  if (ComponentInterrogation.isFeeder(component)) {
    return "FEEDER";
  }
  if (ComponentInterrogation.isDispenser(component)) {
    return "DISPENSER";
  }
  return "UNKNOWN";
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "ws:" || parsed.protocol === "wss:";
  }
  catch {
    return false;
  }
}

export function sanitizeInput(input: unknown): unknown {
  if (typeof input === "string") {
    // deno-lint-ignore no-control-regex
    return input.replace(/[\x00-\x1F\x7F]/g, "");
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

export function validateComponentId(id: unknown): number {
  const num = Number(id);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`Invalid component ID: ${id}`);
  }
  return num;
}

export function createExponentialBackoff(
  baseDelay: number,
  maxDelay: number,
  factor = 2,
): (attempt: number) => number {
  return (attempt: number) => {
    const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
    return delay + Math.random() * delay * 0.1;
  };
}
