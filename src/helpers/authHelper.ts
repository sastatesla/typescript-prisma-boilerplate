import isJSON from "is-json"
import Crypto from "crypto"
import _ from "lodash"
import {
	DEFAULT_OTP,
	DEFAULT_OTP_LENGTH,
	DEFAULT_OTP_TEMPLATE_ID,
	DEFAULT_PHONE_NUMBERS,
	MESSAGE_TEMPLATE,
	OTP_RESPONSE_SLUGS
} from "./constants"
import AxiosHelper from "./axiosHelper"
import eventEmitter from "../libs/logging"
import {ProvidersFactory} from "../libs/ProvidersFactory"
import {Roles} from "../types/common"

/* load models */
export default {
	generateOtp,
	regexEmail,
	regexDob,
	regexMobile,
	regexPassword,
	listFunction,
	encryptionByCrypto,
	decryptBycrypto,
	stringCaseSkipping,
	createSlug,
	referralCodeGenerator,
	formatBookingId,
	sendOtp,
	verifyOtp,
	getAdminSlug
}

export async function generateOtp() {
	// return Math.floor(1000 + Math.random() * 9000)
	return await _.random(1000, 9999)
}

export async function regexEmail(email: string) {
	return await regexValidation(
		"^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$",
		email
	)
}

export async function regexMobile(mobile: string) {
	return await regexValidation("^[6789]\\d{9}$", mobile)
}

export async function regexDob(dob: string) {
	return await regexValidation("^([0-9]{4})-([0-9]{2})-([0-9]{2})$", dob)
}

export async function regexPassword(password: string) {
	return await regexValidation(
		"^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$",
		password
	)
}

export async function regexValidation(regex: string, value: string) {
	const newRegex = new RegExp(regex)
	const isValid: boolean = newRegex.test(value)
	return isValid
}

export async function listFunction(inputData: any) {
	inputData.filter =
		[undefined, null].indexOf(inputData.filter) < 0
			? typeof inputData.filter === "string"
				? JSON.parse(inputData.filter)
				: inputData.filter
			: null
	inputData.range =
		[undefined, null].indexOf(inputData.range) < 0
			? typeof inputData.range === "string"
				? JSON.parse(inputData.range)
				: inputData.range
			: null
	inputData.sort =
		[undefined, null].indexOf(inputData.sort) < 0
			? typeof inputData.sort === "string"
				? JSON.parse(inputData.sort)
				: inputData.sort
			: null

	return {
		filter: inputData.filter ?? null,
		range: inputData.range ?? null,
		sort: inputData.sort ?? null
	}
}

// get data from configuration
const encryptCred: {
	secret_key: string
	secret_iv: string
	encryption_method: string
} = {
	secret_key: process.env.CRYPTO_SECRET_KEY as string,
	secret_iv: process.env.CRYPTO_SECRET_IV as string,
	encryption_method: process.env.CRYPTO_ENCRYPTION_METHOD as string
}

// Generate secret hash with crypto to use for encryption
const key = Crypto.createHash("sha256")
	.update(encryptCred.secret_key)
	.digest("hex")
	.substring(0, 32)
const encryptionIV = Crypto.createHash("sha256")
	.update(encryptCred.secret_iv)
	.digest("hex")
	.substring(0, 16)

// encrypt by crypto aes 256
export async function encryptionByCrypto(data: any) {
	data = typeof data === "object" ? JSON.stringify(data) : data
	if (
		!encryptCred.secret_key ||
		!encryptCred.secret_iv ||
		!encryptCred.encryption_method
	) {
		throw new Error(
			"secretKey, secretIV, and ecnryption Method are required"
		)
	}

	// 	// Encrypt data
	const cipher = Crypto.createCipheriv(
		encryptCred.encryption_method,
		key,
		encryptionIV
	)
	return Buffer.from(
		cipher.update(data, "utf8", "hex") + cipher.final("hex")
	).toString("base64")
}

// decrypt by crypto aes 256
export async function decryptBycrypto(encryptedData: string) {
	const buff = Buffer.from(encryptedData, "base64")
	const decipher = Crypto.createDecipheriv(
		encryptCred.encryption_method,
		key,
		encryptionIV
	)
	return JSON.parse(
		decipher.update(buff.toString("utf8"), "hex", "utf8") +
			decipher.final("utf8")
	)
}

export function createSlug(datas: any[], fieldName: string, name: string) {
	let slug: string = name
		.trim()
		.replace(/\s\s+/g, " ")
		.replace(/[^a-zA-Z0-9_ ]/g, "")
		.replace(/\s/g, "-")
		.replace(/_/g, "-")
		.toLowerCase()
	let functionCalled: number = 0
	let duplicateSlug: boolean = false

	do {
		duplicateSlug = false

		if (functionCalled !== 0 && functionCalled === 1) {
			slug = `${slug}-${functionCalled}`
		} else if (functionCalled > 1) {
			slug = slug.replace(/\d+$/, `${functionCalled}`)
		}

		const duplicateSlugValue =
			datas.find(
				(el) =>
					el[fieldName].toString().trim() === slug.toString().trim()
			) ?? null

		if (duplicateSlugValue) {
			duplicateSlug = true
		}

		functionCalled += 1
	} while (duplicateSlug)
	return slug
}

// single quote double qoute case
export async function stringCaseSkipping(dataString: string) {
	//  return dataString
	if (dataString.includes("'")) {
		const stringArr = dataString.split("'")
		const stringFormat = stringArr.map((el) =>
			el.indexOf("'") ? el.replace(/'/g, "''") : el
		)
		return stringFormat.join("''")
	} else if (dataString.includes('"')) {
		const stringArr = dataString.split('"')
		const stringFormat = stringArr.map((el) =>
			el.indexOf('"') ? el.replace(/"/g, '"') : el
		)
		return stringFormat.join('"')
	}
	return dataString
}

export async function escapeJSONString(inputData: any) {
	// inputData = JSON.parse(inputData)

	// start treating json
	if (inputData) {
		if (typeof inputData === "object" && Array.isArray(inputData)) {
			const newData: any[] = []

			for (const el of inputData) {
				newData.push(await escapeJSONString(el))
			}

			inputData = newData
		} else if (typeof inputData === "object" && !Array.isArray(inputData)) {
			const objectKeys = Object.keys(inputData)

			for (const objectKey of objectKeys) {
				inputData[objectKey] = await escapeJSONString(
					inputData[objectKey]
				)
			}
		} else if (typeof inputData === "string" && isJSON(inputData)) {
			const newObject = JSON.parse(inputData)

			const objectKeys = Object.keys(newObject)

			for (const objectKey of objectKeys) {
				newObject[objectKey] = await escapeJSONString(
					newObject[objectKey]
				)
			}

			inputData = JSON.stringify(newObject)
		} else if (typeof inputData === "string" && !isJSON(inputData)) {
			inputData = await stringCaseSkipping(inputData)
		} else {
			return inputData
		}
	}

	// end treating json

	// return JSON.stringify(inputData)
	return inputData
}

export async function generateRandomString(digit: number): Promise<string> {
	return Math.random()
		.toString(36)
		.substring(2, Number(digit) + 2)
		.toUpperCase()
}

export async function referralCodeGenerator(
	userId: number,
	roleSlug: number
): Promise<string> {
	const uniqueStr: string = await generateRandomString(5)
	const padded = userId.toString().padStart(4, "0")
	return `BK${roleSlug.toString().slice(0, 2)}${uniqueStr}${padded}`
}

export async function formatBookingId(bookingId: number): Promise<string> {
	const padded = bookingId.toString().padStart(9, "0")
	return `#BK-${padded}`
}

export async function sendOtp(phoneNumber: string): Promise<string> {
	if (DEFAULT_PHONE_NUMBERS.indexOf(phoneNumber) >= 0) {
		return DEFAULT_OTP.toString()
	}

	if (
		(process.env.MTALKZ_API_KEY || "").toString().trim() === "" ||
		(process.env.SENDER_ID || "").toString().trim() === "" ||
		(process.env.OTP_API_BASE_URL || "").toString().trim() === ""
	) {
		throw new Error("OTP Service temporarily unavailable")
	}

	const data = {
		apikey: process.env.MTALKZ_API_KEY as string,
		senderid: process.env.SENDER_ID as string,
		number: phoneNumber,
		message: MESSAGE_TEMPLATE.OTP,
		format: "json",
		template_id: DEFAULT_OTP_TEMPLATE_ID,
		digit: DEFAULT_OTP_LENGTH
	}

	try {
		const axiosHelper = new AxiosHelper(
			process.env.OTP_API_BASE_URL as string
		)
		const response = await axiosHelper.request(
			process.env.SENT_OTP_END_POINT as string,
			undefined,
			"POST",
			data
		)

		return JSON.stringify(response?.data || response)
	} catch (error: any) {
		throw new Error(`Error sending OTP - ${error?.message ?? error}`)
	}
}

export async function verifyOtp(
	phoneNumber: string,
	otp: string,
	sessionId: string
): Promise<boolean> {
	if (
		DEFAULT_PHONE_NUMBERS.indexOf(phoneNumber) >= 0 &&
		otp.toString().trim() === DEFAULT_OTP.toString()
	) {
		return true
	}

	if (
		(process.env.MTALKZ_API_KEY || "").toString().trim() === "" ||
		(process.env.SENDER_ID || "").toString().trim() === "" ||
		(process.env.OTP_API_BASE_URL || "").toString().trim() === ""
	) {
		throw new Error("OTP Service temporarily unavailable")
	}

	const data = {
		apikey: process.env.MTALKZ_API_KEY,
		senderid: process.env.SENDER_ID,
		to: phoneNumber,
		otp,
		sessionid: sessionId,
		format: "json"
	}

	try {
		const axiosHelper = new AxiosHelper(
			process.env.OTP_API_BASE_URL as string
		)
		const response = await axiosHelper.request(
			process.env.VERIFY_OTP_END_POINT as string,
			undefined,
			"POST",
			data
		)

		eventEmitter.emit("logging", `Verify OTP - ${JSON.stringify(response)}`)

		const responseDetails = response.Details ?? response.data?.Details
		if (!responseDetails) {
			throw "Error occurred at OTP server"
		}

		switch (responseDetails) {
			case OTP_RESPONSE_SLUGS.VERIFIED:
				return true
			case OTP_RESPONSE_SLUGS.INVALID:
				throw "Invalid OTP"
			case OTP_RESPONSE_SLUGS.EXPIRED:
				throw "OTP expired"
			default:
				throw "Invalid OTP"
		}
	} catch (error: any) {
		throw new Error("Error verifying OTP: " + (error?.message ?? error))
	}
}

export async function getAdminSlug(slug?: string): Promise<number[]> {
	slug = process.env.DB_NAME as string
	const client = global.universalRedisClient

	const slugName: string = `super-admin-and-admin-slug`
	let roleDetails = await client.get(slugName)

	if (!roleDetails) {
		const providersFactory = new ProvidersFactory()
		const {query, release} = await providersFactory.transaction(slug)

		let {rows} = await query(`
			SELECT "roleId"
			FROM "roles" AS rlo
			WHERE "deletedAt" IS NULL
			AND status IS TRUE
			AND slug IN ('${Roles.SUPER_ADMIN}', '${Roles.ADMIN}')
		`)
		if (!rows?.length) {
			return []
		}

		rows = rows.map((el) => Number(el.roleId))

		await client.set(
			slugName,
			typeof rows !== "string" ? JSON.stringify(rows) : rows
		)

		roleDetails = await client.get(slugName)

		release()
	}

	roleDetails =
		typeof roleDetails === "string" ? JSON.parse(roleDetails) : roleDetails

	return roleDetails
}
