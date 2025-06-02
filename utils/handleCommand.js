const { sendMessage, sendImage } = require('../services/whatsappService');
const { showBundleOptions, handleBundleSelection } = require('./bundlePurchase');

module.exports = async function handleCommand(phone, msg, userUsage) {
  // Debug: confirm Mongoose doc with save method
  if (!userUsage || typeof userUsage.save !== 'function') {
    console.error('handleCommand error: userUsage is not a Mongoose document:', userUsage);
    return;
  }

  // Load or initialize conversation state
  let state = userUsage.conversationState || { step: 'start' };

  switch (state.step) {
    case 'start':
      await sendMessage(phone, "Hey there! 😊 What should I call you?");
      state.step = 'asking_q1';
      break;

    case 'asking_q1':
      state.name = msg;
      userUsage.name = state.name; 
      await sendMessage(phone, `I’m not shy ${state.name}, and I’ve got something very naughty in mind for you… But first, tell me something: \n\n Are you in the mood to play? 😉`)
      state.step = 'asking_q2';
      break;

    case 'asking_q2':
      state.q1 = msg;
      await sendMessage(phone, "Mmm… you like that? 😈 Want a little taste of what you’ll get when you really unlock me? 😉\n  tell me… what would you do to earn it? 😏 ");
      state.step = 'offer_preview';
      break;

    case 'offer_preview':
      state.q2 = msg;
      const imageSent = await sendImage(
        phone,
        'https://images.unsplash.com/photo-1647724065024-0389996ac3bf?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        '👀😉'
      );
      await sendMessage(phone, "Want to see how far I can take you? 💋");
      state.onBoardingCompleted = true;
      state.step = 'waiting_payment';
      break;

    case 'waiting_payment':
      const lowerMsg = msg.toLowerCase();
      
      if(!state.awaitingBundleSelection) {
        await showBundleOptions(phone);
        state.awaitingBundleSelection = true;
      } else {
        console.log("in else, msg is:", lowerMsg);
        
        // Corrected condition - checks if message IS one of the valid options
        if(['1', '2', '3'].includes(lowerMsg)) {
          const session = await handleBundleSelection(phone, msg, {
            name: state.name,
            phone: phone
          });
          
          if(session) {
            state.awaitingBundleSelection = false;
            state.step = "post_purchase";
          }
        } else {
          await sendMessage(phone, "Invalid response, Please reply with 1, 2...");
          // DON'T set awaitingBundleSelection to false here
          // So the user can try again without seeing the bundle options again
        }
      }
      
      break;  

    case 'post_purchase':
    //TODO: check if the payment is actually done here or not  
    await sendMessage(phone, "Thanks for your purchase! You'll get the full photo shortly.");
      // Additional post purchase flow can be added here
      break;
    
    case 'chat_active':
      if(userUsage.messagesRemaining >0)  userUsage.messagesRemaining -= 1; 
      await sendMessage(phone, "Chatting start here"); 
      break;

    default:
      await sendMessage(phone, "Hi again! Want to continue where we left off?");
      state.step = 'start';
  }
  userUsage.conversationState = state;
  userUsage.lastUpdated = new Date();
  await userUsage.save();
};
