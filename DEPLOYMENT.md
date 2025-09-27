# Deployment Guide - Therapy App Backend

This guide walks you through deploying the FastAPI backend to Google Cloud Run using GitHub Actions.

## Prerequisites

1. **Google Cloud Project**: Create a GCP project
2. **Google Cloud CLI**: Install gcloud CLI on your local machine
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **Gemini API Key**: Get an API key from Google AI Studio

## Google Cloud Setup

### 1. Enable Required APIs

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions" \
  --display-name="GitHub Actions"

# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
```

### 3. Create Cloud Run Service Account (for runtime)

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create cloudrun-therapyapp \
  --description="Service account for therapy app Cloud Run service" \
  --display-name="Cloud Run Therapy App"

# Grant Firestore access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudrun-therapyapp@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudrun-therapyapp@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Store Secrets in Google Secret Manager

```bash
# Store Gemini API key
echo "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Store GCP credentials for the app (create a minimal service account key)
gcloud iam service-accounts keys create app-credentials.json \
  --iam-account=cloudrun-therapyapp@$PROJECT_ID.iam.gserviceaccount.com

gcloud secrets create gcp-credentials --data-file=app-credentials.json

# Clean up local files
rm app-credentials.json
```

## GitHub Repository Setup

### 1. Set GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- **`GCP_PROJECT_ID`**: Your Google Cloud Project ID
- **`GCP_SA_KEY`**: Contents of the `github-actions-key.json` file
- **`GEMINI_API_KEY`**: Your Gemini API key from Google AI Studio
- **`CLOUD_RUN_SERVICE_ACCOUNT`**: `cloudrun-therapyapp@YOUR_PROJECT_ID.iam.gserviceaccount.com`

### 2. Verify GitHub Actions Workflow

The workflow file is located at `.github/workflows/deploy.yml`. It will:

1. **Test**: Install dependencies and run basic import tests
2. **Build**: Create Docker image and push to Google Artifact Registry
3. **Deploy**: Deploy to Cloud Run with proper configuration

## Local Development Setup

### 1. Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
ENVIRONMENT=development
```

### 2. Firebase/Firestore Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore in your project
firebase init firestore
```

### 3. Test Locally

```bash
cd Backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

## Deployment Process

### Manual Deployment

```bash
# Build and test locally
docker build -f docker/Dockerfile -t therapyapp-backend .

# Test the container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds \
  therapyapp-backend
```

### Automatic Deployment

1. **Push to `main` or `develop` branch**: This triggers the GitHub Actions workflow
2. **Monitor the workflow**: Check the Actions tab in your GitHub repository
3. **Access your app**: The workflow will output the Cloud Run service URL

## Post-Deployment

### 1. Verify Deployment

```bash
# Get service URL
gcloud run services describe therapyapp-backend \
  --region=us-central1 \
  --format='value(status.url)'

# Test the API
curl https://YOUR_SERVICE_URL/docs
```

### 2. Monitor Logs

```bash
# View logs
gcloud logs read --service-name=therapyapp-backend \
  --limit=50
```

### 3. Set up Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=therapyapp-backend \
  --domain=api.yourtherapyapp.com \
  --region=us-central1
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Service Accounts**: Use minimal permissions principle
3. **HTTPS**: Cloud Run provides HTTPS by default
4. **CORS**: Configure CORS properly for your frontend
5. **Authentication**: Implement proper authentication for production

## Troubleshooting

### Common Issues

1. **"Service account key not found"**: Ensure the key is properly formatted as a JSON string in GitHub secrets
2. **"Permission denied"**: Check that your service account has the necessary roles
3. **"Model not found"**: The Gemini model name has been updated to `gemini-pro`
4. **"Secrets not accessible"**: Verify Secret Manager API is enabled and service account has access

### Debug Commands

```bash
# Check service status
gcloud run services describe therapyapp-backend --region=us-central1

# View recent logs
gcloud logs tail --service-name=therapyapp-backend

# Check secret access
gcloud secrets versions access latest --secret="gemini-api-key"
```

## Cost Optimization

1. **Cloud Run**: Use minimum instances = 0 for development
2. **Artifact Registry**: Clean up old images periodically
3. **Firestore**: Use appropriate read/write limits
4. **Gemini API**: Monitor usage and implement rate limiting

## Next Steps

1. Set up monitoring and alerting
2. Configure auto-scaling based on traffic
3. Implement comprehensive logging
4. Set up staging and production environments
5. Add integration tests to the CI/CD pipeline

---

For more information, refer to:
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Generative AI Documentation](https://ai.google.dev/docs)