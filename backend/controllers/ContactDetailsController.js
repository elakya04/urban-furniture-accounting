import Contact from "../models/Contact.js";


// GET /api/contacts/:loginId
export const getContactByLoginId = async (req, res) => {
  const contactId = req.contactid;

  console.log(JSON.stringify({
    level: "info",
    event: "contact_fetch_request",
    contactId,
    timestamp: new Date().toISOString()
  }));

  try {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      console.log(JSON.stringify({
        level: "warn",
        event: "contact_not_found",
        contactId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "contact_fetched",
      contactId: contact._id.toString(),
      loginId: contact.loginId,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      contact
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "contact_fetch_failed",
      contactId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET /api/contacts
export const getContacts = async (req, res) => {
  const { search, type, page = 1, limit = 10 } = req.query;

  console.log(JSON.stringify({
    level: "info",
    event: "contacts_fetch_request",
    search,
    type,
    page: Number(page),
    limit: Number(limit),
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { loginId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (type) {
      filter.userType = type.toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    console.log(JSON.stringify({
      level: "info",
      event: "contacts_query",
      search: search || null,
      type: type || null,
      page: Number(page),
      limit: Number(limit),
      skip,
      timestamp: new Date().toISOString()
    }));

    const contacts = await Contact.find(filter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit));

    const total = await Contact.countDocuments(filter);

    console.log(JSON.stringify({
      level: "info",
      event: "contacts_fetched",
      total,
      returnedCount: contacts.length,
      page: Number(page),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      contacts
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "contacts_fetch_failed",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// PATCH /api/contacts/:id
export const updateContact = async (req, res) => {
  const contactId = req.contactid;

  console.log(JSON.stringify({
    level: "info",
    event: "contact_update_request",
    contactId,
    updatedFields: Object.keys(req.body),
    timestamp: new Date().toISOString()
  }));

  try {
    const { email, mobile, city, state, pincode, profileImage } = req.body;

    const updateData = {};

    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;

    const contact = await Contact.findOneAndUpdate(
      { _id: contactId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!contact) {
      console.log(JSON.stringify({
        level: "warn",
        event: "contact_update_not_found",
        contactId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "contact_updated",
      contactId: contact._id.toString(),
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      contact
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "contact_update_failed",
      contactId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// POST /api/contacts/:id/archive
export const archiveContact = async (req, res) => {
  const contactId = req.contactid;

  console.log(JSON.stringify({
    level: "info",
    event: "contact_archive_request",
    contactId,
    timestamp: new Date().toISOString()
  }));

  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!contact) {
      console.log(JSON.stringify({
        level: "warn",
        event: "contact_archive_not_found",
        contactId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "contact_archived",
      contactId: contact._id.toString(),
      loginId: contact.loginId,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: "Contact archived successfully",
      contact
    });

  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "contact_archive_failed",
      contactId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};