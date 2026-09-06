import User from "../models/User.js";
import Contact from "../models/Contact.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import emailValidator from "../middleware/emailValidator.js";

dotenv.config();

export async function register(req, res) {
    const {
        name,
        loginId,
        userType,
        contactRole,
        email,
        mobile,
        city,
        state,
        pincode,
        profile,
        password
    } = req.body;

    console.log(JSON.stringify({
        level: "info",
        event: "register_request",
        loginId,
        userType,
        contactRole,
        timestamp: new Date().toISOString()
    }));

    const profileImageToUse = profile && typeof profile === 'string' && profile.trim().length > 0 
        ? profile 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    if (!name || !email || !mobile || !password || !userType ||
        !city || !state || !pincode || !loginId) {

        console.log(JSON.stringify({
            level: "warn",
            event: "register_validation_failed",
            loginId,
            timestamp: new Date().toISOString()
        }));

        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {
        const contactExists = await Contact.findOne({ loginId });

        if (contactExists) {
            console.log(JSON.stringify({
                level: "warn",
                event: "register_duplicate_loginid",
                loginId,
                timestamp: new Date().toISOString()
            }));

            return res.status(409).json({
                message: "User already exists. Login"
            });
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);

        console.log(JSON.stringify({
            level: "info",
            event: "password_hashing_started",
            loginId,
            timestamp: new Date().toISOString()
        }));

        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );

        let contact;

        if (userType !== "ADMIN" && userType !== "ACCOUNTANT") {

            const contact_role = contactRole;

            if (!contactRole) {
                console.log(JSON.stringify({
                    level: "warn",
                    event: "contact_role_missing",
                    loginId,
                    timestamp: new Date().toISOString()
                }));

                return res.status(400).json({
                    message: "All fields are required"
                });
            }

            const role = "CONTACT";

            const user = await User.create({
                role,
                contact_role,
                isActive: true
            });

            console.log(JSON.stringify({
                level: "info",
                event: "contact_user_created",
                loginId,
                userId: user._id.toString(),
                role,
                contactRole: contact_role,
                timestamp: new Date().toISOString()
            }));

            contact = await Contact.create({
                name,
                loginId,
                userType,
                email,
                mobile,
                city,
                state,
                pincode,
                profileImage: profileImageToUse,
                password: hashedPassword,
                user: user._id
            });

        } else {

            contact = await Contact.create({
                name,
                loginId,
                userType,
                email,
                mobile,
                city,
                state,
                pincode,
                profileImage: profileImageToUse,
                password: hashedPassword
            });
        }

        console.log(JSON.stringify({
            level: "info",
            event: "contact_created",
            contactId: contact._id.toString(),
            loginId: contact.loginId,
            userType: contact.userType,
            timestamp: new Date().toISOString()
        }));

        const token = jwt.sign(
            {
                id: contact._id,
                role: contact.userType,
                userType: contact.userType,
                contactRole: contactRole || null,
                name: contact.name,
                email: contact.email,
                loginId: contact.loginId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const safeUser = {
            _id: contact._id,
            name: contact.name,
            loginId: contact.loginId,
            email: contact.email,
            mobile: contact.mobile,
            userType: contact.userType,
            role: contact.userType,
            contactRole: contactRole || null,
            profileImage: contact.profileImage,
            isActive: contact.isActive
        };

        console.log(JSON.stringify({
            level: "info",
            event: "register_success",
            contactId: contact._id.toString(),
            loginId: contact.loginId,
            userType: contact.userType,
            timestamp: new Date().toISOString()
        }));

        return res.status(201).json({
            message: "User and Contact created successfully",
            token,
            user: safeUser,
            contact: safeUser
        });

    } catch (err) {

        console.error(JSON.stringify({
            level: "error",
            event: "register_failed",
            loginId,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }));

        return res.status(400).json({
            message: err.message
        });
    }
}


export async function login(req, res) {
    const { loginId, password } = req.body;

    console.log(JSON.stringify({
        level: "info",
        event: "login_request",
        loginId,
        timestamp: new Date().toISOString()
    }));

    if (!loginId || !password) {

        console.log(JSON.stringify({
            level: "warn",
            event: "login_validation_failed",
            loginId,
            timestamp: new Date().toISOString()
        }));

        return res.status(400).json({
            message: "LoginId and password are required"
        });
    }

    try {
        const contact = await Contact.findOne({ loginId })
            .select("+password")
            .populate("user");

        if (!contact) {

            console.log(JSON.stringify({
                level: "warn",
                event: "login_user_not_found",
                loginId,
                timestamp: new Date().toISOString()
            }));

            return res.status(404).json({
                message: "Invalid loginId or password"
            });
        }

        if (contact.isActive === false) {

            console.log(JSON.stringify({
                level: "warn",
                event: "login_account_deactivated",
                loginId,
                contactId: contact._id.toString(),
                timestamp: new Date().toISOString()
            }));

            return res.status(403).json({
                message: "Account has been deactivated"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            contact.password
        );

        if (!passwordMatches) {

            console.log(JSON.stringify({
                level: "warn",
                event: "login_invalid_password",
                loginId,
                contactId: contact._id.toString(),
                timestamp: new Date().toISOString()
            }));

            return res.status(401).json({
                message: "Invalid loginId or password"
            });
        }

        const contactRole = contact.user?.contact_role || null;

        const token = jwt.sign(
            {
                id: contact._id,
                role: contact.userType,
                userType: contact.userType,
                contactRole,
                name: contact.name,
                email: contact.email,
                loginId: contact.loginId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const safeUser = {
            _id: contact._id,
            name: contact.name,
            loginId: contact.loginId,
            email: contact.email,
            mobile: contact.mobile,
            userType: contact.userType,
            role: contact.userType,
            contactRole,
            profileImage: contact.profileImage,
            isActive: contact.isActive
        };

        console.log(JSON.stringify({
            level: "info",
            event: "login_success",
            contactId: contact._id.toString(),
            loginId,
            userType: contact.userType,
            contactRole,
            timestamp: new Date().toISOString()
        }));

        return res.status(200).json({
            message: "Logged in successfully!",
            token,
            user: safeUser,
            contact: safeUser
        });

    } catch (err) {

        console.error(JSON.stringify({
            level: "error",
            event: "login_failed",
            loginId,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }));

        return res.status(400).json({
            message: err.message
        });
    }
}


export async function logout(req, res) {

    console.log(JSON.stringify({
        level: "info",
        event: "logout_success",
        contactId: req.contactid || null,
        timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
        message: "Logged out successfully"
    });
}


export async function me(req, res) {
    const contactid = req.contactid;

    console.log(JSON.stringify({
        level: "info",
        event: "current_user_request",
        contactId: contactid,
        timestamp: new Date().toISOString()
    }));

    try {
        const contact = await Contact.findById(contactid);

        if (!contact) {

            console.log(JSON.stringify({
                level: "warn",
                event: "current_user_not_found",
                contactId: contactid,
                timestamp: new Date().toISOString()
            }));

            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log(JSON.stringify({
            level: "info",
            event: "current_user_fetched",
            contactId: contact._id.toString(),
            loginId: contact.loginId,
            timestamp: new Date().toISOString()
        }));

        return res.status(200).json({
            contact
        });

    } catch (err) {

        console.error(JSON.stringify({
            level: "error",
            event: "current_user_fetch_failed",
            contactId: contactid,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }));

        return res.status(400).json({
            message: err.message
        });
    }
}