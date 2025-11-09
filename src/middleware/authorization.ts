import { NextFunction, Request, Response  } from "express";
import { SECRET } from "../global";
import { verify } from "jsonwebtoken";

interface JwtPayload {
	id: string, 
	name: string,
	email: string, 
	role: string
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.split(" ")[1]

	if (!token) {
		return res.status(403).json({ 
			status: false,
			message: `Access denied. No token provided`
		})
	}

	try {
		const secretKey = SECRET || ""
		const decode = verify(token, secretKey);
		(req as any).user = decode as JwtPayload;
		next()
	} catch (error) {
		return res.status(401).json({
			status: false,
			message: `invalid token`
		})
	}
}

export const verifyRole = (allowedRoles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;

		if (!user) {
			return res.status(403).json({
				status: false,
				message: `no user information available`
			})
		}

		if (!allowedRoles.includes(user.role)) {
			return res.status(403).json({
				status: false,
				message: `access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`
			})
		}

		next();
	}
}



