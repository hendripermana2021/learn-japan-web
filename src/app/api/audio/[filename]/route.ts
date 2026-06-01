import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

function getMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".mp3") {
    return "audio/mpeg";
  }

  if (ext === ".wav") {
    return "audio/wav";
  }

  if (ext === ".ogg") {
    return "audio/ogg";
  }

  return "application/octet-stream";
}

export async function GET(request: Request, context: RouteContext) {
  const { filename } = await context.params;

  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const audioDir = path.join(process.cwd(), "src", "data", "audio");
  const fullPath = path.join(audioDir, filename);

  try {
    const fileBuffer = await fs.readFile(fullPath);
    const fileSize = fileBuffer.byteLength;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const [startRaw, endRaw] = rangeHeader.replace("bytes=", "").split("-");
      const parsedStart = Number.parseInt(startRaw, 10);
      const parsedEnd = endRaw ? Number.parseInt(endRaw, 10) : fileSize - 1;

      const start = Number.isNaN(parsedStart) ? 0 : Math.max(0, parsedStart);
      const end = Number.isNaN(parsedEnd) ? fileSize - 1 : Math.min(parsedEnd, fileSize - 1);

      if (start <= end) {
        const chunk = fileBuffer.subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "Content-Type": getMimeType(filename),
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(chunk.byteLength),
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(filename),
        "Accept-Ranges": "bytes",
        "Content-Length": String(fileSize),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }
}
