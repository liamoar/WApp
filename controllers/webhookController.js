const handleCommand = require('../utils/handleCommand'); 

exports.handleWebhook = async (req, res) => {
  const { payload } = req.body;
  const from = req.phone;
  const msg = payload?.payload?.text?.trim();

  if (!from || !msg) return res.sendStatus(400);

  const user = req.userUsage;

  // 🎯 Route all messages through handleCommand — state logic lives there
  await handleCommand(from, msg, user);
  
  return res.sendStatus(200);
};
