import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (file: Buffer, fileName: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `villa-photos/${fileName}`,
    Body: file,
    ContentType: 'image/jpeg',
  });

  await s3Client.send(command);
  return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/villa-photos/${fileName}`;
};

export const deleteFromS3 = async (fileUrl: string) => {
  const key = fileUrl.split('.amazonaws.com/')[1];
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  await s3Client.send(command);
}; 