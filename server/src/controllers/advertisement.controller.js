exports.fetchAdvertisements = async (req, res, next) => {
  try {
    const ads = await req.models.Advertisement.find();

    res.status(200).json(ads);
  } catch (err) {
    next(err);
  }
};
