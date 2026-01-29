# Firebase Studio

```bash
gcloud run services update studio --project=studio-4970575221-858b3 --region=us-central1 --update-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest

gcloud run services update-traffic studio \
  --project=studio-4970575221-858b3 \
  --region=us-central1 \
  --to-latest
```