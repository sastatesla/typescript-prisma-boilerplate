import {Request, Response, NextFunction} from "express"
import {PrismaClient} from "@prisma/client"
import {Headers, Error} from "../types/common"
import jwt from "jsonwebtoken"
import config from "../configs/config"

const prisma = new PrismaClient()

const auth = () => async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		const error: Error = {message: "Unauthorized", status: 401}
		return res.status(401).json(error)
	}

	const token = authHeader.split(" ")[1]

	try {
		const decoded = verifyToken(token) as Headers
		const user = await prisma.user.findUnique({
			where: {id: decoded.userId}
		})

		if (!user) {
			const error: Error = {message: "Unauthorized", status: 401}
			return res.status(401).json(error)
		}

		req.user = user
		next()
	} catch (error) {
		const err: Error = {message: "Unauthorized", status: 401}
		return res.status(401).json(err)
	}
}

function verifyToken(token: string): any {
	try {
		return jwt.verify(token, config.jwt.secret)
	} catch (error) {
		throw new Error("Invalid token")
	}
}

export default auth
