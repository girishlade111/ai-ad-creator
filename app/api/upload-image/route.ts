import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    console.log("[v0] API: Upload image request received")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] API: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] API: File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `uploaded-${timestamp}-${randomString}.${extension}`

    console.log("[v0] API: Uploading to Vercel Blob as:", filename)

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    console.log("[v0] API: ✅ Successfully uploaded to Vercel Blob")
    console.log("[v0] API: Blob URL:", blob.url)

    return NextResponse.json({
      imageUrl: blob.url,
    })
  } catch (error) {
    console.error("[v0] API: ❌ Error uploading image:", error)
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
