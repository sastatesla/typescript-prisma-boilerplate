import httpStatus from "http-status"
import {Request, Response, NextFunction} from "express"
import pick from "../utils/pick"
import Joi from "joi"
import {ApiResponse} from "../utils/ApiResponse"

const validate = (schema: object) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const validSchema = pick(schema, ["params", "query", "body"])
		const obj = pick(req, Object.keys(validSchema))
		const {value, error} = Joi.compile(validSchema)
			.prefs({errors: {label: "key"}, abortEarly: false})
			.validate(obj)

		if (error) {
			const response = new ApiResponse(res)
			const errorMessage = error.details
				.map((details) => details.message)
				.join(", ")

			response.errorResponse({
				statusCode: httpStatus.BAD_REQUEST,
				message: errorMessage,
				errorCode: "validation_error"
			})

			return // important: stop here
		}

		Object.assign(req, value)
		next() // continue to next middleware
	}
}

export default validate
