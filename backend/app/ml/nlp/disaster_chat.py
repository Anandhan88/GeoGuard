"""
GeoGuard AI - Multilingual RAG Chatbot (Module 9)
Queries database for current alerts, shelters, and risks, and responds in English, Tamil, and Hindi.
"""
from typing import Dict, Any, List
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Shelter, Alert, FloodPrediction, RiskZone
from app.services.routing_service import haversine

class DisasterRAGChatbot:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_response(self, query: str, lang: str = "en") -> str:
        """
        Process user query and return RAG-enhanced response in EN/TA/HI.
        """
        q = query.lower()
        
        # 1. Classify intent
        intent = "general"
        if any(w in q for w in ["shelter", "camp", "stay", "காப்பகம்", "நிவாரண", "आश्रय", "कैंप", "शरण"]):
            intent = "shelters"
        elif any(w in q for w in ["risk", "flood", "water", "level", "அபாயம்", "வெள்ளம்", "துயர்", "बाढ़", "खतरा", "पानी"]):
            intent = "risks"
        elif any(w in q for w in ["alert", "warning", "imd", "அறிவிப்பு", "எச்சரிக்கை", "चेतावनी", "अलर्ट"]):
            intent = "alerts"
        elif any(w in q for w in ["emergency", "contact", "phone", "help", "sos", "உதவி", "எண்", "आपातकालीन", "नंबर"]):
            intent = "emergency"
        elif any(w in q for w in ["safety", "precaution", "prepared", "பாதுகாப்பு", "முன்னெச்சரிக்கை", "सुरक्षा", "सावधानी"]):
            intent = "safety"

        # 2. Retrieve context from DB
        # Fetch shelters
        shelter_res = await self.db.execute(select(Shelter))
        shelters = shelter_res.scalars().all()
        
        # Fetch predictions
        pred_res = await self.db.execute(select(FloodPrediction).join(FloodPrediction.zone))
        predictions = pred_res.scalars().all()
        
        # Fetch alerts
        alert_res = await self.db.execute(select(Alert))
        alerts = alert_res.scalars().all()

        # 3. Formulate response based on intent and language
        if intent == "shelters":
            return self._build_shelters_response(shelters, lang)
        elif intent == "risks":
            return self._build_risks_response(predictions, lang)
        elif intent == "alerts":
            return self._build_alerts_response(alerts, lang)
        elif intent == "emergency":
            return self._build_emergency_response(lang)
        elif intent == "safety":
            return self._build_safety_response(lang)
        else:
            return self._build_general_response(lang)

    def _build_shelters_response(self, shelters: List[Shelter], lang: str) -> str:
        if not shelters:
            if lang == "ta": return "தற்போது எந்த நிவாரண முகாம்களும் பதிவாகவில்லை."
            if lang == "hi": return "वर्तमान में कोई राहत शिविर पंजीकृत नहीं हैं।"
            return "No emergency relief camps registered currently."
            
        if lang == "ta":
            res = "**அருகிலுள்ள அவசர நிவாரண முகாம்கள்:**\n\n"
            for s in shelters[:3]:
                avail = s.capacity - s.current_occupancy
                pct = round((s.current_occupancy / s.capacity) * 100)
                res += f"🏠 **{s.name}**\n   📍 {s.address or 'தமிழ்நாடு'}\n   👥 {avail} இடங்கள் கிடைக்கின்றன ({pct}% நிரம்பியுள்ளது)\n   ✅ வசதிகள்: {', '.join(s.amenities_json or [])}\n\n"
            res += "📞 வாகன உதவிக்கு மாவட்ட கட்டுப்பாட்டு அறையை தொடர்பு கொள்ளவும்."
            return res
            
        elif lang == "hi":
            res = "**निकटतम आपातकालीन राहत शिविर:**\n\n"
            for s in shelters[:3]:
                avail = s.capacity - s.current_occupancy
                pct = round((s.current_occupancy / s.capacity) * 100)
                res += f"🏠 **{s.name}**\n   📍 {s.address or 'तमिलनाडु'}\n   👥 {avail} स्थान उपलब्ध हैं ({pct}% भरा हुआ)\n   ✅ सुविधाएं: {', '.join(s.amenities_json or [])}\n\n"
            res += "📞 परिवहन सहायता के लिए अधिकारियों से संपर्क करें।"
            return res
            
        else:
            res = "**Available Emergency Shelters:**\n\n"
            for s in shelters[:3]:
                avail = s.capacity - s.current_occupancy
                pct = round((s.current_occupancy / s.capacity) * 100)
                res += f"🏠 **{s.name}**\n   📍 {s.address or 'Tamil Nadu'}\n   👥 {avail} spaces available ({pct}% full)\n   ✅ Amenities: {', '.join(s.amenities_json or [])}\n\n"
            res += "📞 Contact district administration for transit support."
            return res

    def _build_risks_response(self, predictions: List[FloodPrediction], lang: str) -> str:
        critical = [p for p in predictions if p.risk_score >= 70.0]
        
        if lang == "ta":
            res = "**வெள்ள அபாய பகுப்பாய்வு:**\n\n"
            if critical:
                res += "🔴 **உயர்ந்த ஆபத்துள்ள மண்டலங்கள்:**\n"
                for p in critical:
                    res += f"• **{p.zone.name}** — அபாய புள்ளி: {int(p.risk_score)}/100 (கணிப்பு ஆழம்: {p.predicted_depth}m)\n"
            else:
                res += "🟢 தற்போது தீவிர ஆபத்துள்ள மண்டலங்கள் எதுவும் இல்லை. அனைத்து பகுதிகளும் பாதுகாப்பாக உள்ளன.\n"
            res += "\n⚠️ **அறிவுரை:** தாழ்வான பகுதிகளில் உள்ள மக்கள் உடனடியாக உயரமான இடங்களுக்கு செல்லவும்."
            return res
            
        elif lang == "hi":
            res = "**बाढ़ जोखिम विश्लेषण:**\n\n"
            if critical:
                res += "🔴 **उच्च जोखिम वाले क्षेत्र:**\n"
                for p in critical:
                    res += f"• **{p.zone.name}** — जोखिम स्कोर: {int(p.risk_score)}/100 (अनुमानित गहराई: {p.predicted_depth}m)\n"
            else:
                res += "🟢 वर्तमान में कोई गंभीर जोखिम क्षेत्र नहीं हैं। सभी क्षेत्र सुरक्षित सीमा में हैं।\n"
            res += "\n⚠️ **सलाह:** निचले इलाकों के निवासी तुरंत सुरक्षित स्थानों पर चले जाएं।"
            return res
            
        else:
            res = "**Flood Risk Analysis:**\n\n"
            if critical:
                res += "🔴 **High Risk Zones:**\n"
                for p in critical:
                    res += f"• **{p.zone.name}** — Risk Score: {int(p.risk_score)}/100 (Predicted Depth: {p.predicted_depth}m)\n"
            else:
                res += "🟢 All monitored zones are currently below critical alert levels.\n"
            res += "\n⚠️ **Recommendation:** Residents in low-lying buffer basins should verify local coordinates and keep emergency supplies ready."
            return res

    def _build_alerts_response(self, alerts: List[Alert], lang: str) -> str:
        if not alerts:
            if lang == "ta": return "தற்போது செயல்பாட்டில் உள்ள எச்சரிக்கைகள் எதுவும் இல்லை."
            if lang == "hi": return "वर्तमान में कोई सक्रिय चेतावनी नहीं है।"
            return "No active emergency alerts currently."
            
        if lang == "ta":
            res = f"🚨 **செயல்பாட்டில் உள்ள எச்சரிக்கைகள் ({len(alerts)}):**\n\n"
            for a in alerts:
                emoji = "🔴" if a.severity in ["extreme", "severe"] else "🟡"
                res += f"{emoji} **{a.type} ({a.severity.upper()})**\n   {a.message}\n\n"
            return res
        elif lang == "hi":
            res = f"🚨 **सक्रिय आपातकालीन चेतावनियां ({len(alerts)}):**\n\n"
            for a in alerts:
                emoji = "🔴" if a.severity in ["extreme", "severe"] else "🟡"
                res += f"{emoji} **{a.type} ({a.severity.upper()})**\n   {a.message}\n\n"
            return res
        else:
            res = f"🚨 **Active Emergency Warnings ({len(alerts)}):**\n\n"
            for a in alerts:
                emoji = "🔴" if a.severity in ["extreme", "severe"] else "🟡"
                res += f"{emoji} **{a.type} ({a.severity.upper()})**\n   {a.message}\n\n"
            return res

    def _build_emergency_response(self, lang: str) -> str:
        if lang == "ta":
            return """**அவசர கால தொடர்பு எண்கள்:**

🚨 **மாநில பேரிடர் மேலாண்மை:** 1070
🚒 **தீயணைப்பு & மீட்புப்பணி:** 101
🚑 **ஆம்புலன்ஸ்:** 108
👮 **காவல்துறை:** 100
📞 **தேசிய பேரிடர் மீட்புப் படை (NDRF):** 011-24363260

⚠️ அவசர காலங்களில் உடனடியாக 108 ஐ தொடர்பு கொள்ளவும்."""
        elif lang == "hi":
            return """**आपातकालीन संपर्क और हेल्पलाइन:**

🚨 **राज्य आपदा प्रबंधन:** 1070
🚒 **अग्निशमन और बचाव:** 101
🚑 **एम्बुलेंस सेवा:** 108
👮 **पुलिस हेल्पलाइन:** 100
📞 **एनडीआरएफ हेल्पलाइन:** 011-24363260

⚠️ आपातकालीन बचाव के लिए तुरंत 108 डायल करें।"""
        else:
            return """**Emergency Helplines & Contacts:**

🚨 **State Disaster Management:** 1070
🚒 **Fire & Rescue Services:** 101
🚑 **Ambulance Services:** 108
👮 **Police Station:** 100
📞 **NDRF Control Room:** 011-24363260

⚠️ In critical situations, immediately contact 108 or text SOS on your dashboard."""

    def _build_safety_response(self, lang: str) -> str:
        if lang == "ta":
            return """**வெள்ள பாதுகாப்பு முன்னெச்சரிக்கைகள்:**

1. **உயரமான இடம்:** தாழ்வான பகுதியில் வசித்தால் உயரமான கட்டிடத்திற்கு செல்லவும்.
2. **மின்சாரம்:** மின் கசிவை தவிர்க்க மின் இணைப்புகளை அணைக்கவும்.
3. **உணவு & தண்ணீர்:** குடிநீரை காய்ச்சி குடிக்கவும், சமைத்த உணவுகளை உண்ணவும்.
4. **பயணம்:** வெள்ள நீரில் நடக்கவோ வண்டிகளை ஓட்டவோ வேண்டாம்.
5. **அறிவிப்புகள்:** அரசு மற்றும் வானிலை செய்திகளை தொடர்ந்து கவனிக்கவும்."""
        elif lang == "hi":
            return """**बाढ़ सुरक्षा सावधानियां:**

1. **ऊंचे स्थानों पर जाएं:** यदि आप निचले इलाके में हैं, तो तुरंत ऊंची इमारत पर चले जाएं।
2. **बिजली बंद करें:** शॉर्ट सर्किट से बचने के लिए मुख्य बिजली कनेक्शन काट दें।
3. **सुरक्षित भोजन/पानी:** केवल उबला हुआ पानी पीएं और सूखा भोजन पास रखें।
4. **यात्रा से बचें:** बाढ़ के पानी में पैदल चलने या गाड़ी चलाने का प्रयास न करें।
5. **समाचारों पर नजर रखें:** मौसम विभाग और आपदा राहत की घोषणाओं को ध्यान से सुनें।"""
        else:
            return """**Flood Safety Guidelines & Precautions:**

1. **Move to Safety:** If you are in low-elevation floodplains, move to upper floors or nearest shelters.
2. **Utility Control:** Turn off gas valves and main electrical switches immediately.
3. **Clean Resources:** Drink only boiled/packaged water. Contaminated water is a vector for pathogens.
4. **Transit Warning:** Do not walk, swim, or drive through moving floodwaters. Just 6 inches of water can sweep you away.
5. **Monitor Updates:** Keep battery-powered radios/devices connected to official bulletins."""

    def _build_general_response(self, lang: str) -> str:
        if lang == "ta":
            return """நான் ஜியோகார்டு AI உதவி முகவர். பின்வரும் தகவல்களை நான் வழங்க முடியும்:

• 🏠 **நிவாரண முகாம்கள்** மற்றும் இருப்பிடம்
• 🗺️ **வெள்ள அபாய பகுதி** கணிப்புகள்
• 🚨 **அவசர அறிவிப்புகள்** மற்றும் எச்சரிக்கைகள்
• 📞 **அவசர தொடர்பு எண்கள்** மற்றும் உதவிகள்
• 📋 **பாதுகாப்பு முன்னெச்சரிக்கைகள்**

உங்களுக்கு தேவையான தகவலை சுருக்கமாக கேட்கவும்!"""
        elif lang == "hi":
            return """मैं जियोगार्ड एआई आपदा सहायक हूँ। मैं निम्नलिखित विषयों में सहायता कर सकता हूँ:

• 🏠 **राहत शिविरों** की स्थिति और उपलब्धता
• 🗺️ **बाढ़ जोखिम क्षेत्रों** का विश्लेषण
• 🚨 **सक्रिय चेतावनियां** और अलर्ट
• 📞 **आपातकालीन हेल्पलाइन नंबर**
• 📋 **आपदा सुरक्षा सावधानियां**

आप इन विषयों पर मुझसे सीधे प्रश्न पूछ सकते हैं।"""
        else:
            return """I am the GeoGuard AI Disaster Intelligence Assistant. I can assist you with:

• 🏠 **Emergency Shelters** (location, capacity, walking times)
• 🗺️ **Flood Risk Assessments** (probability scores, depth forecasts)
• 🚨 **Active Disaster Alerts** (heavy rain, evacuation orders)
• 📞 **Emergency Contact Helplines**
• 📋 **Disaster Safety Checklists**

How can I help keep you and your family safe today?"""
