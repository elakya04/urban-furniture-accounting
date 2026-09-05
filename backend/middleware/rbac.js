/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * System Roles:
 * - ADMIN: Complete system administration, contact/user management
 * - ACCOUNTANT: Financial and accounting operations (COA, Journals, Ledger, Orders, Bills, Payments)
 * - CONTACT: External portal user (Vendor, Customer, or Both)
 *
 * Contact Roles (when userType is CONTACT):
 * - VENDOR: Supply chain & vendor bill self-service
 * - CUSTOMER: Customer orders & invoice payments
 * - BOTH: Both customer and vendor operations
 */

/**
 * Restrict endpoint access to specific userType roles.
 * Example: router.get("/journals", protect, authorize("ADMIN", "ACCOUNTANT"), getJournals);
 *
 * @param {...string} allowedRoles - Allowed roles: "ADMIN", "ACCOUNTANT", "CONTACT"
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const currentRole = req.role || req.userType || req.user?.role;

    if (!currentRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User role not determined"
      });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role: [${allowedRoles.join(", ")}]. Current role: [${currentRole}]`
      });
    }

    next();
  };
}

/**
 * Restrict endpoint access to specific contact sub-roles (for CONTACT users).
 * ADMIN and ACCOUNTANT bypass this check by default.
 * Example: router.get("/me/vendor-bills", protect, authorizeContactRole("VENDOR", "BOTH"), getMyBills);
 *
 * @param {...string} allowedContactRoles - "VENDOR", "CUSTOMER", "BOTH"
 */
export function authorizeContactRole(...allowedContactRoles) {
  return (req, res, next) => {
    const currentRole = req.role || req.userType || req.user?.role;

    // Admins and Accountants have super-access to manage business records
    if (currentRole === "ADMIN" || currentRole === "ACCOUNTANT") {
      return next();
    }

    const currentContactRole = req.contactRole || req.user?.contact_role;

    if (!currentContactRole || !allowedContactRoles.includes(currentContactRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required contact role: [${allowedContactRoles.join(", ")}]. Current contact role: [${currentContactRole || "NONE"}]`
      });
    }

    next();
  };
}

/**
 * Check if the user is an ADMIN/ACCOUNTANT or owns the resource (based on ID matching).
 * Example: router.get("/contacts/:id", protect, authorizeOwnerOrAdmin("id"), getContactById);
 *
 * @param {string} idField - Parameter name representing the resource owner ID (default "id")
 */
export function authorizeOwnerOrAdmin(idField = "id") {
  return (req, res, next) => {
    const currentRole = req.role || req.userType || req.user?.role;

    if (currentRole === "ADMIN" || currentRole === "ACCOUNTANT") {
      return next();
    }

    const targetId = req.params[idField] || req.query[idField] || req.body[idField];
    const currentId = (req.contactid || req.user?._id)?.toString();

    if (targetId && targetId.toString() !== currentId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access this user's resource"
      });
    }

    next();
  };
}

// ── Convenient Predefined Middlewares ─────────────────────────────────
export const isAdmin = authorize("ADMIN");
export const isAccountant = authorize("ADMIN", "ACCOUNTANT");
export const isContact = authorize("CONTACT");
export const isVendor = authorizeContactRole("VENDOR", "BOTH");
export const isCustomer = authorizeContactRole("CUSTOMER", "BOTH");

export default {
  authorize,
  authorizeContactRole,
  authorizeOwnerOrAdmin,
  isAdmin,
  isAccountant,
  isContact,
  isVendor,
  isCustomer
};
