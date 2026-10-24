import httpx
from typing import Dict, Any
from app.core.config import settings
from app.models.models import HealthScheme

# Top 10 Indian Languages metadata
SUPPORTED_INDIAN_LANGUAGES = {
    "hi": {"name": "Hindi", "native": "हिन्दी", "script": "Devanagari"},
    "bn": {"name": "Bengali", "native": "বাংলা", "script": "Bengali"},
    "mr": {"name": "Marathi", "native": "मराठी", "script": "Devanagari"},
    "te": {"name": "Telugu", "native": "తెలుగు", "script": "Telugu"},
    "ta": {"name": "Tamil", "native": "தமிழ்", "script": "Tamil"},
    "gu": {"name": "Gujarati", "native": "ગુજરાતી", "script": "Gujarati"},
    "ur": {"name": "Urdu", "native": "اردو", "script": "Urdu"},
    "kn": {"name": "Kannada", "native": "ಕನ್ನಡ", "script": "Kannada"},
    "or": {"name": "Odia", "native": "ଓଡ଼ିଆ", "script": "Odia"},
    "ml": {"name": "Malayalam", "native": "മലയാളം", "script": "Malayalam"},
    "pa": {"name": "Punjabi", "native": "ਪੰਜਾਬੀ", "script": "Gurmukhi"},
    "en": {"name": "English", "native": "English", "script": "Latin"},
}

# High-quality factual knowledge base for offline fallback (100% reliable without external key)
OFFLINE_EXPLANATIONS = {
    "Ayushman Bharat PM-JAY": {
        "en": {
            "summary_simple": "PM-JAY provides cashless health coverage of up to ₹5 lakh per family per year for secondary and tertiary hospitalization in empaneled public and private hospitals across India.",
            "who_can_apply": "Families listed in the SECC 2011 database and designated low-income or vulnerable categories. No cap on family size or age.",
            "key_benefits": "Covers medical examinations, treatment, consultation, pre and post-hospitalization expenses, medicines, diagnostic tests, and food services during hospital stay.",
            "how_to_access": "1. Check your name at mera.pmjay.gov.in or call 14555.\n2. Visit the Ayushman Mitra help desk at any empaneled hospital with Aadhaar or Ration Card.\n3. Get your Ayushman Card generated for instant cashless treatment."
        },
        "hi": {
            "summary_simple": "आयुष्मान भारत (PM-JAY) पात्र परिवारों को सरकारी और सूचीबद्ध निजी अस्पतालों में गंभीर बीमारियों के इलाज के लिए हर साल प्रति परिवार ₹5 लाख तक का मुफ़्त कैशलेस स्वास्थ्य बीमा देता है।",
            "who_can_apply": "SECC 2011 सूची में शामिल गरीब और वंचित परिवार। परिवार के सदस्यों की संख्या और उम्र की कोई सीमा नहीं है।",
            "key_benefits": "अस्पताल में भर्ती होने का खर्च, दवाइयाँ, डॉक्टर की फीस, सर्जरी और जाँच का सारा खर्च योजना में शामिल है।",
            "how_to_access": "1. mera.pmjay.gov.in पर या 14555 पर कॉल करके पात्रता जाँचें।\n2. आधार कार्ड या राशन कार्ड लेकर किसी भी सूचीबद्ध अस्पताल के आयुष्मान मित्र काउंटर पर जाएँ।\n3. अपना आयुष्मान कार्ड बनवाएँ और मुफ़्त इलाज पाएँ।"
        },
        "bn": {
            "summary_simple": "আয়ুষ্মান ভারত (PM-JAY) প্রকল্পের মাধ্যমে যোগ্য পরিবারগুলি ভারতের তালিকাভুক্ত সরকারি ও বেসরকারি হাসপাতালে সেকেন্ডারি ও টারশিয়ারি চিকিৎসার জন্য বার্ষিক পরিবার পিছু ₹৫ লক্ষ পর্যন্ত বিনামূল্যে ক্যাশলেস স্বাস্থ্য পরিষেবা পায়।",
            "who_can_apply": "SECC ২০১১ তালিকায় অন্তর্ভুক্ত অর্থনৈতিকভাবে পিছিয়ে পড়া পরিবার। পরিবারের সদস্য সংখ্যা বা বয়সের কোনো ঊর্ধ্বসীমা নেই।",
            "key_benefits": "হাসপাতালে ভর্তি, অস্ত্রোপচার, ওষুধ, ডায়াগনস্টিক পরীক্ষা এবং খাবার খরচ বিনামূল্যে প্রদান করা হয়।",
            "how_to_access": "১. mera.pmjay.gov.in বা ১৪৫৫৫ নম্বরে ফোন করে যোগ্যতা যাচাই করুন।\n২. আধার বা রেশন কার্ড নিয়ে যেকোনো তালিকাভুক্ত হাসপাতালের আয়ুষ্মান মিত্র ডেস্কে যান।\n৩. তাৎক্ষণিক ক্যাশলেস চিকিৎসার জন্য আয়ুষ্মান কার্ড সংগ্রহ করুন।"
        },
        "mr": {
            "summary_simple": "आयुष्मान भारत (PM-JAY) योजनेअंतर्गत पात्र कुटुंबांना सूचीबद्ध शासकीय व खाजगी रुग्णालयांमध्ये दरवर्षी प्रति कुटुंब ₹५ लाखांपर्यंत मोफत कॅशलेस उपचार मिळतात.",
            "who_can_apply": "SECC २०११ यादीतील वंचित व दुर्बल कुटुंबे. कुटुंबातील सदस्यांच्या संख्येवर किंवा वयावर कोणतीही मर्यादा नाही.",
            "key_benefits": "रुग्णालय भरती, शस्त्रक्रिया, औषधे, तपासणी आणि उपचारांचा संपूर्ण खर्च समाविष्ट.",
            "how_to_access": "१. mera.pmjay.gov.in वर किंवा १४५५५ वर कॉल करून पात्रता तपासा.\n२. आधार किंवा रेशन कार्ड घेऊन जवळच्या रुग्णालयातील आयुष्मान मित्राशी संपर्क साधा.\n३. आयुष्मान कार्ड मिळवून मोफत उपचार सुरू करा."
        },
        "te": {
            "summary_simple": "ఆయుష్మాన్ భారత్ (PM-JAY) పథకం ద్వారా అర్హులైన కుటుంబాలకు నమోదిత ప్రభుత్వ, ప్రైవేట్ ఆసుపత్రులలో చికిత్సల కోసం సంవత్సరానికి గరిష్టంగా ₹5 లక్షల వరకు ఉచిత క్యాష్‌లెస్ ఆరోగ్య బీమా లభిస్తుంది.",
            "who_can_apply": "SECC 2011 జాబితాలోని పేద, బలహీన కుటుంబాలు. కుటుంబ పరిమాణం లేదా వయస్సుపై ఎలాంటి పరిమితి లేదు.",
            "key_benefits": "ఆసుపత్రిలో చేరిక, శస్త్రచికిత్సలు, పరీక్షలు, మందులు మరియు ఆహార ఖర్చులు అన్నీ కవర్ చేయబడతాయి.",
            "how_to_access": "1. mera.pmjay.gov.in లేదా 14555 నంబర్‌కు కాల్ చేసి అర్హత తనిఖీ చేయండి.\n2. ఆధార్ లేదా రేషన్ కార్డుతో ఆసుపత్రిలోని ఆయుష్మాన్ మిత్ర డెస్క్‌ను సంప్రదించండి.\n3. ఆయుష్మాన్ కార్డు పొంది ఉచిత చికిత్స పొందండి."
        },
        "ta": {
            "summary_simple": "ஆயுஷ்மான் பாரத் (PM-JAY) திட்டம் மூலம் தகுதியுடைய குடும்பங்களுக்கு அங்கீகரிக்கப்பட்ட அரசு மற்றும் தனியார் மருத்துவமனைகளில் சிகிச்சைக்கு ஆண்டிற்கு ₹5 லட்சம் வரை இலவச ரொக்கமில்லா காப்பீடு வழங்கப்படுகிறது.",
            "who_can_apply": "SECC 2011 பட்டியலில் உள்ள ஏழை மற்றும் எளிய குடும்பங்கள். குடும்ப உறுப்பினர் எண்ணிக்கைக்கு உச்சவரம்பு இல்லை.",
            "key_benefits": "மருத்துவமனை அனுமதி, அறுவை சிகிச்சை, மருந்துகள், பரிசோதனைகள் மற்றும் படுக்கை கட்டணம் இலவசம்.",
            "how_to_access": "1. mera.pmjay.gov.in அல்லது 14555 எண்ணை அழைத்து தகுதியை சரிபார்க்கவும்.\n2. ஆதார் அல்லது குடும்ப அட்டையுடன் மருத்துவமனை ஆயுஷ்மான் மித்ரா மையத்தை அணுகவும்.\n3. ஆயுஷ்மான் அட்டையைப் பெற்று இலவச சிகிச்சை பெறவும்."
        },
        "gu": {
            "summary_simple": "આયુષ્માન ભારત (PM-JAY) યોજના હેઠળ પાત્ર પરિવારોને માન્ય સરકારી અને ખાનગી હોસ્પિટલોમાં સેકન્ડરી અને ટર્શિયરી સારવાર માટે વાર્ષિક પ્રતિ પરિવાર ₹5 લાખ સુધીની મફત કેશલેસ સુવિધા મળે છે.",
            "who_can_apply": "SECC 2011 યાદીમાં સમાવિષ્ટ ગરીબ પરિવારો. પરિવારના સભ્યોની સંખ્યા કે ઉંમરની કોઈ મર્યાદા નથી.",
            "key_benefits": "હોસ્પિટલમાં દાખલ થવાનો ખર્ચ, સર્જરી, દવાઓ અને લેબ ટેસ્ટનો તમામ ખર્ચ સામેલ છે.",
            "how_to_access": "1. mera.pmjay.gov.in અથવા 14555 પર કૉલ કરીને પાત્રતા ચકાસો.\n2. આધાર કાર્ડ અથવા રેશનકાર્ડ સાથે હોસ્પિટલના આયુષ્માન મિત્ર કાઉન્ટર પર જાઓ.\n3. આયુષ્માન કાર્ડ મેળવી કેશલેસ સારવાર મેળવો."
        },
        "ur": {
            "summary_simple": "آیوشمان بھارت (PM-JAY) اسکیم کے تحت اہل خاندانوں کو درج فہرست سرکاری اور نجی ہسپتالوں میں ثانوی اور اعلیٰ علاج کے لیے سالانہ ₹5 لاکھ تک کا مفت کیش لیس ہیلتھ کور فراہم کیا جاتا ہے۔",
            "who_can_apply": "SECC 2011 فہرست میں شامل غریب اور کمزور خاندان۔ خاندان کے افراد کی تعداد یا عمر کی کوئی حد نہیں۔",
            "key_benefits": "ہسپتال میں داخلہ، سرجری، ادویات، ٹیسٹ اور قیام کے اخراجات اسکیم میں شامل ہیں۔",
            "how_to_access": "1. mera.pmjay.gov.in پر یا 14555 پر کال کر کے اہلیت چیک کریں۔\n2. آدھار یا راشن کارڈ کے ساتھ ہسپتال کے آیوشمان مترا کاؤنٹر سے رابطہ کریں۔\n3. آیوشمان کارڈ حاصل کریں اور مفت علاج پائیں۔"
        },
        "kn": {
            "summary_simple": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ (PM-JAY) ಯೋಜನೆಯು ಅರ್ಹ ಕುಟುಂಬಗಳಿಗೆ ನೊಂದಾಯಿತ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ದ್ವಿತೀಯ ಮತ್ತು ತೃತೀಯ ಹಂತದ ಚಿಕಿತ್ಸೆಗಾಗಿ ವರ್ಷಕ್ಕೆ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ₹5 ಲಕ್ಷದವರೆಗೆ ಉಚಿತ ನಗದುರಹಿತ ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಒದಗಿಸುತ್ತದೆ.",
            "who_can_apply": "SECC 2011 ಪಟ್ಟಿಯಲ್ಲಿರುವ ಬಡ ಮತ್ತು ದುರ್ಬಲ ಕುಟುಂಬಗಳು. ಕುಟುಂಬದ ಗಾತ್ರ ಅಥವಾ ವಯಸ್ಸಿನ ಯಾವುದೇ ಮಿತಿ ಇರುವುದಿಲ್ಲ.",
            "key_benefits": "ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿ, ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ, ಔಷಧಗಳು, ತಪಾಸಣೆ ಮತ್ತು ಚಿಕಿತ್ಸಾ ವೆಚ್ಚಗಳು ಸಂಪೂರ್ಣ ಉಚಿತ.",
            "how_to_access": "1. mera.pmjay.gov.in ಅಥವಾ 14555 ಗೆ ಕರೆ ಮಾಡಿ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ.\n2. ಆಧಾರ್ ಅಥವಾ ರೇಷನ್ ಕಾರ್ಡ್‌ನೊಂದಿಗೆ ಆಯುಷ್ಮಾನ್ ಮಿತ್ರ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.\n3. ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್ ಪಡೆದು ಉಚಿತ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ."
        },
        "or": {
            "summary_simple": "ଆୟୁଷ୍ମାନ ଭାରତ (PM-JAY) ଯୋଜନା ଅଧୀନରେ ଯୋଗ୍ୟ ପରିବାରଗୁଡ଼ିକୁ ତାଲିକାଭୁକ୍ତ ସରକାରୀ ଓ ଘରୋଇ ଡାକ୍ତରଖାନାରେ ଚିକିତ୍ସା ପାଇଁ ବାର୍ଷିକ ₹୫ ଲକ୍ଷ ପର୍ଯ୍ୟନ୍ତ ମାଗଣା କ୍ୟାସଲେସ ସ୍ୱାସ୍ଥ୍ୟ ସୁବିଧା ମିଳିଥାଏ।",
            "who_can_apply": "SECC ୨୦୧୧ ତାଲିକାରେ ଥିବା ଗରିବ ଏବଂ ଆର୍ଥିକ ଦୃଷ୍ଟିରୁ ଅନଗ୍ରସର ପରିବାର। ପରିବାରର ସଦସ୍ୟ ସଂଖ୍ୟା ଉପରେ କୌଣସି ସୀମା ନାହିଁ।",
            "key_benefits": "ଡାକ୍ତରଖାନାରେ ଭର୍ତ୍ତି, ଅସ୍ତ୍ରୋପଚାର, ଔଷଧ ଏବଂ ରକ୍ତ ପରୀକ୍ଷା ଆଦିର ସମ୍ପୂର୍ଣ୍ଣ ଖର୍ଚ୍ଚ ଏଥିରେ ସାମିଲ।",
            "how_to_access": "୧. mera.pmjay.gov.in କିମ୍ବା ୧୪୫୫୫ କଲ୍ କରି ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ।\n୨. ଆଧାର କାର୍ଡ କିମ୍ବା ରାସନ କାର୍ଡ ଧରି ଡାକ୍ତରଖାନାର ଆୟୁଷ୍ମାନ ମିତ୍ର ଡେସ୍କକୁ ଯାଆନ୍ତୁ।\n୩. ଆୟୁଷ୍ମାନ କାର୍ଡ ପାଇ ମାଗଣା ଚିକିତ୍ସା କରାନ୍ତୁ।"
        },
        "ml": {
            "summary_simple": "ആയുഷ്മാൻ ഭാരത് (PM-JAY) പദ്ധതി വഴി അർഹരായ കുടുംബങ്ങൾക്ക് എംപാനൽ ചെയ്ത ആശുപത്രികളിൽ സെക്കൻഡറി, ടെർഷ്യറി ചികിത്സകൾക്കായി പ്രതിവർഷം ₹5 ലക്ഷം രൂപ വരെ സൗജന്യ ക്യാഷ്‌ലെസ്സ് ചികിത്സ ലഭിക്കുന്നു.",
            "who_can_apply": "SECC 2011 പട്ടികയിലുള്ള പാവപ്പെട്ട കുടുംബങ്ങൾ. കുടുംബാംഗങ്ങളുടെ എണ്ണത്തിനോ പ്രായത്തിനോ പരിധിയില്ല.",
            "key_benefits": "ആശുപത്രി അഡ്മിഷൻ, ശസ്ത്രക്രിയകൾ, മരുന്നുകൾ, പരിശോധനകൾ എന്നിവ സൗജന്യമായി ലഭിക്കുന്നു.",
            "how_to_access": "1. mera.pmjay.gov.in വഴിയോ 14555 എന്ന നമ്പറിലോ വിളിച്ച് അർഹത പരിശോധിക്കുക.\n2. ആധാർ അല്ലെങ്കിൽ റേഷൻ കാർഡുമായി ആശുപത്രിയിലെ ആയുഷ്മാൻ മിത്ര ഡെസ്ക് സന്ദർശിക്കുക.\n3. ആയുഷ്മാൻ കാർഡ് സ്വന്തമാക്കി സൗജന്യ ചികിത്സ നേടുക."
        },
        "pa": {
            "summary_simple": "ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ (PM-JAY) ਯੋਜਨਾ ਤਹਿਤ ਯੋਗ ਪਰਿਵਾਰਾਂ ਨੂੰ ਸੂਚੀਬੱਧ ਸਰਕਾਰੀ ਅਤੇ ਪ੍ਰਾਈਵੇਟ ਹਸਪਤਾਲਾਂ ਵਿੱਚ ਸੈਕੰਡਰੀ ਅਤੇ ਤੀਜੇ ਦਰਜੇ ਦੇ ਇਲਾਜ ਲਈ ਸਾਲਾਨਾ ₹5 ਲੱਖ ਤੱਕ ਦਾ ਮੁਫ਼ਤ ਕੈਸ਼ਲੈੱਸ ਸਿਹਤ ਬੀਮਾ ਮਿਲਦਾ ਹੈ।",
            "who_can_apply": "SECC 2011 ਸੂਚੀ ਵਿੱਚ ਸ਼ਾਮਲ ਗਰੀਬ ਪਰਿਵਾਰ। ਪਰਿਵਾਰ ਦੇ ਮੈਂਬਰਾਂ ਦੀ ਗਿਣਤੀ ਜਾਂ ਉਮਰ ਦੀ ਕੋਈ ਹੱਦ ਨਹੀਂ ਹੈ।",
            "key_benefits": "ਹਸਪਤਾਲ ਦਾਖਲਾ, ਸਰਜਰੀ, ਦਵਾਈਆਂ, ਟੈਸਟ ਅਤੇ ਖਾਣ-ਪੀਣ ਦਾ ਸਾਰਾ ਖ਼ਰਚਾ ਯੋਜਨਾ ਵਿੱਚ ਸ਼ਾਮਲ ਹੈ।",
            "how_to_access": "1. mera.pmjay.gov.in 'ਤੇ ਜਾਂ 14555 'ਤੇ ਕਾਲ ਕਰਕੇ ਯੋਗਤਾ ਚੈੱਕ ਕਰੋ।\n2. ਆਧਾਰ ਕਾਰਡ ਜਾਂ ਰਾਸ਼ਨ ਕਾਰਡ ਲੈ ਕੇ ਹਸਪਤਾਲ ਦੇ ਆਯੁਸ਼ਮਾਨ ਮਿੱਤਰ ਡੈਸਕ 'ਤੇ ਜਾਓ।\n3. ਆਯੁਸ਼ਮਾਨ ਕਾਰਡ ਬਣਵਾਓ ਅਤੇ ਮੁਫ਼ਤ ਇਲਾਜ ਪਾਓ।"
        }
    },
    "e-Sanjeevani": {
        "en": {
            "summary_simple": "e-Sanjeevani is India's national telemedicine service enabling citizens to consult registered government doctors and specialists for free from home using a smartphone or computer.",
            "who_can_apply": "Every citizen of India. No income limit or prior card required.",
            "key_benefits": "Free online doctor consultations, instant digital prescriptions, guidance for follow-up care, and reduced need to travel to crowded clinics.",
            "how_to_access": "1. Open esanjeevani.mohfw.gov.in or download the eSanjeevani app.\n2. Register with your mobile number and OTP.\n3. Select your state and token, wait for doctor call, and download your e-prescription."
        },
        "hi": {
            "summary_simple": "ई-संजीवनी भारत सरकार की मुफ़्त राष्ट्रीय टेलीमेडिसिन सेवा है। इसके जरिए आप घर बैठे मोबाइल या कंप्यूटर से सरकारी डॉक्टरों और विशेषज्ञों से मुफ़्त परामर्श ले सकते हैं।",
            "who_can_apply": "भारत का कोई भी नागरिक। किसी आय प्रमाण पत्र या विशेष कार्ड की आवश्यकता नहीं है।",
            "key_benefits": "मुफ़्त ऑनलाइन परामर्श, डिजिटल पर्चा (prescription), और बिना अस्पताल जाए विशेषज्ञ डॉक्टर की सलाह।",
            "how_to_access": "1. esanjeevani.mohfw.gov.in पर जाएँ या eSanjeevani ऐप डाउनलोड करें।\n2. मोबाइल नंबर और OTP से लॉग इन करें।\n3. टोकन लें, डॉक्टर से वीडियो कॉल पर बात करें और पर्चा डाउनलोड करें।"
        },
        "bn": {
            "summary_simple": "ই-সঞ্জীবনী হলো ভারত সরকারের একটি জাতীয় টেলিমেডিসিন পরিষেবা, যার মাধ্যমে নাগরিকরা ঘরে বসেই মোবাইল বা কম্পিউটারের মাধ্যমে সরকারি বিশেষজ্ঞ চিকিৎসকদের কাছ থেকে বিনামূল্যে পরামর্শ নিতে পারেন।",
            "who_can_apply": "ভারতের যেকোনো নাগরিক। কোনো আয়সীমা বা পূর্ববর্তী কার্ডের প্রয়োজন নেই।",
            "key_benefits": "বিনামূল্যে অনলাইন ডাক্তার পরামর্শ, ডিজিটাল প্রেসক্রিপশন এবং হাসপাতালে না গিয়েও উন্নত চিকিৎসা সহায়তা।",
            "how_to_access": "১. esanjeevani.mohfw.gov.in খুলুন অথবা অ্যাপ ডাউনলোড করুন।\n২. মোবাইল নম্বর এবং ওটিপি দিয়ে নিবন্ধন করুন।\n৩. টোকেন নিয়ে চিকিৎসকের সাথে কথা বলুন এবং প্রেসক্রিপশন ডাউনলোড করুন।"
        },
        "mr": {
            "summary_simple": "ई-संजीवनी ही भारत सरकारची राष्ट्रीय टेलिमेडिसिन सेवा आहे ज्याद्वारे नागरिक घरी बसून सरकारी डॉक्टर व तज्ज्ञांचा मोफत सल्ला मोबाईलद्वारे घेऊ शकतात.",
            "who_can_apply": "भारताचा कोणताही नागरिक. कोणत्याही उत्पन्नाची अट नाही.",
            "key_benefits": "मोफत व्हिडिओ कन्सल्टेशन, तात्काळ डिजिटल प्रिस्क्रिप्शन आणि दवाखान्यात जाण्याची गरज नाही.",
            "how_to_access": "१. esanjeevani.mohfw.gov.in उघडा किंवा अॅप डाउनलोड करा.\n२. मोबाईल नंबर आणि ओटीपीने नोंदणी करा.\n३. टोकन मिळवा, डॉक्टरांशी बोला आणि ई-प्रिस्क्रिप्शन डाउनलोड करा."
        },
        "te": {
            "summary_simple": "ఇ-సంజీవని అనేది భారతదేశ జాతీయ టెలిమెడిసిన్ సేవ, దీని ద్వారా పౌరులు తమ స్మార్ట్‌ఫోన్ ద్వారా ఇంటి నుంచే ప్రభుత్వ వైద్యులు, నిపుణులను ఉచితంగా సంప్రదించవచ్చు.",
            "who_can_apply": "భారత పౌరులందరూ అర్హులే. ఎటువంటి ఆదాయ పరిమితి లేదు.",
            "key_benefits": "ఉచిత ఆన్‌లైన్ డాక్టర్ సంప్రదింపులు, తక్షణ డిజిటల్ ప్రిస్క్రిప్షన్లు మరియు సులభతర వైద్య సేవలు.",
            "how_to_access": "1. esanjeevani.mohfw.gov.in తెరవండి లేదా యాప్‌ను డౌన్‌లోడ్ చేసుకోండి.\n2. మొబైల్ నంబర్ మరియు OTP తో నమోదు చేసుకోండి.\n3. టోకెన్ తీసుకొని డాక్టర్‌తో మాట్లాడి ప్రిస్క్రిప్షన్ పొందండి."
        },
        "ta": {
            "summary_simple": "இ-சஞ்சீவனி என்பது அரசு மருத்துவர்களிடம் வீட்டிலிருந்தே ஸ்மார்ட்போன் மூலம் இலவசமாக ஆலோசனை பெற உதவும் மத்திய அரசின் தேசிய தொலைமருத்துவ சேவையாகும்.",
            "who_can_apply": "இந்திய குடிமக்கள் அனைவரும். வருமான வரம்பு எதுவும் இல்லை.",
            "key_benefits": "இலவச ஆன்லைன் மருத்துவ ஆலோசனை, உடனடி டிஜிட்டல் மருந்துச்சீட்டு மற்றும் விரைவான சேவை.",
            "how_to_access": "1. esanjeevani.mohfw.gov.in இணையதளம் அல்லது செயலியைப் பதிவிறக்கவும்.\n2. மொபைல் எண் மற்றும் OTP மூலம் பதிவு செய்யவும்.\n3. டோக்கன் பெற்று மருத்துவரிடம் பேசி மருந்துச்சீட்டைப் பதிவிறக்கவும்."
        },
        "gu": {
            "summary_simple": "ઇ-સંજીવની ભારત સરકારની રાષ્ટ્રીય ટેલીમેડિસિન સેવા છે, જેના દ્વારા નાગરિકો ઘરે બેઠા સ્માર્ટફોનથી સરકારી ડોકટરો પાસેથી મફત તબીબી સલાહ મેળવી શકે છે.",
            "who_can_apply": "ભારતના તમામ નાગરિકો. કોઈ આવક મર્યાદા નથી.",
            "key_benefits": "મફત ઓનલાઇન ડોક્ટર કન્સલ્ટેશન, તાત્કાલિક ડિજિટલ પ્રિસ્ક્રિપ્શન અને મુસાફરી વગર સારવાર.",
            "how_to_access": "1. esanjeevani.mohfw.gov.in ખોલો અથવા એપ ડાઉનલોડ કરો.\n2. મોબાઈલ નંબર અને ઓટીપીથી રજીસ્ટર કરો.\n3. ટોકન મેળવો, ડોક્ટર સાથે વાત કરો અને દવાઓની ચિઠ્ઠી ડાઉનલોડ કરો."
        },
        "ur": {
            "summary_simple": "ای-سنجیوانی حکومت ہند کی قومی ٹیلی میڈیسن سروس ہے جس کے ذریعے شہری گھر بیٹھے اسمارٹ فون کے ذریعے سرکاری ڈاکٹروں سے مفت مشورہ حاصل کر سکتے ہیں۔",
            "who_can_apply": "ہندوستان کا ہر شہری۔ آمدنی کی کوئی قید نہیں۔",
            "key_benefits": "مفت آن لائن ڈاکٹر کا مشورہ، فوری ڈیجیٹل نسخہ، اور سفر کی زحمت سے نجات۔",
            "how_to_access": "1. esanjeevani.mohfw.gov.in پر جائیں یا ایپ ڈاؤن لوڈ کریں۔\n2. موبائل نمبر اور او ٹی پی سے رجسٹر کریں۔\n3. ٹوکن لیں، ڈاکٹر سے رابطہ کریں اور نسخہ ڈاؤن لوڈ کریں۔"
        },
        "kn": {
            "summary_simple": "ಇ-ಸಂಜೀವಿನಿ ಭಾರತ ಸರ್ಕಾರದ ರಾಷ್ಟ್ರೀಯ ಟೆಲಿಮೆಡಿಸಿನ್ ಸೇವೆಯಾಗಿದ್ದು, ನಾಗರಿಕರು ಮನೆಯಲ್ಲೇ ಕುಳಿತು ಮೊಬೈಲ್ ಮೂಲಕ ನುರಿತ ಸರ್ಕಾರಿ ವೈದ್ಯರನ್ನು ಉಚಿತವಾಗಿ ಸಂಪರ್ಕಿಸಬಹುದು.",
            "who_can_apply": "ಭಾರತದ ಪ್ರತಿಯೊಬ್ಬ ನಾಗರಿಕರು. ಯಾವುದೇ ಆದಾಯ ಮಿತಿ ಇರುವುದಿಲ್ಲ.",
            "key_benefits": "ಉಚಿತ ಆನ್‌ಲೈನ್ ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆ, ತಕ್ಷಣದ ಡಿಜಿಟಲ್ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಮತ್ತು ತ್ವರಿತ ಸೇವೆ.",
            "how_to_access": "1. esanjeevani.mohfw.gov.in ತೆರೆಯಿರಿ ಅಥವಾ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.\n2. ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು OTP ಮೂಲಕ ನೋಂದಾಯಿಸಿ.\n3. ಟೋಕನ್ ಪಡೆದು ವೈದ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ."
        },
        "or": {
            "summary_simple": "ଇ-ସଞ୍ଜୀବନୀ ହେଉଛି ଭାରତ ସରକାରଙ୍କ ଏକ ଜାତୀୟ ଟେଲିମେଡିସିନ ସେବା, ଯାହା ମାଧ୍ୟମରେ ନାଗରିକମାନେ ଘରେ ବସି ମୋବାଇଲ ଯୋଗେ ସରକାରୀ ଡାକ୍ତରଙ୍କ ସହ ମାଗଣାରେ ପରାମର୍ଶ କରିପାରିବେ।",
            "who_can_apply": "ଭାରତର ପ୍ରତ୍ୟେକ ନାଗରିକ। କୌଣସି ଆୟ ସୀମା ନାହିଁ।",
            "key_benefits": "ମାଗଣା ଅନଲାଇନ୍ ଡାକ୍ତର ପରାମର୍ଶ, ଡିଜିଟାଲ୍ ପ୍ରେସକ୍ରିପସନ୍ ଏବଂ ସହଜ ସ୍ୱାସ୍ଥ୍ୟ ସେବା।",
            "how_to_access": "୧. esanjeevani.mohfw.gov.in ଖୋଲନ୍ତୁ ବା ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।\n୨. ମୋବାଇଲ୍ ନମ୍ବର ଏବଂ ଓଟିପି ଦ୍ୱାରା ପଞ୍ଜୀକରଣ କରନ୍ତୁ।\n୩. ଟୋକନ୍ ନେଇ ଡାକ୍ତରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ ଏବଂ ପ୍ରେସକ୍ରିପସନ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।"
        },
        "ml": {
            "summary_simple": "പൗരന്മാർക്ക് വീട്ടിലിരുന്ന് സ്മാർട്ട്‌ഫോൺ വഴി സർക്കാർ ഡോക്ടർമാരുമായി സൗജന്യമായി സംസാരിക്കാൻ സഹായിക്കുന്ന ദേശീയ ടെലിമെഡിസിൻ സേവനമാണ് ഇ-സഞ്ജീവനി.",
            "who_can_apply": "എല്ലാ ഇന്ത്യൻ പൗരന്മാർക്കും. വരുമാന പരിധിയില്ല.",
            "key_benefits": "സൗജന്യ ഓൺലൈൻ ഡോക്ടർ കൺസൾട്ടേഷൻ, തത്സമയ ഡിജിറ്റൽ കുറിപ്പടി, ആശുപത്രി യാത്രകൾ ഒഴിവാക്കൽ.",
            "how_to_access": "1. esanjeevani.mohfw.gov.in അല്ലെങ്കിൽ ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക.\n2. മൊബൈൽ നമ്പറും ഒടിപിയും ഉപയോഗിച്ച് രജിസ്റ്റർ ചെയ്യുക.\n3. ടോക്കൺ എടുത്ത് ഡോക്ടറോട് സംസാരിച്ച് പ്രിസ്ക്രിപ്ഷൻ ഡൗൺലോഡ് ചെയ്യുക."
        },
        "pa": {
            "summary_simple": "ਈ-ਸੰਜੀਵਨੀ ਭਾਰਤ ਸਰਕਾਰ ਦੀ ਕੌਮੀ ਟੈਲੀਮੈਡੀਸਨ ਸੇਵਾ ਹੈ ਜਿਸ ਰਾਹੀਂ ਨਾਗਰਿਕ ਘਰ ਬੈਠੇ ਮੋਬਾਈਲ ਰਾਹੀਂ ਸਰਕਾਰੀ ਡਾਕਟਰਾਂ ਤੋਂ ਮੁਫ਼ਤ ਸਲਾਹ ਲੈ ਸਕਦੇ ਹਨ।",
            "who_can_apply": "ਭਾਰਤ ਦਾ ਹਰ ਨਾਗਰਿਕ। ਆਮਦਨ ਦੀ ਕੋਈ ਹੱਦ ਨਹੀਂ।",
            "key_benefits": "ਮੁਫ਼ਤ ਆਨਲਾਈਨ ਡਾਕਟਰ ਸਲਾਹ, ਤੁਰੰਤ ਡਿਜੀਟਲ ਪਰਚੀ (ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ), ਅਤੇ ਹਸਪਤਾਲ ਜਾਣ ਦੀ ਲੋੜ ਨਹੀਂ।",
            "how_to_access": "1. esanjeevani.mohfw.gov.in ਖੋਲ੍ਹੋ ਜਾਂ ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ।\n2. ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ OTP ਨਾਲ ਰਜਿਸਟਰ ਕਰੋ।\n3. ਟੋਕਨ ਲਵੋ, ਡਾਕਟਰ ਨਾਲ ਗੱਲ ਕਰੋ ਅਤੇ ਪਰਚੀ ਡਾਊਨਲੋਡ ਕਰੋ।"
        }
    },
    "Janani Suraksha Yojana": {
        "en": {
            "summary_simple": "Janani Suraksha Yojana (JSY) is a safe motherhood intervention under the National Health Mission promoting institutional delivery among poor pregnant women through direct cash assistance.",
            "who_can_apply": "Eligible pregnant women, especially from BPL / SC / ST households delivering in government health facilities or accredited private hospitals.",
            "key_benefits": "Direct cash assistance (₹1,400 in rural areas and ₹1,000 in urban areas for low-performing states), free antenatal care, and transport support.",
            "how_to_access": "1. Register pregnancy at nearest Anganwadi or PHC.\n2. Contact your local ASHA worker.\n3. Deliver at a government or accredited hospital with your Mother & Child Protection (MCP) card."
        },
        "hi": {
            "summary_simple": "जननी सुरक्षा योजना (JSY) गर्भवती महिलाओं को सुरक्षित संस्थागत प्रसव (अस्पताल में डिलीवरी) को बढ़ावा देने के लिए आर्थिक सहायता प्रदान करती है।",
            "who_can_apply": "गरीब और ग्रामीण क्षेत्रों की गर्भवती महिलाएँ (BPL / SC / ST परिवारों को प्राथमिकता)।",
            "key_benefits": "सरकारी अस्पताल में डिलीवरी पर ग्रामीण क्षेत्र में ₹1,400 और शहरी क्षेत्र में ₹1,000 की नकद सहायता, मुफ़्त जाँच और दवाइयाँ।",
            "how_to_access": "1. पास के प्राथमिक स्वास्थ्य केंद्र (PHC) या आंगनवाड़ी में गर्भावस्था का पंजीकरण कराएँ।\n2. अपनी आशा (ASHA) कार्यकर्ता से संपर्क करें।\n3. MCP कार्ड के साथ अस्पताल में प्रसव कराएँ।"
        },
        "bn": {
            "summary_simple": "জননী সুরক্ষা যোজনা (JSY) হলো গর্ভবতী মহিলাদের নিরাপদ প্রসব ও হাসপাতালে প্রসবকে উৎসাহিত করতে আর্থিক সহায়তা প্রদানের একটি সরকারি প্রকল্প।",
            "who_can_apply": "দরিদ্র পরিবারের গর্ভবতী মহিলারা (BPL/SC/ST পরিবারের জন্য অগ্রাধিকার)।",
            "key_benefits": "হাসপাতালে প্রসবের জন্য গ্রামীণ অঞ্চলে ₹১,৪০০ এবং শহরাঞ্চলে ₹১,০০০ সরাসরি নগদ সহায়তা এবং বিনামূল্যে ওষুধ।",
            "how_to_access": "১. নিকটস্থ অঙ্গনওয়াড়ি বা স্বাস্থ্যকেন্দ্রে গর্ভাবস্থা নথিভুক্ত করুন।\n২. স্থানীয় আশা (ASHA) কর্মীর সাথে যোগাযোগ করুন।\n৩. এমসিপি কার্ড নিয়ে হাসপাতালে প্রসব করান।"
        },
        "mr": {
            "summary_simple": "जननी सुरक्षा योजना (JSY) ही गरोदर महिलांना सुरक्षित प्रसूती आणि शासकीय रुग्णालयात प्रसूतीस प्रोत्साहन देण्यासाठी थेट आर्थिक मदत देणारी योजना आहे.",
            "who_can_apply": "दारिद्र्यरेषेखालील (BPL/SC/ST) कुटुंबातील गरोदर महिला.",
            "key_benefits": "ग्रामीण भागात ₹१,४०० आणि शहरी भागात ₹१,००० ची थेट रोख मदत, मोफत औषधे व उपचार.",
            "how_to_access": "१. जवळच्या अंगणवाडी किंवा प्राथमिक आरोग्य केंद्रात नोंदणी करा.\n२. आशा (ASHA) सेविकेशी संपर्क साधा.\n३. रुग्णालयात प्रसूतीनंतर थेट बँक खात्यात मदत मिळवा."
        },
        "te": {
            "summary_simple": "జనని సురక్ష యోజన (JSY) గర్భిణీ స్త్రీలకు ఆసుపత్రులలో సురక్షిత ప్రసవాలను ప్రోత్సಹించడానికి నగదు సహాయం అందించే ప్రభుత్వ పథకం.",
            "who_can_apply": "పేద కుటుంబాల గర్భిణీ స్త్రీలు (BPL/SC/ST కుటుంబాలు).",
            "key_benefits": "గ్రామీణ ప్రాంతాల్లో ₹1,400, పట్టణ ప్రాంతాల్లో ₹1,000 నగదు సహాయం, ఉచిత ప్రసవ సంరక్షణ.",
            "how_to_access": "1. సమీపంలోని అంగన్‌వాడీ లేదా ప్రాథమిక ఆరోగ్య కేంద్రంలో నమోదు చేసుకోండి.\n2. ఆశా (ASHA) కార్యకర్తను సంప్రదించండి.\n3. ఆసుపత్రిలో ప్రసవం జరిపించి సహాయాన్ని పొందండి."
        },
        "ta": {
            "summary_simple": "ஜனனி சுரக்ஷா யோஜனா (JSY) என்பது கர்ப்பிணிப் பெண்களுக்கு மருத்துவமனைகளில் பாதுகாப்பான பிரசவத்தை ஊக்குவிக்க நேரடி பண உதவி வழங்கும் திட்டமாகும்.",
            "who_can_apply": "வறுமைக் கோட்டிற்கு கீழ் உள்ள கர்ப்பிணிப் பெண்கள் (BPL/SC/ST).",
            "key_benefits": "கிராமப்புறங்களில் ₹1,400 மற்றும் நகர்ப்புறங்களில் ₹1,000 நேரடி பண உதவி மற்றும் இலவசப் பிரசவ சிகிச்சை.",
            "how_to_access": "1. அருகிலுள்ள அங்கன்வாடி அல்லது ஆரம்ப சுகாதார நிலையத்தில் பதிவு செய்யவும்.\n2. ஆஷா (ASHA) பணியாளரைத் தொடர்பு கொள்ளவும்.\n3. அரசு மருத்துவமனையில் பிரசவித்து பண உதவியைப் பெறவும்."
        },
        "gu": {
            "summary_simple": "જનની સુરક્ષા યોજના (JSY) ગર્ભવતી મહિલાઓને હોસ્પિટલમાં સુરક્ષિત પ્રસૂતિ કરાવવા પ્રોત્સાહિત કરવા માટે રોકડ સહાય આપતી યોજના છે.",
            "who_can_apply": "ગરીબ અને ગ્રામીણ વિસ્તારની સગર્ભા મહિલાઓ (BPL/SC/ST).",
            "key_benefits": "ગ્રામીણ વિસ્તારમાં ₹1,400 અને શહેરી વિસ્તારમાં ₹1,000 ની સીધી રોકડ સહાય અને મફત સારવાર.",
            "how_to_access": "1. નજીકની આંગણવાડી કે આરોગ્ય કેન્દ્રમાં નોંધણી કરાવો.\n2. આશા (ASHA) વર્કરનો સંપર્ક કરો.\n3. હોસ્પિટલમાં ડિલિવરી કરાવી સહાય મેળવો."
        },
        "ur": {
            "summary_simple": "جننی سرکشا یوجنا (JSY) حاملہ خواتین کو ہسپتال میں محفوظ زچگی کو فروغ دینے کے لیے براہ راست مالی امداد فراہم کرتی ہے۔",
            "who_can_apply": "غریب اور پسماندہ خاندانوں کی حاملہ خواتین (BPL/SC/ST)۔",
            "key_benefits": "دیہی علاقوں میں ₹1,400 اور شہری علاقوں میں ₹1,000 نقد امداد اور مفت ادویات۔",
            "how_to_access": "1. قریبی آنگن واڑی یا پرائمری ہیلتھ سینٹر میں اندراج کروائیں۔\n2. آشا ورکر سے رابطہ کریں۔\n3. ہسپتال میں زچگی کروا کر نقد امداد حاصل کریں۔"
        },
        "kn": {
            "summary_simple": "ಜನನಿ ಸುರಕ್ಷಾ ಯೋಜನೆಯು (JSY) ಗರ್ಭಿಣಿಯರಿಗೆ ಸುರಕ್ಷಿತ ಹೆರಿಗೆ ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಹೆರಿಗೆಯನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಲು ನೇರ ನಗದು ನೆರವು ನೀಡುವ ಯೋಜನೆಯಾಗಿದೆ.",
            "who_can_apply": "ಬಡ ಕುಟುಂಬಗಳ ಗರ್ಭಿಣಿಯರು (BPL/SC/ST ಕುಟುಂಬಗಳು).",
            "key_benefits": "ಗ್ರಾಮೀಣ ಭಾಗದಲ್ಲಿ ₹1,400 ಮತ್ತು ನಗರ ಭಾಗದಲ್ಲಿ ₹1,000 ನೇರ ನಗದು ಸಹಾಯ ಹಾಗೂ ಉಚಿತ ಚಿಕಿತ್ಸೆ.",
            "how_to_access": "1. ಹತ್ತಿರದ ಅಂಗನವಾಡಿ ಅಥವಾ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ನೋಂದಾಯಿಸಿ.\n2. ಸ್ಥಳೀಯ ಆಶಾ (ASHA) ಕಾರ್ಯಕರ್ತೆಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.\n3. ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಹೆರಿಗೆ ಮಾಡಿಸಿ ಸಹಾಯಧನ ಪಡೆಯಿರಿ."
        },
        "or": {
            "summary_simple": "ଜନନୀ ସୁରକ୍ଷା ଯୋଜନା (JSY) ଗର୍ଭବତୀ ମହିଳାମାନଙ୍କୁ ଡାକ୍ତରଖାନାରେ ସୁରକ୍ଷିତ ପ୍ରସବ ପାଇଁ ଆର୍ଥିକ ପ୍ରୋତ୍ସାହନ ପ୍ରଦାନ କରୁଥିବା ଏକ ସରକାରୀ ଯୋଜନା।",
            "who_can_apply": "ଦାରିଦ୍ର୍ୟ ସୀମାରେଖା ତଳେ ଥିବା ଗର୍ଭବତୀ ମହିଳା (BPL/SC/ST)।",
            "key_benefits": "ଗ୍ରାମାଞ୍ଚଳରେ ₹୧,୪୦୦ ଏବଂ ସହରାଞ୍ଚଳରେ ₹୧,୦୦୦ ନଗଦ ସହାୟତା ଓ ମାଗଣା ଡାକ୍ତରୀ ସେବା।",
            "how_to_access": "୧. ନିକଟସ୍ଥ ଅଙ୍ଗନୱାଡି ବା ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ନାମ ପଞ୍ଜୀକରଣ କରନ୍ତୁ।\n୨. ଆଶା (ASHA) କର୍ମୀଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।\n୩. ଡାକ୍ତରଖାନାରେ ପ୍ରସବ କରାଇ ସହାୟତା ରାଶି ପାଆନ୍ତୁ।"
        },
        "ml": {
            "summary_simple": "ഗർഭിണികൾക്ക് സുരക്ഷിത പ്രസവത്തിനും ആശുപത്രികളിലെ പ്രസവം പ്രോത്സാഹിപ്പിക്കുന്നതിനുമായി സാമ്പത്തിക സഹായം നൽകുന്ന പദ്ധതിയാണ് ജനനി സുരക്ഷാ യോജന (JSY).",
            "who_can_apply": "സാമ്പത്തികമായി പിന്നാക്കം നിൽക്കുന്ന ഗർഭിണികൾ (BPL/SC/ST).",
            "key_benefits": "ഗ്രാമീണ മേഖലയിൽ ₹1,400 ഉം നഗരങ്ങളിൽ ₹1,000 ഉം നേരിട്ടുള്ള ധനസഹായവും സൗജന്യ ചികിത്സയും.",
            "how_to_access": "1. അടുത്തുള്ള അങ്കണവാടിയിലോ ആരോഗ്യകേന്ദ്രത്തിലോ പേര് രജിസ്റ്റർ ചെയ്യുക.\n2. ആശാ (ASHA) വർക്കറുമായി ബന്ധപ്പെടുക.\n3. ആശുപത്രിയിൽ പ്രസവം നടത്തുകയും സഹായം നേടുകയും ചെയ്യുക."
        },
        "pa": {
            "summary_simple": "ਜਨਨੀ ਸੁਰੱਖਿਆ ਯੋਜਨਾ (JSY) ਗਰਭਵਤੀ ਔਰਤਾਂ ਨੂੰ ਹਸਪਤਾਲ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਜਣੇਪੇ ਨੂੰ ਉਤਸ਼ਾਹਿਤ ਕਰਨ ਲਈ ਸਿੱਧੀ ਨਕਦੀ ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ।",
            "who_can_apply": "ਗਰੀਬ ਪਰਿਵਾਰਾਂ ਦੀਆਂ ਗਰਭਵਤੀ ਔਰਤਾਂ (BPL/SC/ST)।",
            "key_benefits": "ਪੇਂਡੂ ਖੇਤਰਾਂ ਵਿੱਚ ₹1,400 ਅਤੇ ਸ਼ਹਿਰੀ ਖੇਤਰਾਂ ਵਿੱਚ ₹1,000 ਦੀ ਨਕਦ ਸਹਾਇਤਾ ਅਤੇ ਮੁਫ਼ਤ ਦਵਾਈਆਂ।",
            "how_to_access": "1. ਨੇੜਲੇ ਆਂਗਣਵਾੜੀ ਜਾਂ ਸਿਹਤ ਕੇਂਦਰ ਵਿੱਚ ਰਜਿਸਟਰੇਸ਼ਨ ਕਰਵਾਓ।\n2. ਆਪਣੀ ਆਸ਼ਾ (ASHA) ਵਰਕਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।\n3. ਹਸਪਤਾਲ ਵਿੱਚ ਜਣੇਪਾ ਕਰਵਾਓ ਅਤੇ ਸਹਾਇਤਾ ਰਾਸ਼ੀ ਪ੍ਰਾਪਤ ਕਰੋ।"
        }
    }
}

async def explain_scheme_simple(scheme: HealthScheme, language: str = "en") -> Dict[str, Any]:
    # Normalize language code to supported set, default to en
    target_code = language.lower().strip() if language else "en"
    lang_info = SUPPORTED_INDIAN_LANGUAGES.get(target_code, SUPPORTED_INDIAN_LANGUAGES["en"])
    lang_code = target_code if target_code in SUPPORTED_INDIAN_LANGUAGES else "en"
    
    # Try Gemini API if key is present
    if settings.GEMINI_API_KEY:
        try:
            lang_label = f"{lang_info['name']} ({lang_info['native']}, {lang_info['script']} script)"
            prompt = f"""
You are Sehat Saathi, a helpful, empathetic public health guide for SehatSetu India.
Explain the following health scheme in plain, easily understood {lang_label}.
Do NOT give medical diagnosis or treatment advice.
Base your explanation STRICTLY on these verified scheme details:
Scheme Name: {scheme.name}
Description: {scheme.short_description}
Target Audience: {scheme.target_audience}
Benefits: {scheme.benefits}
Required Documents: {scheme.required_documents}
Official Portal: {scheme.official_url}

Return JSON with exact keys:
"summary_simple": brief 2-sentence summary in plain language
"who_can_apply": clear bullet points of who qualifies
"key_benefits": main assistance provided
"how_to_access": step-by-step instructions to get benefits
"""
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                )
                if res.status_code == 200:
                    import json
                    text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    data = json.loads(text)
                    return {
                        "scheme_id": scheme.id,
                        "scheme_name": scheme.name,
                        "language": lang_code,
                        "language_name": lang_info["name"],
                        "native_name": lang_info["native"],
                        "summary_simple": data.get("summary_simple", scheme.short_description),
                        "who_can_apply": data.get("who_can_apply", scheme.target_audience),
                        "key_benefits": data.get("key_benefits", scheme.benefits),
                        "how_to_access": data.get("how_to_access", "Visit the official portal or nearest help desk."),
                        "official_url": scheme.official_url,
                        "source_disclaimer": f"AI-assisted plain language explanation ({lang_info['native']}). Always confirm rules and latest guidelines at the official government portal.",
                        "ai_generated": True
                    }
        except Exception:
            pass  # Seamless fallback to offline verified knowledge base

    # Offline knowledge base fallback
    fb = OFFLINE_EXPLANATIONS.get(scheme.name, {}).get(lang_code)
    if not fb:
        # Fallback to English if specific scheme language is missing
        fb = OFFLINE_EXPLANATIONS.get(scheme.name, {}).get("en")

    if not fb:
        # Default structured fallback using model fields
        fb = {
            "summary_simple": f"{scheme.name} is a verified Indian government healthcare program. {scheme.short_description}",
            "who_can_apply": scheme.target_audience,
            "key_benefits": scheme.benefits,
            "how_to_access": f"Visit official website {scheme.official_url} or contact your local public health center."
        }

    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "language": lang_code,
        "language_name": lang_info["name"],
        "native_name": lang_info["native"],
        "summary_simple": fb["summary_simple"],
        "who_can_apply": fb["who_can_apply"],
        "key_benefits": fb["key_benefits"],
        "how_to_access": fb["how_to_access"],
        "official_url": scheme.official_url,
        "source_disclaimer": f"Verified official summary ({lang_info['native']}). For legal eligibility guidelines, always refer to the official portal.",
        "ai_generated": False
    }
