import { useState, useEffect, useRef } from "react";
import { 
  FaRobot, FaTimes, FaUser, FaMobileAlt, FaComment, 
  FaPaperPlane, FaStar, FaDownload, FaPhone, FaEnvelope, FaWhatsapp 
} from "react-icons/fa";

const Chatbot = ({ isOpen, onClose, menuData, apiBaseUrl }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: "",
    phone: "",
    feedback: "",
    rating: 0
  });
  const [orderCart, setOrderCart] = useState([]);
  const [reservationDetails, setReservationDetails] = useState(null);
  
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      setChatMessages([
        {
          type: "bot",
          message: "👋 Hello! Welcome to Café Élan ☕. How can I help you today?",
          options: ["View Menu", "Today's Specials", "Best Sellers", "Book a Table", "Place Order", "Give Feedback", "Contact Us"]
        }
      ]);
    }
  }, [isOpen]);

  // Comprehensive intent matching
  const matchIntent = (message) => {
    const lowerMsg = message.toLowerCase().trim();
    
    // ==================== GREETINGS ====================
    if (lowerMsg.match(/^(hi|hello|hey|greetings)/)) return "GREETING_HI";
    if (lowerMsg.match(/^good morning/)) return "GREETING_MORNING";
    if (lowerMsg.match(/^good evening/)) return "GREETING_EVENING";
    if (lowerMsg.match(/anyone there|are you online|you there/)) return "GREETING_ONLINE";
    
    // ==================== MENU QUERIES ====================
    if (lowerMsg.match(/show me the menu|menu|see menu|what's on the menu/)) return "MENU_SHOW";
    if (lowerMsg.match(/what do you serve|what do you have|what items|what food/)) return "MENU_SERVE";
    if (lowerMsg.match(/best seller|best selling|most popular|popular items|famous/)) return "MENU_BESTSELLERS";
    if (lowerMsg.match(/vegetarian|veg food|veg options|veg dishes/)) return "MENU_VEG";
    if (lowerMsg.match(/vegan|vegan options|plant based/)) return "MENU_VEGAN";
    if (lowerMsg.match(/jain|jain food|jain options/)) return "MENU_JAIN";
    if (lowerMsg.match(/gluten free|gluten-free|celiac/)) return "MENU_GLUTENFREE";
    if (lowerMsg.match(/spicy|spiciest|hot|🌶️/)) return "MENU_SPICY";
    if (lowerMsg.match(/cheapest|budget|lowest price|under ₹|under rs/)) return "MENU_CHEAPEST";
    if (lowerMsg.match(/most expensive|costly|premium|highest price/)) return "MENU_EXPENSIVE";
    
    // ==================== ITEM SPECIFIC ====================
    if (lowerMsg.includes("alfredo pasta") || lowerMsg.includes("alfredo")) return "ITEM_ALFREDO";
    if (lowerMsg.includes("burger")) return "ITEM_BURGER";
    if (lowerMsg.includes("pasta") && lowerMsg.includes("garlic")) return "ITEM_PASTA_GARLIC";
    if (lowerMsg.match(/coffee strong|strong coffee|coffee strength/)) return "ITEM_COFFEE_STRONG";
    if (lowerMsg.match(/cheesecake|cheese cake|homemade/)) return "ITEM_CHEESECAKE";
    
    // ==================== PRICING ====================
    if (lowerMsg.match(/cold coffee price|price of cold coffee|how much is cold coffee/)) return "PRICE_COLD_COFFEE";
    if (lowerMsg.match(/alfredo pasta price|price of alfredo|how much is alfredo/)) return "PRICE_ALFREDO";
    if (lowerMsg.match(/under ₹200|under rs 200|below 200|less than 200/)) return "PRICE_UNDER_200";
    if (lowerMsg.match(/combo|offer|deal|combo offer/)) return "PRICE_COMBO";
    
    // ==================== ORDERING ====================
    if (lowerMsg.match(/i want to order|place order|order now/)) return "ORDER_START";
    if (lowerMsg.match(/add.*burger|burger add/)) return "ORDER_ADD_BURGER";
    if (lowerMsg.match(/add.*cold coffee|cold coffee add/)) return "ORDER_ADD_COLD_COFFEE";
    if (lowerMsg.match(/remove.*fries|fries remove|delete fries/)) return "ORDER_REMOVE_FRIES";
    if (lowerMsg.match(/clear my cart|empty cart|remove all/)) return "ORDER_CLEAR_CART";
    if (lowerMsg.match(/checkout|proceed to checkout|place order/)) return "ORDER_CHECKOUT";
    if (lowerMsg.match(/cancel my order|order cancel/)) return "ORDER_CANCEL";
    
    // ==================== RESERVATIONS ====================
    if (lowerMsg.match(/book a table|reserve a table|table reservation/)) return "RESERVE_BOOK";
    if (lowerMsg.match(/reserve a table for \d+|table for \d+/)) return "RESERVE_FOR_NUMBER";
    if (lowerMsg.match(/table available now|available now|any table now/)) return "RESERVE_AVAILABLE_NOW";
    if (lowerMsg.match(/reserve for tonight|book for tonight|tonight reservation/)) return "RESERVE_TONIGHT";
    if (lowerMsg.match(/cancel my reservation|reservation cancel/)) return "RESERVE_CANCEL";
    
    // ==================== DELIVERY & TAKEAWAY ====================
    if (lowerMsg.match(/do you deliver|delivery available|home delivery/)) return "DELIVERY_YES";
    if (lowerMsg.match(/zomato/)) return "DELIVERY_ZOMATO";
    if (lowerMsg.match(/swiggy/)) return "DELIVERY_SWIGGY";
    if (lowerMsg.match(/delivery time|how long.*delivery|when will i get/)) return "DELIVERY_TIME";
    if (lowerMsg.match(/pick up|takeaway|self pick up|carry out/)) return "DELIVERY_PICKUP";
    
    // ==================== LOCATION & CONTACT ====================
    if (lowerMsg.match(/where are you located|location|address|directions/)) return "LOCATION_ADDRESS";
    if (lowerMsg.match(/send me the address|give me address/)) return "LOCATION_SEND_ADDRESS";
    if (lowerMsg.match(/google maps|map link|maps location/)) return "LOCATION_GOOGLE_MAPS";
    if (lowerMsg.match(/phone number|contact number|call you/)) return "CONTACT_PHONE";
    if (lowerMsg.match(/how do i contact you|reach you|contact info/)) return "CONTACT_HOW";
    
    // ==================== OPENING HOURS ====================
    if (lowerMsg.match(/opening hours|business hours|timing|operating hours/)) return "HOURS_GENERAL";
    if (lowerMsg.match(/are you open now|open currently|open right now/)) return "HOURS_OPEN_NOW";
    if (lowerMsg.match(/what time do you close|closing time/)) return "HOURS_CLOSE";
    if (lowerMsg.match(/open on sundays|sunday open|weekend hours/)) return "HOURS_SUNDAY";
    
    // ==================== PAYMENTS ====================
    if (lowerMsg.match(/accept upi|upi payment|google pay|phonepe|paytm/)) return "PAYMENT_UPI";
    if (lowerMsg.match(/pay by card|credit card|debit card|card payment/)) return "PAYMENT_CARD";
    if (lowerMsg.match(/accept cash|cash payment/)) return "PAYMENT_CASH";
    if (lowerMsg.match(/split the bill|divide bill|separate checks/)) return "PAYMENT_SPLIT";
    
    // ==================== OFFERS & LOYALTY ====================
    if (lowerMsg.match(/any offers|current offers|promotions|deals/)) return "OFFERS_CURRENT";
    if (lowerMsg.match(/discounts|any discount|discount today/)) return "OFFERS_DISCOUNT";
    if (lowerMsg.match(/loyalty program|rewards|loyalty card/)) return "OFFERS_LOYALTY";
    if (lowerMsg.match(/earn points|loyalty points|how to earn points/)) return "OFFERS_EARN_POINTS";
    
    // ==================== COMPLAINTS ====================
    if (lowerMsg.match(/order is late|delayed order|taking too long/)) return "COMPLAINT_LATE";
    if (lowerMsg.match(/wrong item|received wrong|incorrect item/)) return "COMPLAINT_WRONG_ITEM";
    if (lowerMsg.match(/food was cold|cold food|not hot/)) return "COMPLAINT_COLD_FOOD";
    if (lowerMsg.match(/leave feedback|give feedback|share experience/)) return "COMPLAINT_FEEDBACK";
    if (lowerMsg.match(/speak to manager|talk to manager|call manager/)) return "COMPLAINT_MANAGER";
    
    // ==================== DIETARY ====================
    if (lowerMsg.match(/is.*vegetarian|veg\?|vegetarian\?/)) return "DIETARY_VEG_CHECK";
    if (lowerMsg.match(/contains nuts|nut allergy|nuts\?/)) return "DIETARY_NUTS";
    if (lowerMsg.match(/contains egg|egg\?|egg in this/)) return "DIETARY_EGG";
    if (lowerMsg.match(/halal|halal certified/)) return "DIETARY_HALAL";
    if (lowerMsg.match(/less spicy|reduce spice|mild spice/)) return "DIETARY_LESS_SPICY";
    
    // ==================== EVENTS & AMENITIES ====================
    if (lowerMsg.match(/live music|music event|performance/)) return "EVENTS_LIVE_MUSIC";
    if (lowerMsg.match(/birthday party|host a party|celebrate birthday/)) return "EVENTS_BIRTHDAY";
    if (lowerMsg.match(/wifi|internet|free wifi/)) return "EVENTS_WIFI";
    if (lowerMsg.match(/parking|car park|vehicle parking/)) return "EVENTS_PARKING";
    if (lowerMsg.match(/pet friendly|bring pet|dogs allowed/)) return "EVENTS_PET_FRIENDLY";
    
    // ==================== FUN & RANDOM ====================
    if (lowerMsg.match(/how are you|how do you do/)) return "FUN_HOW_ARE_YOU";
    if (lowerMsg.match(/who made you|who created you|your creator/)) return "FUN_CREATOR";
    if (lowerMsg.match(/are you a robot|are you ai/)) return "FUN_ROBOT";
    if (lowerMsg.match(/do you like coffee|like coffee/)) return "FUN_LIKE_COFFEE";
    if (lowerMsg.match(/tell me a joke|joke|make me laugh/)) return "FUN_JOKE";
    if (lowerMsg.match(/sing a song|song/)) return "FUN_SONG";
    
    // ==================== RANDOM/GIBBERISH ====================
    if (lowerMsg.match(/^[asdfghjkl]+$/)) return "RANDOM_KEYBOARD";
    if (lowerMsg.match(/^\d+$/)) return "RANDOM_NUMBERS";
    if (lowerMsg.match(/🍕|☕|🚀/)) return "RANDOM_EMOJI";
    if (lowerMsg.match(/moon.*pasta|pasta.*moon/)) return "RANDOM_MOON_PASTA";
    if (lowerMsg.match(/fish.*drive.*bicycle|bicycle.*fish/)) return "RANDOM_FISH_BICYCLE";
    if (lowerMsg.match(/purple elephant|elephant.*midnight/)) return "RANDOM_PURPLE_ELEPHANT";
    if (lowerMsg.match(/blah blah|blahblah/)) return "RANDOM_BLAH";
    if (lowerMsg.match(/^\.+$/)) return "RANDOM_DOTS";
    
    // ==================== EDGE CASES ====================
    if (lowerMsg.match(/forgot what i wanted|forgot|i forgot/)) return "EDGE_FORGOT";
    if (lowerMsg.match(/surprise me|surprise/)) return "EDGE_SURPRISE";
    if (lowerMsg.match(/i don't know what to eat|don't know what to order/)) return "EDGE_DONT_KNOW";
    if (lowerMsg.match(/recommend something|recommend|suggest/)) return "EDGE_RECOMMEND";
    if (lowerMsg.match(/what's trending|trending/)) return "EDGE_TRENDING";
    if (lowerMsg.match(/help|i need help|support/)) return "EDGE_HELP";
    
    // ==================== ABUSE ====================
    if (lowerMsg.match(/stupid|idiot|dumb/)) return "ABUSE_STUPID";
    if (lowerMsg.match(/terrible|horrible|awful|bad restaurant/)) return "ABUSE_TERRIBLE";
    
    // ==================== FALLBACK ====================
    return "FALLBACK";
  };

  // Get response based on intent
  const getResponse = (intent, userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    const responses = {
      // Greetings
      "GREETING_HI": "Hello! Welcome to Café Élan ☕. How can I help you today?",
      "GREETING_MORNING": "Good morning! Hope you're having a wonderful day. ☀️",
      "GREETING_EVENING": "Good evening! Ready for some delicious food and coffee? 🌙",
      "GREETING_ONLINE": "Yes, I'm here and happy to help! How can I assist you?",
      
      // Menu Queries
      "MENU_SHOW": "Here's our menu! What category would you like to explore? ☕🍝🍰",
      "MENU_SERVE": "We offer beverages, snacks, pasta, pizzas, sandwiches, desserts, and more. Check out our full menu above! 🍽️",
      "MENU_BESTSELLERS": "Our customers love our Alfredo Pasta, Signature Burgers, Cold Coffee, and Loaded Fries! 🔥",
      "MENU_VEG": "Yes! We have a wide range of vegetarian options including Veg Pasta, Veg Burgers, Sandwiches, and more! 🌱",
      "MENU_VEGAN": "Yes, we offer selected vegan-friendly dishes. Ask me for recommendations! 🌿",
      "MENU_JAIN": "We can customize certain dishes to suit Jain preferences. Please inform our staff about your requirements.",
      "MENU_GLUTENFREE": "We have a few gluten-free options. Let me know your dietary preference and I'll help you find suitable dishes.",
      "MENU_SPICY": "I can recommend our spicier dishes if you enjoy some heat! Try our Spicy Pasta or Chilli Burger! 🌶️",
      "MENU_CHEAPEST": "We have several budget-friendly options including our Classic Coffee (₹120), Veg Sandwich (₹180), and Fries (₹100).",
      "MENU_EXPENSIVE": "Our premium specials and platters are among the highest-priced items, including our Signature Platter (₹599).",
      
      // Item Specific
      "ITEM_ALFREDO": "Creamy white sauce pasta tossed with herbs and vegetables/chicken, depending on your choice. It's one of our best sellers! 🍝",
      "ITEM_BURGER": "It's one of our customer favorites! Juicy patty with fresh vegetables and our special sauce. 🍔",
      "ITEM_PASTA_GARLIC": "Yes, our standard recipe includes garlic. We may be able to customize it for you - just let our staff know.",
      "ITEM_COFFEE_STRONG": "We offer both mild and strong coffee options depending on your preference. Our Espresso is strong, while Latte is milder.",
      "ITEM_CHEESECAKE": "Please check today's dessert availability; some items may be freshly prepared in-house. Ask our staff for today's special desserts! 🍰",
      
      // Pricing
      "PRICE_COLD_COFFEE": "Our Cold Coffee is ₹180 for regular and ₹220 for large. Would you like to add one to your order?",
      "PRICE_ALFREDO": "Our Alfredo Pasta is ₹350 for the vegetarian version and ₹420 with chicken. It's one of our best sellers!",
      "PRICE_UNDER_200": "Yes! We have Coffee (₹120), Tea (₹100), Fries (₹100), and Veg Sandwich (₹180) under ₹200.",
      "PRICE_COMBO": "Check out our current combo deals: Pasta + Cold Coffee for ₹499, Burger + Fries + Drink for ₹349!",
      
      // Ordering
      "ORDER_START": "Great! What would you like to have today? You can browse our menu above or tell me what you're craving.",
      "ORDER_ADD_BURGER": "Sure! I've added one Signature Burger to your order. Anything else? 🍔",
      "ORDER_ADD_COLD_COFFEE": "Done! Two cold coffees have been added to your order. ☕",
      "ORDER_REMOVE_FRIES": "No problem, I've removed the fries from your order.",
      "ORDER_CLEAR_CART": "Your cart has been emptied. Would you like to add something new?",
      "ORDER_CHECKOUT": "You're all set! Here's your order summary. Please proceed to payment. 💳",
      "ORDER_CANCEL": "If your order hasn't been prepared yet, we can help you cancel it. Please contact our staff for assistance.",
      
      // Reservations
      "RESERVE_BOOK": "Sure! Please tell me the date, time, and number of guests for your reservation. 📅",
      "RESERVE_FOR_NUMBER": "Certainly! What date and time would you prefer for your reservation?",
      "RESERVE_AVAILABLE_NOW": "Let me check our availability. Please wait a moment... Yes, we have tables available. Would you like me to reserve one?",
      "RESERVE_TONIGHT": "Yes, subject to availability. Please share your preferred time and number of guests.",
      "RESERVE_CANCEL": "Please provide your booking details (name, date, time), and I'll help you cancel it.",
      
      // Delivery & Takeaway
      "DELIVERY_YES": "Yes, we offer delivery services through our partners. You can also order directly through our website.",
      "DELIVERY_ZOMATO": "Yes, you can place an order through Zomato. Just search for 'Café Élan'.",
      "DELIVERY_SWIGGY": "Yes, we're available on Swiggy as well! Search for 'Café Élan' to place your order.",
      "DELIVERY_TIME": "Delivery time depends on your location and current demand, typically 30-45 minutes.",
      "DELIVERY_PICKUP": "Absolutely! We offer takeaway and self-pickup. Just place your order and come by the café.",
      
      // Location & Contact
      "LOCATION_ADDRESS": "📍 We're located at 123 Coffee Lane, Food District, Mumbai - 400001. We're near the central plaza!",
      "LOCATION_SEND_ADDRESS": "📍 Café Élan, 123 Coffee Lane, Food District, Mumbai - 400001. We're near the central plaza!",
      "LOCATION_GOOGLE_MAPS": "Here's the map link for easy navigation: [Google Maps Link]. We're excited to see you! 🗺️",
      "CONTACT_PHONE": "📞 You can reach us at +91 12345 67890 during business hours.",
      "CONTACT_HOW": "You can call us at +91 12345 67890, email us at info@cafeelan.com, or visit the café directly!",
      
      // Opening Hours
      "HOURS_GENERAL": "🕐 We're open Monday - Friday: 8:00 AM - 10:00 PM, Saturday - Sunday: 9:00 AM - 11:00 PM.",
      "HOURS_OPEN_NOW": "Yes, we're currently open! Our hours today are until 10:00 PM. 🎉",
      "HOURS_CLOSE": "We close at 10:00 PM today. You still have time to place your order! ⏰",
      "HOURS_SUNDAY": "Yes, we're open on Sundays from 9:00 AM - 11:00 PM. Join us for a relaxing Sunday! ☕",
      
      // Payments
      "PAYMENT_UPI": "Yes, we accept UPI payments including Google Pay, PhonePe, and Paytm. 💳",
      "PAYMENT_CARD": "Yes, debit and credit cards are accepted at our café. All major cards welcome!",
      "PAYMENT_CASH": "Absolutely! Cash payments are always welcome at Café Élan. 💰",
      "PAYMENT_SPLIT": "Yes, we can split the bill for groups up to 5 people. Just let our staff know at the counter.",
      
      // Offers & Loyalty
      "OFFERS_CURRENT": "🎉 Check out our latest promotions: Monday Madness (20% off on pasta), Wednesday Coffee Day (Buy 1 Get 1 Free), and Weekend Special Combos!",
      "OFFERS_DISCOUNT": "Yes! We have student discounts (10% off with ID), group discounts, and seasonal offers. Ask our staff for details!",
      "OFFERS_LOYALTY": "Yes! Ask about our loyalty card and rewards. Every ₹500 spent gets you 1 stamp. 10 stamps = free meal! 🎁",
      "OFFERS_EARN_POINTS": "Eligible purchases help you earn loyalty rewards. Every ₹500 spent = 1 stamp. Collect 10 stamps for a free meal!",
      
      // Complaints
      "COMPLAINT_LATE": "I'm sorry for the delay. Let me help you check the status of your order. Please provide your order number.",
      "COMPLAINT_WRONG_ITEM": "Sorry about that. We'll help resolve it as quickly as possible. Please share your order details.",
      "COMPLAINT_COLD_FOOD": "We apologize for the experience. We'd like to help make it right. Please contact our staff.",
      "COMPLAINT_FEEDBACK": "We'd love to hear your feedback. Please tell us about your experience using the feedback form below! 📝",
      "COMPLAINT_MANAGER": "Certainly. I'll help connect you with our team. Please wait while I transfer you to a manager.",
      
      // Dietary
      "DIETARY_VEG_CHECK": "I'll check the ingredients for you. Most of our dishes are vegetarian or can be customized! 🌱",
      "DIETARY_NUTS": "Let me verify the allergen information. Please inform our staff about any nut allergies when ordering.",
      "DIETARY_EGG": "I'll check the recipe details. Our staff can help you identify egg-free options.",
      "DIETARY_HALAL": "Please check with our staff for the latest sourcing information regarding halal certification.",
      "DIETARY_LESS_SPICY": "We can often adjust spice levels on request. Just let our staff know your preference! 🌶️",
      
      // Events & Amenities
      "EVENTS_LIVE_MUSIC": "Check our upcoming events schedule! We have live music every Friday and Saturday evening from 7 PM.",
      "EVENTS_BIRTHDAY": "Yes! We'd be happy to discuss event bookings for birthdays, anniversaries, and other celebrations. Call us for details! 🎂",
      "EVENTS_WIFI": "Yes, free Wi-Fi is available for all our customers. Ask our staff for the password! 📶",
      "EVENTS_PARKING": "Parking availability depends on the location and time. We have limited parking behind the café.",
      "EVENTS_PET_FRIENDLY": "Please check our current pet policy. We allow well-behaved pets in our outdoor seating area! 🐕",
      
      // Fun
      "FUN_HOW_ARE_YOU": "I'm doing great, thanks for asking! What can I help you with today?",
      "FUN_CREATOR": "I was created to help customers enjoy a smooth café experience at Café Élan! 🤖",
      "FUN_ROBOT": "Yes, I'm your virtual café assistant. Here to make your experience better! 🤖☕",
      "FUN_LIKE_COFFEE": "If I could taste, I'd probably be a coffee enthusiast! Our cold coffee is amazing! ☕",
      "FUN_JOKE": "Why did the coffee file a police report? It got mugged! ☕😄 Here's another: What do you call a sad strawberry? A blueberry!",
      "FUN_SONG": "I might not sing well, but I can definitely help you order dessert! 🎵 Would you like to see our dessert menu?",
      
      // Random/Gibberish
      "RANDOM_KEYBOARD": "I'm not sure I understood that. Could you rephrase your question? I can help with menu, orders, reservations, and more.",
      "RANDOM_NUMBERS": "I think you might have entered a number. How can I help you today? Looking for menu or prices?",
      "RANDOM_EMOJI": "Nice combination! Are you looking for food, drinks, or something else? 🍕☕",
      "RANDOM_MOON_PASTA": "That would be a delicious universe! Meanwhile, can I help you with our actual menu? 😄",
      "RANDOM_FISH_BICYCLE": "Probably not, but I can definitely help you order lunch! What would you like?",
      "RANDOM_PURPLE_ELEPHANT": "Sounds like a creative story! Is there something café-related I can help with?",
      "RANDOM_BLAH": "I'm here whenever you're ready to ask a question or place an order. How can I help?",
      "RANDOM_DOTS": "Just type your question whenever you're ready! I'm here to help.",
      
      // Edge Cases
      "EDGE_FORGOT": "No worries! Would you like some popular recommendations? Our best sellers include Alfredo Pasta and Cold Coffee!",
      "EDGE_SURPRISE": "I'd recommend one of our best-selling mains with a signature beverage. Try our Alfredo Pasta with Cold Coffee! 🍝☕",
      "EDGE_DONT_KNOW": "Tell me whether you're craving something light, hearty, sweet, or spicy! I'll help you decide.",
      "EDGE_RECOMMEND": "I'd be happy to! Do you prefer vegetarian, non-vegetarian, or desserts? Also, what's your spice preference?",
      "EDGE_TRENDING": "Our customer favorites are always a great place to start! Alfredo Pasta, Signature Burger, and Cold Coffee are trending! 🔥",
      "EDGE_HELP": "Of course! You can ask about the menu, prices, reservations, delivery, offers, opening hours, or anything else about Café Élan!",
      
      // Abuse
      "ABUSE_STUPID": "I'm here to help. Let me know if there's something you need assistance with. How can I make your experience better?",
      "ABUSE_TERRIBLE": "I'm sorry to hear that. If you'd like to share what went wrong, I'll do my best to help resolve the issue.",
      
      // Fallback
      "FALLBACK": "I'm sorry, I didn't quite understand that. I can help with our menu, prices, recommendations, reservations, delivery, opening hours, and general café information. Could you rephrase your question?"
    };
    
    return responses[intent] || responses["FALLBACK"];
  };

  // Get today's specials from dashboard data
  const getTodaysSpecials = () => {
    return menuData.filter(item => String(item.is_special).trim() === "1");
  };

  // Get best sellers from dashboard data
  const getBestSellers = () => {
    return menuData.filter(item => item.is_bestseller === 1);
  };

  const handleChatOption = (option) => {
    switch(option) {
      case "View Menu":
        addBotMessage("You can browse our menu above! Use the search bar or click on category chips to find your favorite items. 🍽️");
        break;
        
      case "Today's Specials": {
        const specials = getTodaysSpecials();
        if (specials.length === 0) {
          addBotMessage("🌟 Today's special items haven't been set yet. Please check back later!");
          break;
        }
        let message = "⭐ **Today's Specials:** ⭐\n\n";
        specials.forEach((item, idx) => {
          message += `${idx + 1}. **${item.name}** - ₹${item.price}\n`;
          message += `   📝 ${item.description || "Delicious special item"}\n`;
          if (String(item.is_bestseller).trim() === "1") message += `   🔥 Best Seller!\n`;
          message += `\n`;
        });
        addBotMessage(message);
        break;
      }
        
      case "Best Sellers": {
        const bestsellers = getBestSellers();
        if (bestsellers.length > 0) {
          let message = "🔥 **Our Best Sellers:** 🔥\n\n";
          bestsellers.forEach((item, idx) => {
            message += `${idx + 1}. **${item.name}** - ₹${item.price}\n`;
            message += `   📝 ${item.description || "Customer favorite"}\n`;
            if (item.is_special === 1) message += `   ⭐ Today's Special!\n`;
            message += `\n`;
          });
          addBotMessage(message);
        } else {
          addBotMessage("No best sellers marked yet. Check out our menu above for popular items! 🔥");
        }
        break;
      }
        
      case "Book a Table":
        addBotMessage("📅 Sure! Please tell me the date, time, and number of guests for your reservation.", true);
        break;
        
      case "Place Order":
        addBotMessage("🛵 Great! What would you like to have today? You can browse our menu above or tell me what you're craving.");
        break;
        
      case "Give Feedback":
        setShowFeedbackForm(true);
        setShowContactInfo(false);
        addBotMessage("We'd love to hear your feedback! Please fill out the form below. ⭐");
        break;
        
      case "Contact Us":
        setShowContactInfo(true);
        setShowFeedbackForm(false);
        addBotMessage("Here's how you can reach us:");
        break;
        
      default:
        break;
    }
  };

  const addBotMessage = (message, showOptions = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: "bot", 
        message, 
        options: showOptions ? ["View Menu", "Today's Specials", "Best Sellers", "Book a Table", "Place Order", "Give Feedback", "Contact Us"] : undefined 
      }]);
      setIsTyping(false);
    }, 500);
  };

  const addUserMessage = (message) => {
    setChatMessages(prev => [...prev, { type: "user", message }]);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    addUserMessage(userInput);
    
    // Match intent and get response
    const intent = matchIntent(userInput);
    const response = getResponse(intent, userInput);
    
    // Add bot response
    addBotMessage(response);
    
    setUserInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackData.name || !feedbackData.phone || !feedbackData.feedback) {
      alert("Please fill in all fields!");
      return;
    }
    
    if (!/^\d{10}$/.test(feedbackData.phone)) {
      alert("Please enter a valid 10-digit phone number!");
      return;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });
      
      if (response.ok) {
        addBotMessage(`Thank you ${feedbackData.name} for your valuable feedback! We appreciate your input and will use it to improve our service. 🙏`);
        setShowFeedbackForm(false);
        setFeedbackData({ name: "", phone: "", feedback: "", rating: 0 });
      } else {
        addBotMessage("Sorry, there was an error saving your feedback. Please try again.");
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      addBotMessage("Sorry, there was an error saving your feedback. Please try again.");
    }
  };

  const downloadFeedbacksCSV = () => {
    window.open(`${apiBaseUrl}/feedbacks/export/csv`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 bg-cafe rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FaRobot className="text-white text-2xl" />
          <div>
            <h3 className="text-white font-semibold">Café Élan Assistant</h3>
            <p className="text-white/80 text-sm">Online | Ready to help</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:opacity-80">
          <FaTimes size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="h-96 overflow-y-auto p-4 space-y-3 bg-cafe-dark">
        {chatMessages.map((msg, idx) => (
          <div key={idx}>
            <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                msg.type === 'user' 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-white/10 text-cafe-accent-l'
              }`}>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
            {msg.options && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleChatOption(option)}
                    className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 transition"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <div className="p-4 border-t border-white/10 bg-cafe max-h-96 overflow-y-auto">
          <h4 className="text-cafe-accent-y font-semibold mb-3">Share Your Feedback</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
              <FaUser className="text-amber-500" />
              <input 
                type="text" 
                placeholder="Your Name *" 
                value={feedbackData.name} 
                onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})} 
                className="bg-transparent flex-1 outline-none text-cafe-accent-l" 
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
              <FaMobileAlt className="text-amber-500" />
              <input 
                type="tel" 
                placeholder="Phone Number (10 digits) *" 
                value={feedbackData.phone} 
                onChange={(e) => setFeedbackData({...feedbackData, phone: e.target.value})} 
                className="bg-transparent flex-1 outline-none text-cafe-accent-l" 
              />
            </div>
            <div className="flex items-start gap-2 bg-white/5 rounded-lg p-2">
              <FaComment className="text-amber-500 mt-1" />
              <textarea 
                placeholder="Your Feedback *" 
                value={feedbackData.feedback} 
                onChange={(e) => setFeedbackData({...feedbackData, feedback: e.target.value})} 
                rows="3" 
                className="bg-transparent flex-1 outline-none text-cafe-accent-l resize-none" 
              />
            </div>
            <div className="flex gap-1">
              <span className="text-sm text-cafe-accent-d mr-2">Rating:</span>
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setFeedbackData({...feedbackData, rating: star})}>
                  <FaStar className={`${star <= feedbackData.rating ? 'text-yellow-500' : 'text-gray-500'}`} />
                </button>
              ))}
            </div>
            <button 
              onClick={handleSubmitFeedback} 
              className="w-full bg-amber-500 text-black py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

      {/* Contact Info */}
      {showContactInfo && (
        <div className="p-4 border-t border-white/10 bg-cafe">
          <h4 className="text-cafe-accent-y font-semibold mb-3">Contact Us</h4>
          <div className="space-y-3">
            <a href="tel:+911234567890" className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition">
              <FaPhone className="text-green-500" />
              <div>
                <p className="text-sm text-cafe-accent-d">Phone</p>
                <p className="text-cafe-accent-l">+91 12345 67890</p>
              </div>
            </a>
            <a href="mailto:info@cafeelan.com" className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition">
              <FaEnvelope className="text-blue-500" />
              <div>
                <p className="text-sm text-cafe-accent-d">Email</p>
                <p className="text-cafe-accent-l">info@cafeelan.com</p>
              </div>
            </a>
            <a href="https://wa.me/911234567890" className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition">
              <FaWhatsapp className="text-green-500" />
              <div>
                <p className="text-sm text-cafe-accent-d">WhatsApp</p>
                <p className="text-cafe-accent-l">+91 12345 67890</p>
              </div>
            </a>
            <div className="border-t border-white/10 pt-3 mt-2">
              <p className="text-sm text-cafe-accent-d mb-2">Download Feedback Data:</p>
              <button 
                onClick={downloadFeedbacksCSV} 
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm flex items-center justify-center gap-2"
              >
                <FaDownload size={14} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-white/10 bg-cafe">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            onKeyDown={handleKeyPress} 
            placeholder="Type your message..." 
            className="flex-1 bg-white/5 rounded-lg px-4 py-2 outline-none text-cafe-accent-l" 
          />
          <button 
            onClick={handleSendMessage} 
            className="bg-amber-500 text-black p-2 rounded-lg hover:opacity-90 transition"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
          animation: bounce 0.5s infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default Chatbot;