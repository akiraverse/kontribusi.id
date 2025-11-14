import { NextFunction, Request, Response } from "express";
import Joi from "joi";

// --- CREATE USER SCHEMA ---
const addUserSchema = Joi.object({
	name: Joi.string().trim().required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid('volunteer', 'organization').required(),
	file: Joi.string().optional(),

	// Fields for volunteer (volunteer)
	location: Joi.when('role', {
		is: 'volunteer',
		then: Joi.string().trim().optional(),
		otherwise: Joi.forbidden()
	}),
	date_of_birth: Joi.when('role', {
		is: 'volunteer',
		then: Joi.date().iso().max('now').optional(),
		otherwise: Joi.forbidden()
	}),
	gender: Joi.when('role', {
		is: 'volunteer',
		then: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
		otherwise: Joi.forbidden()
	}),
	available_day: Joi.when('role', {
		is: 'volunteer',
		then: Joi.array().items(Joi.string()).optional(),
		otherwise: Joi.forbidden()
	}),
	interests: Joi.when('role', {
		is: 'volunteer',
		then: Joi.array().items(Joi.string()).optional(),
		otherwise: Joi.forbidden()
	}),
	skills: Joi.when('role', {
		is: 'volunteer',
		then: Joi.array().items(Joi.string()).optional(),
		otherwise: Joi.forbidden()
	}),
	availableTimeIds: Joi.when('role', {
		is: 'volunteer',
		then: Joi.array().items(Joi.string()).optional(),
		otherwise: Joi.forbidden()
	}),

	// Fields for organization
	org_name: Joi.when('role', {
		is: 'organization',
		then: Joi.string().trim().required(),
		otherwise: Joi.forbidden()
	}),
	address: Joi.when('role', {
		is: 'organization',
		then: Joi.string().trim().optional(),
		otherwise: Joi.forbidden()
	}),
	phone: Joi.when('role', {
		is: 'organization',
		then: Joi.string().pattern(/^[0-9+\-\s]{6,20}$/).optional(),
		otherwise: Joi.forbidden()
	}),
	description: Joi.when('role', {
		is: 'organization',
		then: Joi.string().trim().optional(),
		otherwise: Joi.forbidden()
	})
});

// --- EDIT USER SCHEMA ---
const editUserSchema = Joi.object({
	name: Joi.string().trim().optional(),
	email: Joi.string().email().optional(),
	password: Joi.string().min(6).optional(),
	role: Joi.string().valid('volunteer', 'organization').optional(),
	file: Joi.string().optional(),

	location: Joi.string().optional(),
	date_of_birth: Joi.date().iso().max('now').optional(),
	gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
	available_day: Joi.array().items(Joi.string()).optional(),
	interests: Joi.array().items(Joi.string()).optional(),
	skills: Joi.array().items(Joi.string()).optional(),
	availableTimeIds: Joi.array().items(Joi.string()).optional(),

	org_name: Joi.string().trim().optional(),
	address: Joi.string().trim().optional(),
	phone: Joi.string().pattern(/^[0-9+\-\s]{6,20}$/).optional(),
	description: Joi.string().trim().optional()
});

// --- LOGIN SCHEMA ---
const authSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required()
});

// --- MIDDLEWARES ---
export const verifyAddUser = (req: Request, res: Response, next: NextFunction) => {
	const { error } = addUserSchema.validate(req.body, { abortEarly: false });
	if (error) {
		return res.status(400).json({
			status: false,
			message: error.details.map(it => it.message).join(", ")
		});
	}
	return next();
};

export const verifyEditUser = (req: Request, res: Response, next: NextFunction) => {
	const { error } = editUserSchema.validate(req.body, { abortEarly: false });
	if (error) {
		return res.status(400).json({
			status: false,
			message: error.details.map(it => it.message).join(", ")
		});
	}
	return next();
};

export const verifyAuthentication = (req: Request, res: Response, next: NextFunction) => {
	const { error } = authSchema.validate(req.body, { abortEarly: false });
	if (error) {
		return res.status(400).json({
			status: false,
			message: error.details.map(it => it.message).join(", ")
		});
	}
	return next();
};
