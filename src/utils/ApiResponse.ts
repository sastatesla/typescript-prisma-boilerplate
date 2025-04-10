import {Response} from "express"
import {ProvidersFactory} from "../utils/ProvidersFactory"

type QueryFunction = (text: string, params?: any[]) => Promise<any>

export class ApiResponse {
	private res
	constructor(response: Response) {
		this.res = response
	}

	public async APITransactionBegin(slug?: string) {
		slug = process.env.DB_NAME as string
		const providersFactory = new ProvidersFactory()
		const {query} = await providersFactory.transaction(slug)

		await query("BEGIN")
		return {query}
	}

	public async APITransactionSucceed(query: QueryFunction) {
		await query("COMMIT")
	}

	public async APITransactionFailed(query: QueryFunction) {
		await query("ROLLBACK")
	}

	public async successResponse(data: any) {
		const statusCode: number = data.statusCode ?? 200

		return this.res.status(statusCode).json({
			success: true,
			status: statusCode,
			...data
		})
	}

	public async errorResponse(data: any) {
		const statusCode: number = data.statusCode ?? 422

		if (!data.errorCode) {
			switch (statusCode) {
				case 400:
					data.errorCode = "unexpected_error"
					break
				case 401:
					data.errorCode = "unauthorized"
					break
				case 403:
					data.errorCode = "not_enough_permissions"
					break
				case 404:
					data.errorCode = "not_found"
					break
				default:
					data.errorCode = "internal_server_error"
					break
			}
		}

		return this.res.status(statusCode).json({
			success: false,
			status: statusCode,
			message: data?.message,
			code: data.errorCode
		})
	}
}
