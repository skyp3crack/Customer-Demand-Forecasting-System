const bcrypt = require('bcrypt');
const m = require('../models');

async function update(req, res) {
  // TODO handle image & email update
  const {
    new_password, old_password,
  } = req.body;

  const fields = {};
  const allowedFields = ['name', 'phone'];
  allowedFields.forEach(f => {
    if (req.body[f]) {
      fields[f] = req.body[f];
    }
  });

  if (new_password && old_password) {
    const user = await m.User.findOne({ where: { id: req.params.UserId } });
    const isMatch = await bcrypt.compare(old_password, user.password); // await was missing — bug fix
    if (!isMatch) {
      res.status(422).send({ error: 'Wrong old password' });
      return;
    }
    const salt = await bcrypt.genSalt();
    fields.password = await bcrypt.hash(new_password, salt);
  }

  try {
    await m.User.update(fields, { where: { id: req.params.UserId } });
    res.json({ status: 'updated' });
  } catch (error) {
    res.status(500).send({ error });
  }
}

module.exports = {
  update,
};
