"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, RefreshCw, VideoOff } from "lucide-react"

type FaceCaptureProps = {
  /** Receives a JPEG data URL when the user captures a frame. */
  onCapture: (dataUrl: string) => void
  /** Disables the controls while the parent is submitting. */
  busy?: boolean
  captureLabel?: string
}

/**
 * Live webcam preview with a single capture button. Captures to an offscreen
 * canvas and hands the parent a JPEG data URL — the parent decides what to do
 * with it (register, or scan). The camera stream is always stopped on unmount,
 * so the browser's in-use indicator never lingers after leaving the page.
 */
export function FaceCapture({ onCapture, busy, captureLabel = "Capture" }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setReady(true)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : name === "NotFoundError"
            ? "No camera was found on this device."
            : "Could not start the camera."
      )
    }
  }, [])

  useEffect(() => {
    start()
    return stop
  }, [start, stop])

  const capture = () => {
    const video = videoRef.current
    if (!video || !ready) return
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    onCapture(canvas.toDataURL("image/jpeg", 0.9))
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <VideoOff className="h-8 w-8 text-gray-400" />
        <p className="max-w-xs text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Starting camera...
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={capture}
        disabled={!ready || busy}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a1f44] disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        {captureLabel}
      </button>
    </div>
  )
}
