import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Contact from "../models/Contact.js";

dotenv.config();

export async function protect(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized: Missing or malformed token"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Fast path: Token carries verified role & user info (ZERO DB queries needed)
        if (decoded.role || decoded.userType) {
            req.contactid = decoded.id;
            req.role = decoded.role || decoded.userType;
            req.userType = decoded.userType || decoded.role;
            req.contactRole = decoded.contactRole || null;
            req.user = {
                _id: decoded.id,
                contact_id: decoded.id,
                role: req.role,
                userType: req.userType,
                contact_role: req.contactRole,
                name: decoded.name,
                email: decoded.email,
                loginId: decoded.loginId
            };
            return next();
        }

        // Fallback for legacy tokens without embedded role: single DB lookup
        const contact = await Contact.findById(decoded.id).populate("user");

        if (!contact) {
            return res.status(401).json({
                message: "User not found or invalid token"
            });
        }

        if (contact.isActive === false) {
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
            userType: contact.userType,
            contact_role: contact.user?.contact_role,
            name: contact.name,
            email: contact.email,
            loginId: contact.loginId
        };

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}