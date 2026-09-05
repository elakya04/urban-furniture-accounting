import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Contact from "../models/Contact.js";

dotenv.config();

export async function protect(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const contact = await Contact.findById(decoded.id).populate("user");

        if (!contact) {
            return res.status(401).json({
                message: "User not found or invalid token"
            });
        }

        if (!contact.isActive) {
            return res.status(403).json({
                message: "Account has been deactivated"
            });
        }

        req.contactid = contact._id;
        req.contact = contact;
        req.role = contact.userType;
        req.userType = contact.userType;
        req.contactRole = contact.user?.contact_role || null;
        req.user = {
            _id: contact._id,
            contact_id: contact._id,
            role: contact.userType,
            contact_role: contact.user?.contact_role
        };

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}