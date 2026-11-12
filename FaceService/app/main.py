"""
Dominion City face service.

A small, stateless FastAPI service that turns a face image into a numeric
embedding. It owns no data: the Node backend stores embeddings and images and
decides who matches whom. Keeping this service stateless means it can be
scaled, restarted or replaced without touching member records.

InsightFace (RetinaFace detection + ArcFace embedding, the `buffalo_l` pack)
does the work; OpenCV only decodes the incoming bytes. The returned embedding
is L2-normalised, so the backend can compare two faces with a plain dot
product (cosine similarity).
"""

from __future__ import annotations

import base64
import binascii
import os
from functools import lru_cache
from typing import Optional

import cv2
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

# ---- Configuration ---------------------------------------------------------

# Shared secret. The Node backend sends it as `x-api-key`; set the same value
# in both places. When unset the check is skipped, which is only sensible on a
# trusted local network during development.
API_KEY = os.getenv("FACE_SERVICE_API_KEY", "").strip()

# A face smaller or blurrier than these is rejected at enrolment, where a weak
# capture would poison every later match. Detection (recognition) is lenient.
MIN_DET_SCORE = float(os.getenv("FACE_MIN_DET_SCORE", "0.6"))
MIN_FACE_PIXELS = int(os.getenv("FACE_MIN_PIXELS", "80"))

# Largest image we will decode, as a guard against a malicious oversized body.
MAX_IMAGE_BYTES = int(os.getenv("FACE_MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))


# ---- Model -----------------------------------------------------------------


@lru_cache(maxsize=1)
def get_model():
    """Load InsightFace once and reuse it. First call downloads the pack."""
    from insightface.app import FaceAnalysis

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    # det_size is the detector's working resolution; 640 is the stock value.
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app


# ---- Schemas ---------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    # Raw base64 (no data: prefix) of a JPEG or PNG. The backend strips the
    # prefix before forwarding, so this service never parses data URLs.
    image_base64: str
    # When true, apply the enrolment-quality gates and require exactly one face.
    enroll: bool = False


class FaceResult(BaseModel):
    embedding: list[float]
    bbox: list[float]
    det_score: float


class AnalyzeResponse(BaseModel):
    faces: list[FaceResult]
    # The single best face, repeated for the common one-face case so the
    # backend need not re-sort.
    primary: Optional[FaceResult]


# ---- App -------------------------------------------------------------------

app = FastAPI(title="Dominion City Face Service", version="1.0.0")


async def require_api_key(x_api_key: str = Header(default="")) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
async def health() -> dict:
    # Does not load the model, so it stays cheap for liveness probes.
    return {"status": "ok"}


@app.on_event("startup")
async def warm_model() -> None:
    # Pay the load (and first-run download) cost at boot, not on the first
    # member's scan. Failure here should crash the service loudly.
    get_model()


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(require_api_key)])
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    image = _decode_image(req.image_base64)
    model = get_model()

    faces = model.get(image)
    if not faces:
        raise HTTPException(status_code=422, detail="No face detected")

    # Strongest detection first.
    faces.sort(key=lambda f: float(f.det_score), reverse=True)

    if req.enroll:
        if len(faces) > 1:
            raise HTTPException(
                status_code=422,
                detail="More than one face in the frame; capture one person alone",
            )
        best = faces[0]
        if float(best.det_score) < MIN_DET_SCORE:
            raise HTTPException(status_code=422, detail="Face is unclear; try better lighting")
        x1, y1, x2, y2 = best.bbox
        if min(x2 - x1, y2 - y1) < MIN_FACE_PIXELS:
            raise HTTPException(status_code=422, detail="Face is too small; move closer")

    results = [
        FaceResult(
            embedding=_normed(f).tolist(),
            bbox=[float(v) for v in f.bbox],
            det_score=float(f.det_score),
        )
        for f in faces
    ]
    return AnalyzeResponse(faces=results, primary=results[0] if results else None)


# ---- Helpers ---------------------------------------------------------------


def _normed(face) -> np.ndarray:
    """L2-normalised embedding, so downstream cosine == dot product."""
    emb = getattr(face, "normed_embedding", None)
    if emb is None:
        emb = face.embedding
        norm = np.linalg.norm(emb)
        emb = emb / norm if norm else emb
    return np.asarray(emb, dtype=np.float32)


def _decode_image(image_base64: str) -> np.ndarray:
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="image_base64 is not valid base64")

    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")

    image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode the image")
    return image
