export const updateUserProfile = async (req, res) => {
  try {
    const { name, username, email, bio, isPublic } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is taken
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    if (typeof isPublic === 'boolean') user.isPublic = isPublic;

    const updated = await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: updated._id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        bio: updated.bio,
        isPublic: updated.isPublic,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
