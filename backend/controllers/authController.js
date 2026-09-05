import User from "../models/User.js";
import Contact from "../models/Contact.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import emailValidator from "../middleware/emailValidator.js";

dotenv.config();

export async function register(req,res) {
    const {name, loginId, userType, contactRole, email, mobile, city, state, pincode, profile, password} = req.body;

    if(!name || !email || !mobile || !password || !userType || !userType || !city || !state || !pincode || !profile || !password){
        return res.status(400).json({
            message:"All fields are required"
        });
    }
    try{
        const contactExists = await Contact.findOne({loginId});

        if(contactExists){
            return res.status(409).json({
                message:"User already exists. Login"
            });
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);

        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );
        let contact;
        if(userType !== "ADMIN" && userType !== "ACCOUNTANT"){
            const contact_role = contactRole;
            if(!contactRole){
                return res.status(400).json({
                    message:"All fields are required"
                });
            }
            const role = "CONTACT";
            const user = await User.create({
                role,
                contact_role,
                isActive: true
            });
            contact = await Contact.create({
                name,
                loginId,
                userType,
                email,
                mobile,
                city,
                state,  
                pincode,
                profileImage:profile,
                password:hashedPassword,
                user:user._id
            });
            // const token = jwt.sign(
            //     {id:user._id},
            //     process.env.JWT_SECRET,
            //     {expiresIn:"7d"}
            // );
        }   
        else{
            contact = await Contact.create({
                name,
                loginId,
                userType,
                email,
                mobile,
                city,
                state,  
                pincode,
                profileImage:profile,
                password:hashedPassword,
            });
        }

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

        return res.status(201).json({
            message: "User and Contact created successfully",
            token,
            user: safeUser,
            contact: safeUser
        });

    }catch(err){
        return res.status(400).json({
            message:err.message
        });
    }
}


// export async function registerContact(req,res) {
//     const {name,email,mobile,password,contactType} = req.body;

//     if(!name || !email || !mobile || !password || !contactType){
//         return res.status(400).json({
//             message:"All fields are required"
//         });
//     }

//     try{
//         const contactExists = await Contact.findOne({email});

//         if(contactExists){
//             return res.status(409).json({
//                 message:"User already exists. Login"
//             });
//         }

//         const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);

//         const hashedPassword = await bcrypt.hash(
//             password,
//             saltRounds
//         );

//         const user = await User.create({
//             role:"CONTACT",
//             contact_id:contactType
//         });

//         const contact = await Contact.create({
//             name,
//             email,
//             mobile,
//             userType:contactType,
//             password:hashedPassword,
//             user:user._id
//         });

//         const token = jwt.sign(
//             {id:user._id},
//             process.env.JWT_SECRET,
//             {expiresIn:"7d"}
//         );

//         return res.status(201).json({
//             message:"Contact created successfully",
//             token,
//             user,
//             contact
//         });

//     }catch(err){
//         return res.status(400).json({
//             message:err.message
//         });
//     }
// }


export async function login(req,res) {
    const {loginId,password} = req.body;

    if(!loginId || !password){
        return res.status(400).json({
            message:"Email and password are required"
        });
    }

    try{
        const contact = await Contact.findOne({loginId})
            .select("+password")
            .populate("user");

        if(!contact){
            return res.status(404).json({
                message:"Invalid email or password"
            });
        }

        if(contact.isActive === false){
            return res.status(403).json({
                message:"Account has been deactivated"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            contact.password
        );

        if(!passwordMatches){
            return res.status(401).json({
                message:"Invalid email or password"
            });
        }

        const contactRole = contact.user?.contact_role || null;

        const token = jwt.sign(
            {
                id: contact._id,
                role: contact.userType,
                userType: contact.userType,
                contactRole: contactRole,
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
            contactRole: contactRole,
            profileImage: contact.profileImage,
            isActive: contact.isActive
        };

        return res.status(200).json({
            message: "Logged in successfully!",
            token,
            user: safeUser,
            contact: safeUser
        });

    }catch(err){
        return res.status(400).json({
            message:err.message
        });
    }
}


export async function logout(req,res) {
    return res.status(200).json({
        message:"Logged out successfully"
    });
}


export async function me(req,res) {
    const contactid = req.contactid;

    try{
        const contact = await Contact.findById(contactid);

        if(!contact){
            return res.status(404).json({message:"User not found"});
        }

        return res.status(200).json({contact});

    }catch(err){
        return res.status(400).json({
            message:err.message
        });
    }
}