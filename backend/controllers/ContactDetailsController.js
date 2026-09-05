import Contact from "../models/Contact.js";

// GET /api/contacts/:loginId

export const getContactByLoginId = async (req, res) => {
  try {
    const contact = await Contact.findById(req.contactid);
    // console.log(req.contactid)
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.status(200).json({
      success: true,
      contact
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


//search for specific contacts with email, name and loginId
export const getContacts = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query;

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

    const contacts = await Contact.find(filter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit));

    const total = await Contact.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      contacts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateContact = async (req, res) => {
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
      { _id: req.contactid },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      contact
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const archiveContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.contactid },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact archived successfully",
      contact
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
