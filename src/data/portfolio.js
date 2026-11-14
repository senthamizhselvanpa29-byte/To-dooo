// ============================================================
// 📈 PORTFOLIO + 🏦 LOANS — built-in types
//
// Names are in 5 languages, always in this order:
//     [ English, Tamil, Malayalam, Telugu, Hindi ]
//
// Investment `mode` = how VdoU knows today's value:
//   'rate'   → grows by itself from the interest rate (FD, RD, PPF…)
//   'units'  → units × price per unit (mutual fund NAV, share price)
//   'metal'  → grams × today's gold / silver rate (one rate for all)
//   'manual' → you type the value now and then (land, chit, LIC…)
// `compound` = how many times a year interest is added (FD / RD: 4)
// `monthly`  = can be paid every month (SIP, RD, PF…)
// `taxSaver` = counts for 80C by default; `askTax` = show the tick box
// `payout`   = can pay interest out to you instead of adding it
// `money`    = quick choice used when it also goes into daily Money
//
// Never change a `key` — saved investments and loans use it.
// ============================================================

export const INVESTMENT_TYPES = [
  { key: 'mf', emoji: '📈', mode: 'units', monthly: true, askTax: true, money: 'sip', example: 'SBI Bluechip Fund', name: ['Mutual fund', 'மியூச்சுவல் ஃபண்ட்', 'മ്യൂച്വൽ ഫണ്ട്', 'మ్యూచువల్ ఫండ్', 'म्यूचुअल फंड'] },
  { key: 'stocks', emoji: '📊', mode: 'units', monthly: true, money: 'stocks', example: 'Tata Motors', name: ['Shares / Stocks', 'பங்குகள்', 'ഓഹരികൾ', 'షేర్లు', 'शेयर'] },
  { key: 'gold', emoji: '🪙', mode: 'metal', monthly: true, money: 'gold', example: 'Gold coins', name: ['Gold', 'தங்கம்', 'സ്വർണ്ണം', 'బంగారం', 'सोना'] },
  { key: 'silver', emoji: '🥈', mode: 'metal', monthly: false, money: null, example: 'Silver plates', name: ['Silver', 'வெள்ளி', 'വെള്ളി', 'వెండి', 'चांदी'] },
  { key: 'fd', emoji: '🏦', mode: 'rate', compound: 4, monthly: false, askTax: true, payout: true, money: 'fd', example: 'HDFC Bank FD', name: ['Fixed Deposit (FD)', 'நிலை வைப்பு (FD)', 'സ്ഥിര നിക്ഷേപം (FD)', 'ఫిక్స్‌డ్ డిపాజిట్ (FD)', 'फ़िक्स्ड डिपॉज़िट (FD)'] },
  { key: 'rd', emoji: '🔁', mode: 'rate', compound: 4, monthly: true, money: 'fd', example: 'Post office RD', name: ['Recurring Deposit (RD)', 'தொடர் வைப்பு (RD)', 'ആവർത്തന നിക്ഷേപം (RD)', 'రికరింగ్ డిపాజిట్ (RD)', 'रेकरिंग डिपॉज़िट (RD)'] },
  { key: 'ppf', emoji: '🛡️', mode: 'rate', compound: 1, monthly: true, askTax: true, taxSaver: true, money: 'ppf', example: 'PPF – SBI', name: ['PPF', 'PPF', 'PPF', 'PPF', 'PPF'] },
  { key: 'epf', emoji: '👷', mode: 'rate', compound: 1, monthly: true, askTax: true, taxSaver: true, money: 'ppf', example: 'EPF – company', name: ['EPF / PF', 'EPF / PF', 'EPF / PF', 'EPF / PF', 'EPF / PF'] },
  { key: 'ssy', emoji: '👧', mode: 'rate', compound: 1, monthly: true, askTax: true, taxSaver: true, money: 'ppf', example: 'Sukanya – my daughter', name: ['Sukanya Samriddhi', 'சுகன்யா சம்ரித்தி', 'സുകന്യ സമൃദ്ധി', 'సుకన్య సమృద్ధి', 'सुकन्या समृद्धि'] },
  { key: 'postoffice', emoji: '📮', mode: 'rate', compound: 1, monthly: false, askTax: true, payout: true, money: 'fd', example: 'NSC', name: ['Post Office (NSC, KVP, MIS)', 'அஞ்சலகத் திட்டம் (NSC, KVP, MIS)', 'പോസ്റ്റ് ഓഫീസ് (NSC, KVP, MIS)', 'పోస్ట్ ఆఫీస్ (NSC, KVP, MIS)', 'पोस्ट ऑफ़िस (NSC, KVP, MIS)'] },
  { key: 'bonds', emoji: '📜', mode: 'rate', compound: 1, monthly: false, payout: true, money: null, example: 'RBI bonds', name: ['Bonds', 'பத்திரங்கள்', 'ബോണ്ടുകൾ', 'బాండ్లు', 'बॉन्ड'] },
  { key: 'nps', emoji: '🧓', mode: 'units', monthly: true, askTax: true, money: 'ppf', example: 'NPS Tier 1', name: ['NPS (pension)', 'NPS (ஓய்வூதியம்)', 'NPS (പെൻഷൻ)', 'NPS (పెన్షన్)', 'NPS (पेंशन)'] },
  { key: 'insurance', emoji: '🛟', mode: 'manual', monthly: true, askTax: true, money: null, example: 'LIC Jeevan Anand', name: ['Insurance savings (LIC, ULIP)', 'காப்பீட்டுச் சேமிப்பு (LIC, ULIP)', 'ഇൻഷുറൻസ് സമ്പാദ്യം (LIC, ULIP)', 'బీమా పొదుపు (LIC, ULIP)', 'बीमा बचत (LIC, ULIP)'] },
  { key: 'crypto', emoji: '₿', mode: 'units', monthly: true, money: null, example: 'Bitcoin', name: ['Crypto', 'கிரிப்டோ', 'ക്രിപ്റ്റോ', 'క్రిప్టో', 'क्रिप्टो'] },
  { key: 'chit', emoji: '🤝', mode: 'manual', monthly: true, money: null, example: 'Chit – 1 lakh group', name: ['Chit fund', 'சீட்டு', 'ചിട്ടി', 'చిట్టీ', 'चिट फंड'] },
  { key: 'land', emoji: '🏡', mode: 'manual', monthly: false, money: null, example: 'Plot in Madurai', name: ['Land / House', 'நிலம் / வீடு', 'ഭൂമി / വീട്', 'భూమి / ఇల్లు', 'ज़मीन / मकान'] },
  { key: 'other', emoji: '📦', mode: 'manual', monthly: true, money: null, example: '', name: ['Other', 'மற்றவை', 'മറ്റുള്ളവ', 'ఇతర', 'अन्य'] },
];

// ------------------------------------------------------------
// Loans. `style` = how it is usually repaid:
//   'emi'           → same amount every month (EMI)
//   'interest_only' → interest every month, loan amount at the end
//   'bullet'        → pay everything at the end (interest adds up)
//   'manual'        → you update the balance (credit card)
// `money` = quick choice under 🏦 EMI & Loans in daily Money
// ------------------------------------------------------------
export const LOAN_TYPES = [
  { key: 'home', emoji: '🏠', style: 'emi', money: 'homeloan', example: 'SBI', name: ['Home loan', 'வீட்டுக் கடன்', 'ഭവന വായ്പ', 'గృహ రుణం', 'होम लोन'] },
  { key: 'vehicle', emoji: '🚗', style: 'emi', money: 'vehicleloan', example: 'HDFC Bank', name: ['Vehicle loan', 'வாகனக் கடன்', 'വാഹന വായ്പ', 'వాహన రుణం', 'वाहन लोन'] },
  { key: 'personal', emoji: '👤', style: 'emi', money: 'personalloan', example: 'ICICI Bank', name: ['Personal loan', 'தனிநபர் கடன்', 'പേഴ്സണൽ ലോൺ', 'పర్సనల్ లోన్', 'पर्सनल लोन'] },
  { key: 'gold', emoji: '🪙', style: 'interest_only', money: 'personalloan', example: 'Muthoot Finance', name: ['Gold loan', 'நகைக் கடன்', 'സ്വർണ്ണ വായ്പ', 'గోల్డ్ లోన్', 'गोल्ड लोन'] },
  { key: 'education', emoji: '🎓', style: 'emi', money: null, example: 'Canara Bank', name: ['Education loan', 'கல்விக் கடன்', 'വിദ്യാഭ്യാസ വായ്പ', 'విద్యా రుణం', 'एजुकेशन लोन'] },
  { key: 'creditcard', emoji: '💳', style: 'manual', money: 'creditcard', example: 'Axis credit card', name: ['Credit card dues', 'கிரெடிட் கார்டு நிலுவை', 'ക്രെഡിറ്റ് കാർഡ് കുടിശ്ശിക', 'క్రెడిట్ కార్డ్ బకాయి', 'क्रेडिट कार्ड बकाया'] },
  { key: 'business', emoji: '🏪', style: 'emi', money: null, example: 'Bank of Baroda', name: ['Business loan', 'தொழில் கடன்', 'ബിസിനസ് ലോൺ', 'వ్యాపార రుణం', 'बिज़नेस लोन'] },
  { key: 'agri', emoji: '🌾', style: 'interest_only', money: null, example: 'Co-operative bank', name: ['Farm / KCC loan', 'விவசாயக் கடன் / KCC', 'കാർഷിക വായ്പ / KCC', 'వ్యవసాయ రుణం / KCC', 'कृषि लोन / KCC'] },
  { key: 'private', emoji: '🤝', style: 'interest_only', money: null, example: 'Ramesh (friend)', name: ['Private loan (with interest)', 'தனியார் வட்டிக் கடன்', 'സ്വകാര്യ പലിശ വായ്പ', 'ప్రైవేట్ వడ్డీ అప్పు', 'निजी ब्याज वाला कर्ज़'] },
  { key: 'consumer', emoji: '📱', style: 'emi', money: null, example: 'Bajaj Finserv', name: ['Consumer EMI (phone, TV…)', 'நுகர்வோர் EMI (போன், டிவி…)', 'കൺസ്യൂമർ EMI (ഫോൺ, ടിവി…)', 'కన్స్యూమర్ EMI (ఫోన్, టీవీ…)', 'कंज़्यूमर EMI (फ़ोन, टीवी…)'] },
  { key: 'other', emoji: '📦', style: 'emi', money: null, example: '', name: ['Other loan', 'மற்ற கடன்', 'മറ്റ് വായ്പ', 'ఇతర రుణం', 'अन्य लोन'] },
];

export const LOAN_STYLES = ['emi', 'interest_only', 'bullet', 'manual'];

// Colours for the "Where your money is" circle (biggest first)
export const ALLOCATION_COLOURS = ['#0084ff', '#00e676', '#ffc53d', '#ff5c5c', '#a855f7', '#00d2ff', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#94a3b8'];
