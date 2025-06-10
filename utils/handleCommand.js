const { sendMessage, sendImage } = require('../services/whatsappService');
const { showBundleOptions, handleBundleSelection } = require('./bundlePurchase');
const {retrieveSession} = require('../services/paymentService');

function wait(ms){
  return new Promise(resolve => setTimeout(resolve,ms));
}
module.exports = async function  handleCommand(phone, msg, userUsage) {
  // Debug: confirm Mongoose doc with save method
  if (!userUsage || typeof userUsage.save !== 'function') {
    console.error('handleCommand error: userUsage is not a Mongoose document:', userUsage);
    return;
  }

  // Load or initialize conversation state
  let state = userUsage.conversationState || { step: 'start' };

  switch (state.step) {
    case 'start':
      await wait(9000);  
      await sendMessage(phone, "Hey there! 😊 What should I call you?");
      state.step = 'asking_q1';
      break;

    case 'asking_q1':
      state.name = msg;
      userUsage.name = state.name;
      await wait(10000);
      await sendMessage(phone, `I’m not shy ${state.name}, and I’ve got something very naughty in mind for you… But first, tell me something: \n\n Are you in the mood to play? 😉`)
      state.step = 'asking_q2';
      break;

    case 'asking_q2':
      state.q1 = msg;
       await wait(6000);
      await sendMessage(phone, "Mmm… you like that? 😈 Want a little taste of what you’ll get when you really unlock me? 😉\n  tell me… what would you do to earn it? 😏 ");
      state.step = 'offer_preview';
      break;

    case 'offer_preview':
      state.q2 = msg;
      const imageSent = await sendImage(
        phone,
        'https://lp.sparktube.co/images/offer2.jpg',
        '👀😉'
      );
      await wait(15000);
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
            state.stripeCheckoutSessionId = session.id
            state.stripeCheckoutSessionId
          }
        } else {
          await sendMessage(phone, "Invalid response, Please reply with 1, 2...");
          // DON'T set awaitingBundleSelection to false here
          // So the user can try again without seeing the bundle options again
        }
      }
      
      break;  

    case 'post_purchase':
       const stripeSessionId = await retrieveSession(state.stripeCheckoutSessionId);
       console.log(stripeSessionId.id);
       if(stripeSessionId && stripeSessionId.payment_status == "paid"){
         await sendMessage(phone, "Thanks for your purchase!");
       }else{
          if(stripeSessionId.status !="complete"){
            const shortLink = `${process.env.DOMAIN}/pay/${stripeSessionId.id}`;
            await sendMessage(phone, `Click here to unlock me now and get full access to our private chat 🔥:\n\n 👉 ${shortLink}`);
          }else{
            state.awaitingBundleSelection = false;
            state.step="waiting_payment"
          }
       }
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
