import {Manipulator, Timestamp} from "./common"

export type AuthTableData = {
	credentialId: number
	userId: number
	authCode: string
	lastActivatedOn: string
	status: boolean
} & Manipulator &
	Timestamp

export type AuthShortDetails = {
	credentialId: number
	userId: number
	authCode: string
	status: boolean
}

export type RegisterAPIPayload = {
	roleId: number
	firstName?: string
	lastName?: string
	gender?: string
	email?: string
	mobile: string
	imageId?: number
	password: string
}

export type VerifyOtpPayload = {
	mobile: string
	otp: number
	sessionId: string
}

export type SendOtpPayload = {
	mobile: string
}
