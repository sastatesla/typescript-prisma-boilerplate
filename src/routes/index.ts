import express from "express"
import authRoute from "./auth.route"
import docsRoute from "./docs.route"
import config from "../../src/configs/config"

const router = express.Router()

// Define route configs
const defaultRoutes = [
	{
		name: "authRoute",
		path: "/auth",
		route: authRoute
	}
]

const devRoutes = [
	{
		name: "docsRoute",
		path: "/docs",
		route: docsRoute
	}
]

// Mount default routes with debug logs
defaultRoutes.forEach(({name, path, route}) => {
	try {
		console.log(`[Mounting default route] ${name} at path: ${path}`)
		router.use(path, route)
	} catch (err) {
		console.error(`❌ Failed to mount ${name} at path: ${path}`)
		console.error(err)
	}
})

// Mount development-only routes with debug logs
if (config.env === "development") {
	devRoutes.forEach(({name, path, route}) => {
		try {
			console.log(`[Mounting dev route] ${name} at path: ${path}`)
			router.use(path, route)
		} catch (err) {
			console.error(`❌ Failed to mount ${name} at path: ${path}`)
			console.error(err)
		}
	})
}

export default router
