// app/api/debug-runtime/route.ts
export const runtime = "nodejs";
export function GET() {
  // @ts-ignore
  const node = typeof process !== "undefined" && process?.versions?.node;
  return Response.json({ runtime: node ? `node:${process.versions.node}` : "edge" });
}