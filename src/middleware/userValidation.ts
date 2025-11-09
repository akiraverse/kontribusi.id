import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const addDataSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(4).alphanum().required(),
	role: Joi.string().valid('society', 'company').required(),
	user: Joi.optional(),
	society: Joi.when('role', {
		is: 'society',
		then: Joi.object({
			name: Joi.string().trim().required(),
			address: Joi.string().trim().required(),
			phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
			file: Joi.string().optional(),
			date_of_birth: Joi.date().iso().max('now').required(),
			gender: Joi.string().valid('male', 'female').required()
		}).required(),
		otherwise: Joi.forbidden()
	}),
	company: Joi.when('role', {
		is: 'company',
		then: Joi.object({
			name: Joi.string().trim().required(),
			address: Joi.string().trim().required(),
			phone: Joi.string().trim().required(),
			file: Joi.string().required(),
			description: Joi.string().trim().required(),
			user_id: Joi.number().required()
		}).required(),
		otherwise: Joi.forbidden()
	})
	
})

const editDataSchema = Joi.object({
	name: Joi.string().optional(),
	email: Joi.string().email().optional(),
	password: Joi.string().min(4).alphanum().optional(),
	role: Joi.string().valid('society', 'company').optional(),
	user: Joi.optional(),
	society: Joi.when('role', {
		is: 'society',
		then: Joi.object({
			name: Joi.string().trim().optional(),
			address: Joi.string().trim().optional(),
			phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
			file: Joi.string().optional(),
			date_of_birth: Joi.date().iso().max('now').optional(),
			gender: Joi.string().valid('male', 'female').optional()
		}).optional(),
		otherwise: Joi.forbidden()
	}),
	company: Joi.when('role', {
		is: 'company',
		then: Joi.object({
			name: Joi.string().trim().optional(),
			address: Joi.string().trim().optional(),
			phone: Joi.string().trim().optional(),
			file: Joi.string().optional(),
			description: Joi.string().trim().optional(),
			user_id: Joi.number().optional()
		}).optional(),
		otherwise: Joi.forbidden()
	})
})

const authSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(4).alphanum().required()
})

export const verifyAddUser = (req: Request, res: Response, next: NextFunction) => {
	const { error } = addDataSchema.validate(req.body, {
		abortEarly: false
	})

	if (error) {
		return res.status(500).json({
			status: false, 
			message: error.details.map(it => it.message).join()
		})
	}

	return next()
}

export const verifyEditUser = (req: Request, res: Response, next: NextFunction) => {
	const { error } = editDataSchema.validate(req.body, {
		abortEarly: false
	})

	if (error) {
		return res.status(500).json({
			status: false, 
			message: error.details.map(it => it.message).join()
		})
	}

	return next()
}

export const verifyAuthentication = (req: Request, res: Response, next: NextFunction) => {
	const { error } = authSchema.validate(req.body, {
		abortEarly: false
	})

	if (error) {
		return res.status(500).json({
			status: false, 
			message: error.details.map(it => it.message).join()
		})
	}

	return next()
}


