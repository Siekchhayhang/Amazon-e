import { auth } from '@/auth'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { S3Client } from "@aws-sdk/client-s3";
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

// Cloudflare R2 Configuration
export const r2client = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'us-east-1',// Required by SDK, but R2 doesn't have regions in the same way
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,

  }
});


// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth()

      // If you throw, the user will not be able to upload
      if (!session) throw new UploadThingError('Unauthorized')

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session?.user?.id }
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
