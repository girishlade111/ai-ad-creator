import { NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

export const maxDuration = 300 // 5 minutes - REQUIRES VERCEL PRO PLAN OR HIGHER
export const dynamic = "force-dynamic" // Ensure this route is always dynamic

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(req: Request) {
  try {
    console.log("[v0] ========== VIDEO GENERATION REQUEST START ==========")
    console.log("[v0] API: Timestamp:", new Date().toISOString())
    console.log("[v0] API: Environment:", process.env.VERCEL_ENV || "local")
    console.log("[v0] API: FAL_KEY exists:", !!process.env.FAL_KEY)
    console.log("[v0] API: FAL_KEY length:", process.env.FAL_KEY?.length || 0)

    const body = await req.json()
    const { storyboard, images, productDescription, style } = body

    // Log request body size
    const bodyString = JSON.stringify(body)
    const bodySizeKB = (bodyString.length / 1024).toFixed(2)
    const bodySizeMB = (bodyString.length / 1024 / 1024).toFixed(2)
    console.log("[v0] API: Request body size:", bodySizeKB, "KB /", bodySizeMB, "MB")
    console.log("[v0] API: Vercel limit is 4.5 MB for serverless functions")

    // Log images details
    console.log("[v0] API: Images count:", images?.length || 0)
    if (images && Array.isArray(images)) {
      images.forEach((img: string, idx: number) => {
        const isDataUrl = img?.startsWith("data:")
        const imgSize = img?.length || 0
        const imgSizeKB = (imgSize / 1024).toFixed(2)
        console.log(`[v0] API: Image ${idx + 1}:`, {
          isDataUrl,
          sizeKB: imgSizeKB,
          urlPreview: isDataUrl ? "data:..." : img?.substring(0, 100),
        })
      })
    }

    // Log storyboard details
    const storyboardString = JSON.stringify(storyboard)
    const storyboardSizeKB = (storyboardString.length / 1024).toFixed(2)
    console.log("[v0] API: Storyboard size:", storyboardSizeKB, "KB")
    console.log("[v0] API: Storyboard moments count:", storyboard?.moments?.length || 0)

    // Log other parameters
    console.log("[v0] API: Product description:", productDescription)
    console.log("[v0] API: Style:", style)

    if (!storyboard || !images || images.length === 0) {
      console.error("[v0] API: Missing required fields")
      return NextResponse.json({ error: "Storyboard and images are required" }, { status: 400 })
    }

    if (images.length !== 3) {
      console.error("[v0] API: Wrong number of images:", images.length)
      return NextResponse.json({ error: `Expected 3 images but received ${images.length}` }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      console.error("[v0] API: FAL_KEY is not configured!")
      return NextResponse.json(
        {
          error: "FAL_KEY not configured",
          details: "The FAL_KEY environment variable is missing. Please add it in your Vercel project settings.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] API: Starting video generation with Veo 3.1")
    console.log("[v0] API: Request will take ~2 minutes")

    const videoPrompt = `Create an 8-second ${style} commercial for ${productDescription}.

SCENES (8 seconds total):
${storyboard.moments
  .map(
    (m: any, idx: number) => `
${m.timing}: ${m.title}
${m.description}
Camera: ${m.cameraMovement}`,
  )
  .join("\n")}

Audio: ${storyboard.audioStrategy}
Music: ${storyboard.musicStyle}

CRITICAL REQUIREMENTS:
- Style: ${style}, cinematic, professional quality
- Duration: EXACTLY 8 seconds total
- ENDING: The final scene (7-8 seconds) MUST have a clear, definitive ending:
  * Fade to black starting at 7.5 seconds
  * OR final logo/product reveal with hold
  * OR clear visual conclusion (person walks away, door closes, product placed down)
  * The video must feel COMPLETE, not abruptly cut off
  * Last frame should communicate "this is the end"

PHYSICAL & CULTURAL COHERENCE (CRITICAL):
✅ Physical Logic:
   - Bottles/containers MUST be visibly OPEN (cap removed, lid off) when liquid is pouring
   - Show the opening action BEFORE pouring (twist cap, pull tab, remove lid)
   - Objects must be in correct physical states for their actions
   - Respect gravity and physics at all times
   - One logical action per person at a time

✅ Cultural Accuracy:
   - Mate (Argentine tea): Show ONE person drinking, then PASSING to another - NEVER two people drinking from same mate simultaneously
   - Respect cultural practices: proper handling of cultural items, accurate rituals
   - Research and honor cultural context for any cultural products or practices
   - Show authentic, respectful use of cultural items

✅ Logical Action Sequences:
   - Actions must follow natural order: open → pour → drink (NOT pour → open)
   - Cause and effect must be clear and visible
   - Human interactions must be natural and realistic
   - Objects handled correctly (phones right-side up, proper grip, natural movements)

❌ NEVER SHOW:
   - Closed bottles pouring liquid
   - Multiple people using same single-use item simultaneously (mate, straw, etc.)
   - Impossible physics or illogical actions
   - Cultural practices done incorrectly
   - Actions out of sequence (effect before cause)
   - Abrupt endings without visual closure

- Smooth transitions between scenes with natural motion
- Clear, satisfying ending with visual closure (fade out, logo hold, or conclusive action)`

    const negativePrompt = `blurry, low quality, distorted, warped, deformed, bad anatomy, watermark, signature, text artifacts, longer than 8 seconds, extended duration, slow pacing, static shots, amateur quality, physical inconsistencies, closed bottles pouring liquid, impossible physics, illogical actions, discontinuity errors, cultural inaccuracies, multiple people using same single-use item simultaneously, actions out of sequence, cause without effect, effect without cause, abrupt ending, incomplete ending, cut-off ending`

    console.log("[v0] API: Video prompt length:", videoPrompt.length, "characters")
    console.log("[v0] API: Negative prompt length:", negativePrompt.length, "characters")
    console.log("[v0] API: Calling fal.ai Veo 3.1 API...")

    // Log the payload being sent to fal.ai
    const falPayload = {
      image_urls: images,
      prompt: videoPrompt,
      negative_prompt: negativePrompt,
      duration: "8s",
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: true,
    }
    const falPayloadString = JSON.stringify(falPayload)
    const falPayloadSizeKB = (falPayloadString.length / 1024).toFixed(2)
    const falPayloadSizeMB = (falPayloadString.length / 1024 / 1024).toFixed(2)
    console.log("[v0] API: Payload to fal.ai size:", falPayloadSizeKB, "KB /", falPayloadSizeMB, "MB")

    const result: any = await fal.subscribe("fal-ai/veo3.1/reference-to-video", {
      input: falPayload,
      logs: true,
      onQueueUpdate: (update) => {
        console.log("[v0] Veo 3.1 queue status:", update.status)
        if (update.status === "IN_PROGRESS") {
          if (update.logs) {
            update.logs
              .map((log: any) => log.message)
              .forEach((msg: string) => console.log("[v0] Veo 3.1 progress:", msg))
          }
        }
        if (update.status === "IN_QUEUE") {
          console.log("[v0] Veo 3.1 in queue, position:", (update as any).queue_position || "unknown")
        }
      },
    })

    console.log("[v0] API: Veo 3.1 result received")
    console.log("[v0] API: Result type:", typeof result)
    console.log("[v0] API: Result keys:", result ? Object.keys(result) : "null")
    console.log("[v0] API: Full result structure:", JSON.stringify(result, null, 2))

    let videoUrl: string | undefined

    try {
      if (result && typeof result === "object") {
        // Try all possible response structures
        if (result.video?.url) {
          videoUrl = result.video.url
          console.log("[v0] API: Found video URL at result.video.url")
        } else if (result.data?.video?.url) {
          videoUrl = result.data.video.url
          console.log("[v0] API: Found video URL at result.data.video.url")
        } else if (result.data?.url) {
          videoUrl = result.data.url
          console.log("[v0] API: Found video URL at result.data.url")
        } else if (result.url) {
          videoUrl = result.url
          console.log("[v0] API: Found video URL at result.url")
        } else if (result.output?.url) {
          videoUrl = result.output.url
          console.log("[v0] API: Found video URL at result.output.url")
        } else if (result.output?.video?.url) {
          videoUrl = result.output.video.url
          console.log("[v0] API: Found video URL at result.output.video.url")
        } else if (typeof result === "string") {
          videoUrl = result
          console.log("[v0] API: Result is a string URL")
        }
      }

      if (!videoUrl) {
        console.error("[v0] API: Could not find video URL in response")
        console.error("[v0] API: Available keys:", result ? Object.keys(result) : "none")
        throw new Error("Video URL not found in Veo 3.1 response. Check logs for response structure.")
      }

      console.log("[v0] API: Video URL:", videoUrl)
      console.log("[v0] API: Video generation successful!")
      console.log("[v0] ========== VIDEO GENERATION REQUEST END (SUCCESS) ==========")

      return NextResponse.json({
        videoUrl,
        prompt: videoPrompt,
        metadata: {
          duration: "8s",
          resolution: "720p",
          aspectRatio: "16:9",
          style,
          scenesCount: storyboard.moments.length,
        },
      })
    } catch (urlError) {
      console.error("[v0] API: Error extracting video URL:", urlError)
      console.error("[v0] API: Result structure:", JSON.stringify(result, null, 2))
      throw new Error(`Failed to extract video URL: ${urlError instanceof Error ? urlError.message : "Unknown error"}`)
    }
  } catch (error) {
    console.error("[v0] ========== VIDEO GENERATION REQUEST END (ERROR) ==========")
    console.error("[v0] API: Error generating video:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : "UnknownError"

    console.error("[v0] API: Error name:", errorName)
    console.error("[v0] API: Error message:", errorMessage)
    if (errorStack) {
      console.error("[v0] API: Error stack:", errorStack)
    }

    // Log the full error object
    console.error("[v0] API: Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

    return NextResponse.json(
      {
        error: "Failed to generate video",
        details: errorMessage,
        errorName: errorName,
        troubleshooting: {
          fal_key: "Check that FAL_KEY is configured in Vercel environment variables",
          timeout: "Video generation takes ~2 minutes. Requires Vercel Pro plan for maxDuration support",
          images: "Ensure all 3 keyframe images are valid and accessible",
          request_size: "Check that request body is under 4.5MB (Vercel limit)",
        },
      },
      { status: 500 },
    )
  }
}
