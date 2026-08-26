"use server";

export async function reportError(error: {
  message: string;
  stack?: string;
  digest?: string;
}) {
  try {
    console.error("[App Error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  } catch (err) {
    console.error("Failed to log error:", err);
  }
}
