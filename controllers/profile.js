const User = require("../models/user");
const Offer = require("../models/offer");
const Profile = require("../models/profile");
const ExpressError = require("../utils/ExpressError");
const { paginate } = require("../lib/paginate");

/**
 * Shows a user's profile page.
 *
 * Throws a 404 if the username cannot be found.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.show = async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  let [profile, offers] = await Promise.all([
    Profile.findOne({ user: user._id }),
    Offer.find({ author: user._id }).populate("author").countDocuments(),
  ]);

  // Profiles are lazily created, so if it cannot be found for a valid user,
  // pass along an empty object.
  if (!profile) {
    profile = {};
  }

  res.render("profile/show", {
    user,
    profile,
    historic: 0,
    active: 0,
    offers,
  });
};

/**
 * Shows the edit profile page.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.edit = async (req, res) => {
  const { id } = req.user;

  let profile = await Profile.findOne({ user: id });
  if (!profile) {
    profile = {};
  }

  res.render("profile/edit", {
    profile,
  });
};

/**
 * Handles updating a user's profile.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.update = async (req, res) => {
  const { id, username } = req.user;

  await Profile.findOneAndUpdate({ user: id }, req.body, { upsert: true });

  req.flash("success", "Successfully updated profile");
  res.redirect(`/profile/${username}`);
};

/**
 * View all of a user's offers.
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.offers = async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  const offers = await Offer.find({ author: user._id }).populate("author");

  res.render("profile/offers", {
    username,
    page: paginate(offers, req.query.page, 20),
  });
};