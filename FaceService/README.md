# Dominion City Face Service

A stateless FastAPI microservice that turns a face image into a 512-dimension
ArcFace embedding (InsightFace `buffalo_l`). It stores nothing: the Node
backend owns member records, embeddings and images (in Cloudflare R2) and
decides who matches whom.

## Run

```bash
cd FaceService
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# First boot downloads the buffalo_l model pack (~300 MB) to ~/.insightface.
export FACE_SERVICE_API_KEY=<same value as the backend's FACE_SERVICE_API_KEY>
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`GET /health` returns `{"status":"ok"}` without loading the model.

## API

`POST /analyze` (header `x-api-key: <FACE_SERVICE_API_KEY>`)

```json
{ "image_base64": "<base64 JPEG/PNG, no data: prefix>", "enroll": true }
```

Returns the detected faces, each with an L2-normalised `embedding`, `bbox` and
`det_score`, plus `primary` (the strongest face). Because embeddings are
normalised, two faces are compared with a dot product (cosine similarity) in
the backend.

- `enroll: true` applies quality gates and requires exactly one face (used when
  a member registers their face).
- `enroll: false` (default) is lenient and returns every face it finds (used
  when the technical dashboard identifies someone).

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `FACE_SERVICE_API_KEY` | _(empty)_ | Shared secret; must match the backend. Empty disables the check (dev only). |
| `FACE_MIN_DET_SCORE` | `0.6` | Minimum detector confidence at enrolment. |
| `FACE_MIN_PIXELS` | `80` | Minimum face width/height at enrolment. |
| `FACE_MAX_IMAGE_BYTES` | `8388608` | Largest image the service will decode. |
