import {PrismaClient} from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {RegisterAPIPayload} from "../types/auth.types"
import {Headers} from "../types/common"
import config from "../configs/config"
import {generateToken} from "../utils/jwt"

const prisma = new PrismaClient()

const authService = {
	async register(data: RegisterAPIPayload) {
		const hashedPassword = await bcrypt.hash(data.password, 10)
		const user = await prisma.user.create({
			data: {
				email: data.email!,
				password: hashedPassword
			}
		})
		const token = generateToken(user.id)
		return {user, token}
	},

	async login(email: string, password: string) {
		const user = await prisma.user.findUnique({
			where: {email}
		})

		if (!user) {
			throw new Error("User not found")
		}

		const isValid = await bcrypt.compare(password, user.password)
		if (!isValid) {
			throw new Error("Invalid password")
		}

		const token = jwt.sign({userId: user.id}, config.jwt.secret)
		return {user, token}
	},

	async refreshTokens(token: string) {
		try {
			const payload = jwt.verify(token, config.jwt.secret) as {
				userId: Headers
			}
			const user = await prisma.user.findUnique({
				where: {id: payload.userId}
			})
			if (!user) throw new Error("Invalid token")

			const newAccessToken = generateToken({userId: user.id})

			return {accessToken: newAccessToken}
		} catch (error) {
			throw new Error("Token expired or invalid")
		}
	}
}

export default authService
