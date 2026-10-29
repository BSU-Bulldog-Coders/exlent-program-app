import "server-only";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireEnv } from "@/lib/env";

export const S3_BUCKETS = { resources: "resources" } as const;
export const DIRECT_UPLOAD_LIMIT = 50 * 1024 * 1024;
export const MAX_RESOURCE_SIZE = 500 * 1024 * 1024;
export const MULTIPART_PART_SIZE = 10 * 1024 * 1024;

const s3 = new S3Client({
  endpoint: requireEnv("AWS_ENDPOINT_URL_S3"),
  region: requireEnv("AWS_REGION"),
  credentials: {
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: true,
});

export function resourceObjectKey(id: string, extension: string) {
  return `${id}.${extension.toLowerCase()}`;
}

export async function createUpload(key: string, contentType: string) {
  return s3.send(new CreateMultipartUploadCommand({ Bucket: S3_BUCKETS.resources, Key: key, ContentType: contentType }));
}

export function signedPut(key: string, contentType: string) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: S3_BUCKETS.resources, Key: key, ContentType: contentType }), { expiresIn: 900 });
}

export function signedPart(key: string, uploadId: string, partNumber: number) {
  return getSignedUrl(s3, new UploadPartCommand({ Bucket: S3_BUCKETS.resources, Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn: 900 });
}

export function completeUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
  return s3.send(new CompleteMultipartUploadCommand({ Bucket: S3_BUCKETS.resources, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }));
}

export function abortUpload(key: string, uploadId: string) {
  return s3.send(new AbortMultipartUploadCommand({ Bucket: S3_BUCKETS.resources, Key: key, UploadId: uploadId }));
}

export function headResource(key: string) {
  return s3.send(new HeadObjectCommand({ Bucket: S3_BUCKETS.resources, Key: key }));
}

export function deleteResourceObject(key: string) {
  return s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKETS.resources, Key: key }));
}

export function signedGet(key: string, filename: string, download: boolean) {
  const safeName = filename.replace(/[\\"\r\n]/g, "_");
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: S3_BUCKETS.resources,
    Key: key,
    ResponseContentDisposition: `${download ? "attachment" : "inline"}; filename="${safeName}"`,
  }), { expiresIn: 300 });
}
