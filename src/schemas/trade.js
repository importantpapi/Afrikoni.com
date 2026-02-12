import { z } from 'zod';

/**
 * TRADE SYSTEM SCHEMA (THE LAW)
 * Strict validation for all trade-related data before it hits the network.
 */

// 1. RFQ SCHEMA
// 1. RFQ SCHEMA
export const rfqSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100),
    description: z.string().min(20, "Please provide more details (min 20 chars)"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required (e.g. tons, kg)"),
    target_price: z.coerce.number().min(0, "Target price must be positive").optional(),
    delivery_location: z.string().min(2, "Delivery location is required"),
    target_country: z.string().min(2, "Target country is required").optional(),
    target_city: z.string().optional(),
    closing_date: z.string().optional().refine((date) => {
        if (!date) return true;
        return new Date(date) > new Date();
    }, "Closing date must be in the future")
});

// 2. COMPANY PROFILE SCHEMA
export const companyProfileSchema = z.object({
    company_name: z.string().min(2, "Company name is too short"),
    tax_id: z.string().min(5, "Tax ID/RC Number is required"),
    country: z.string().length(2, "Use 2-letter country code (e.g. NG, KE)"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address must be valid")
});

/**
 * Validator Helper
 * @param {z.Schema} schema 
 * @param {object} data 
 * @returns {object} { success: boolean, data?: object, error?: string }
 */
export const validate = (schema, data) => {
    try {
        const validData = schema.parse(data);
        return { success: true, data: validData };
    } catch (error) {
        console.error("[Validation Error]", error);
        // ZodError specifically uses .issues or .errors
        const issues = error.issues || error.errors || [];
        const formattedError = issues[0]?.message || error.message || "Validation failed";
        return { success: false, error: formattedError };
    }
};
