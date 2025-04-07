import {
	S3Client,
	ListBucketsCommand,
	PutObjectCommand,
	CreateBucketCommand,
	DeleteBucketCommand,
	GetObjectCommand,
	HeadBucketCommand,
	ListObjectsV2Command,
	DeleteObjectCommand,
	ListObjectsV2CommandOutput
} from "@aws-sdk/client-s3"
import eventEmitter from "../libs/logging"

class S3Helper {
	private region: string
	private accessKeyId: string
	private secretAccessKey: string
	private s3Client: S3Client

	constructor(region?: string) {
		this.region = region || (process.env.DEFAULT_AWS_REGION as string)
		this.accessKeyId = process.env.AWS_ACCESS_KEY_ID as string
		this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string

		if (!this.accessKeyId || !this.secretAccessKey || !this.region) {
			throw new Error(
				"AWS credentials or region are not properly configured"
			)
		}

		this.s3Client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: this.accessKeyId,
				secretAccessKey: this.secretAccessKey
			}
		})
	}

	public async getBucketLists() {
		try {
			const command = new ListBucketsCommand({})
			const data = await this.s3Client.send(command)

			if (!data.Buckets?.length) {
				throw new Error("No buckets available in the account!")
			}

			return data.Buckets
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async getFirstBucket() {
		try {
			const command = new ListBucketsCommand({})
			const data = await this.s3Client.send(command)

			if (!data.Buckets?.length) {
				throw new Error("No buckets available in the account!")
			}

			return data.Buckets[0].Name
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async createBucket(bucketName: string) {
		try {
			const command = new CreateBucketCommand({Bucket: bucketName})
			await this.s3Client.send(command)
			return true
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async deleteBucket(bucketName: string) {
		try {
			const command = new DeleteBucketCommand({Bucket: bucketName})
			await this.s3Client.send(command)
			return true
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async downloadFile(bucketName: string, fileName: string) {
		try {
			const command = new GetObjectCommand({
				Bucket: bucketName,
				Key: fileName
			})

			const response = await this.s3Client.send(command)
			return response.Body
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async uploadFile(
		bucketName: string | undefined,
		fileName: string,
		dataBuffer: Buffer
	) {
		try {
			if (!bucketName) {
				bucketName = await this.getFirstBucket()
			}

			const fileKey: string = this.getFileKey(fileName)
			const command = new PutObjectCommand({
				Bucket: bucketName,
				Key: fileKey,
				Body: dataBuffer
				// ACL: "public-read"
			})

			await this.s3Client.send(command)

			const filePublicUrl: string = this.getFilePublicUrl(
				// @ts-ignore
				bucketName,
				fileKey
			)
			return filePublicUrl
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async checkBucketExists(bucketName: string) {
		try {
			const command = new HeadBucketCommand({Bucket: bucketName})
			await this.s3Client.send(command)
			return true
		} catch (error: any) {
			if (error.Code === "NotFound") {
				return false
			} else {
				throw error
			}
		}
	}

	public async listFilesInBucket(bucketName: string) {
		try {
			const files: any = []
			let continuationToken: string | undefined = undefined

			do {
				const command = new ListObjectsV2Command({
					Bucket: bucketName,
					ContinuationToken: continuationToken
				})

				const data = (await this.s3Client.send(
					command
				)) as ListObjectsV2CommandOutput
				if (data.Contents) {
					files.push(...data.Contents)
				}
				continuationToken = data.NextContinuationToken
			} while (continuationToken)

			return files
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async deleteFile(bucketName: string, fileName: string) {
		try {
			const command = new DeleteObjectCommand({
				Bucket: bucketName,
				Key: fileName
			})
			await this.s3Client.send(command)
			return true
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public async deleteFilesInBucket(bucketName: string) {
		try {
			const files = await this.listFilesInBucket(bucketName)
			const deletePromises = files.map((file) =>
				file.Key
					? this.deleteFile(bucketName, file.Key)
					: Promise.resolve()
			)
			await Promise.all(deletePromises)
			return true
		} catch (error) {
			eventEmitter.emit(
				"logging",
				`ERROR IN S3 HELPER - ${JSON.stringify(error)}`
			)
			throw error
		}
	}

	public getFileKey(fileName: string): string {
		return `uploads/${Date.now()}-${fileName}`
			.replace(/\s+/g, "-")
			.toLowerCase()
	}

	public getBucketUrl(bucketName: string): string {
		return `https://${bucketName}.s3.${this.region}.amazonaws.com`
	}

	public getFilePublicUrl(bucketName: string, fileKey: string): string {
		return `https://${bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`
	}
}

export default S3Helper
