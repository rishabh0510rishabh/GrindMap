import User from "../models/user.model.js";

export const addFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  if (userId === friendId) {
    return res.status(400).json({ message: "Cannot add yourself as friend" });
  }

  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!friend) {
    return res.status(404).json({ message: "Friend not found" });
  }

  if (user.friends.includes(friendId)) {
    return res.status(400).json({ message: "Already friends" });
  }

  user.friends.push(friendId);
  await user.save();

  res.json({ message: "Friend added successfully" });
};

export const removeFriend = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  const user = await User.findById(userId);
  user.friends = user.friends.filter(id => id.toString() !== friendId);
  await user.save();

  res.json({ message: "Friend removed successfully" });
};

export const getFriends = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate('friends', 'name username totalScore');
  res.json(user.friends);
};