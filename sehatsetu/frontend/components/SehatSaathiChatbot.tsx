'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot, X, Send, Sparkles, AlertTriangle, ArrowRight,
  ShieldCheck, HelpCircle, PhoneCall, Stethoscope, Clock,
  FileText, CreditCard, RotateCcw, ChevronDown, CheckCircle2,
  Building2, Video, Paperclip, MessageSquare, Mic, MicOff,
  Volume2, VolumeX, Radio, Calendar, HeartPulse
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionLink?: {
    label: string;
    href: string;
  };
  isEmergency?: boolean;
  doctorCard?: {
    name: string;
    specialty: string;
    hospital: string;
    fee: string;
    schemeBadge?: string;
    bookUrl: string;
  };
}

// Regional language mapping for Web Speech API & Text-to-Speech
const SPEECH_LANG_MAP: Record<string, string> = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
  or: 'or-IN',
  as: 'as-IN',
  ne: 'ne-NP',
  sd: 'sd-IN',
  en: 'en-IN',
};

const VERNACULAR_VOICE_DEMOS = [
  { label: '🎙️ "Bukhar aur khasi"', query: 'Mujhe kal se bukhar aur khasi hai, doctor book karna hai' },
  { label: '🎙️ "Pet me tez dard"', query: 'Pet me bohot tez dard aur acidity ho rahi hai' },
  { label: '🎙️ "Ghutne me dard"', query: 'Meri ammi ke ghutne me dard hai, Sonipat me doctor dikhao' },
  { label: '🎙️ "Ayushman Cashless"', query: 'Ayushman card se cashless ilaaj kaise hoga?' },
  { label: '🎙️ "Dil / BP checkup"', query: 'Blood pressure high hai, heart doctor se consult karna hai' },
  { label: '🎙️ "FairSlot late protection"', query: 'Agar traffic me late ho jaun to kya appointment cancel hogi?' },
];

export default function SehatSaathiChatbot() {
  const router = useRouter();
  const { currentLanguage, languageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Recognition & Speech Synthesis State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxListenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialBotMessage: ChatMessage = {
    id: 'welcome_1',
    sender: 'bot',
    text: `Namaste! 🙏 I am **SehatSaathi** (सेहत साथी), your digital healthcare companion.\n\nAsk questions, find verified doctors, check PM-JAY cashless hospital coverage, or get guidance on appointments in any language.\n\n*Type your query below or use the microphone to begin.*`,
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setSpeechSupported(hasSpeech);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isListening]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    stopSpeaking();
    stopVoiceListening(false);
    setIsOpen(false);
  };

  const handleResetChat = () => {
    stopSpeaking();
    stopVoiceListening(false);
    setMessages([initialBotMessage]);
  };

  // Text-To-Speech (TTS Read Aloud) with GC protection for Chrome/Edge
  const speakText = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Strip markdown formatting for natural voice delivery
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[•#🙏🎙️⚠️➔→]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef.current = utterance;
    (window as any).__ss_utterance = utterance; // Keep alive in window to prevent Chrome V8 garbage collection

    const targetLocale = SPEECH_LANG_MAP[currentLanguage] || 'hi-IN';
    utterance.lang = targetLocale;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetLocale.substring(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (msgId) {
      setActiveSpeakingId(msgId);
    }

    utterance.onend = () => {
      setActiveSpeakingId(null);
      activeUtteranceRef.current = null;
      (window as any).__ss_utterance = null;
    };

    utterance.onerror = () => {
      setActiveSpeakingId(null);
      activeUtteranceRef.current = null;
      (window as any).__ss_utterance = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      activeUtteranceRef.current = null;
      (window as any).__ss_utterance = null;
    }
  };

  // Voice Recognition (Speech-to-Text) - Continuous & Resilient against 1s cutoff
  const startVoiceListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert('Speech recognition is supported in Chrome, Edge, and Android web browsers.');
      return;
    }

    stopSpeaking();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxListenTimerRef.current) clearTimeout(maxListenTimerRef.current);
    voiceTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = true; // Crucial: Keeps listening continuously without 1s VAD cutoff
      recognition.interimResults = true;

      // Select locale based on active language (defaults to Hindi/Indian English)
      const targetLang = SPEECH_LANG_MAP[currentLanguage] || 'hi-IN';
      recognition.lang = targetLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let liveTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          liveTranscript += event.results[i][0].transcript;
        }
        setInputValue(liveTranscript);
        voiceTranscriptRef.current = liveTranscript;

        // Reset silence timer on every spoken word
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (liveTranscript.trim().length > 0) {
          // Patient finished their phrase; wait 2.4s of silence before auto-submitting
          silenceTimerRef.current = setTimeout(() => {
            stopVoiceListening(true);
          }, 2400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        // Do not abort on initial browser 'no-speech' or 'aborted' - give patient time to speak!
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const speech = voiceTranscriptRef.current.trim();
        if (speech) {
          voiceTranscriptRef.current = '';
          handleSendMessage(speech, true);
        }
      };

      recognition.start();

      // Absolute safety guardrail: stop after 20 seconds
      maxListenTimerRef.current = setTimeout(() => {
        stopVoiceListening(true);
      }, 20000);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopVoiceListening = (shouldSubmit: boolean = false) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListenTimerRef.current) {
      clearTimeout(maxListenTimerRef.current);
      maxListenTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);

    if (shouldSubmit) {
      const speech = voiceTranscriptRef.current.trim();
      if (speech) {
        voiceTranscriptRef.current = '';
        handleSendMessage(speech, true);
      }
    }
  };

  // Healthcare Knowledge & Vernacular Voice Booking Engine
  const generateBotResponse = (userQuery: string): ChatMessage => {
    const q = userQuery.toLowerCase().trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Critical Medical Emergency Triggers (Life Safety First)
    if (
      q.includes('heart attack') ||
      q.includes('chest pain') ||
      q.includes('seene me dard') ||
      q.includes('unconscious') ||
      q.includes('behos') ||
      q.includes('heavy bleeding') ||
      q.includes('khoon') ||
      q.includes('poison') ||
      q.includes('stroke') ||
      q.includes('paralysis') ||
      q.includes('severe accident') ||
      q.includes('cannot breathe') ||
      q.includes('saas nahi') ||
      q.includes('dying')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **EMERGENCY MEDICAL PROTOCOL**\n\nIf you or someone nearby is experiencing acute chest pain, breathlessness, loss of consciousness, or severe trauma, **do not wait for an OPD booking**.\n\nCall national emergency response hotlines immediately:\n• **National Emergency: 112**\n• **Ambulance Dispatch: 108**`,
        timestamp: time,
        isEmergency: true,
        actionLink: {
          label: 'Call Ambulance (108) Now',
          href: 'tel:108',
        },
      };
    }

    // 2. Stomach / Digestive / Acidity / Vomiting (Hindi: Pet dard, Ulti, Dast, Loose motion, Gas)
    if (
      q.includes('pet') ||
      q.includes('pait') ||
      q.includes('stomach') ||
      q.includes('belly') ||
      q.includes('ulti') ||
      q.includes('vomit') ||
      q.includes('dast') ||
      q.includes('loose motion') ||
      q.includes('diarrhea') ||
      q.includes('gas') ||
      q.includes('acidity') ||
      q.includes('kabz') ||
      q.includes('digestion')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Maine aapki samasya sun li hai. Pet dard, ulti, dast ya acidity ke liye **General Physician ya Gastroenterologist (पेट व आंत रोग विशेषज्ञ)** se paramarsh lein.\n\nSwasthya Polyclinic aur Civil Hospital me doctor uplabdh hain:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Suresh Verma',
          specialty: 'General Physician & Primary Care',
          hospital: 'Swasthya Family Polyclinic, Sonipat',
          fee: '₹250 (Cashless with PM-JAY)',
          schemeBadge: 'PM-JAY Empaneled',
          bookUrl: '/book/1?slot=11:00',
        },
        actionLink: {
          label: 'Book Stomach Consultation (11:00 AM) →',
          href: '/book/1?slot=11:00',
        },
      };
    }

    // 3. Eye / Vision / Cataract (Hindi: Aankh, Motiyabind, Chashma, Nazar)
    if (
      q.includes('aankh') ||
      q.includes('aankho') ||
      q.includes('eye') ||
      q.includes('eyes') ||
      q.includes('motiyabind') ||
      q.includes('cataract') ||
      q.includes('chashma') ||
      q.includes('nazar') ||
      q.includes('vision') ||
      q.includes('dhundhla')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Aankho me jalan, dard ya motiyabind ki jaanch ke liye **Eye Specialist / Ophthalmologist (नेत्र रोग विशेषज्ञ)** ko dikhayein. Ayushman Bharat ke tehat motiyabind ka cashless operation uplabdh hai:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Rajesh Kumar',
          specialty: 'Ophthalmology & Cataract Care',
          hospital: 'Sonipat Civil Hospital Eye OPD',
          fee: '₹0 (100% Cashless with Ayushman Card)',
          schemeBadge: 'Govt Free Care',
          bookUrl: '/search?service=Ophthalmologist',
        },
        actionLink: {
          label: 'View Eye Specialists in Sonipat →',
          href: '/search?service=Ophthalmologist',
        },
      };
    }

    // 4. Women / Maternity / Pregnancy (Hindi: Mahila rog, Ladies doctor, Garbh, Delivery, Mahavari)
    if (
      q.includes('mahila') ||
      q.includes('ladies') ||
      q.includes('aurat') ||
      q.includes('pregnancy') ||
      q.includes('garbh') ||
      q.includes('delivery') ||
      q.includes('period') ||
      q.includes('mahavari') ||
      q.includes('gynaec') ||
      q.includes('gynec')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Mahila swasthya, pregnancy checkup ya delivery ke liye **Gynecologist (स्त्री रोग विशेषज्ञ)** Dr. Pooja Malhotra se consult kar sakte hain:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Pooja Malhotra',
          specialty: 'Obstetrics & Gynaecology',
          hospital: 'Mehta Women & Child Centre, Model Town',
          fee: '₹500 (PM-JAY Matrutva Benefit)',
          schemeBadge: 'Maternal Care Verified',
          bookUrl: '/search?service=Gynecologist',
        },
        actionLink: {
          label: 'Book Women Health Consultation →',
          href: '/search?service=Gynecologist',
        },
      };
    }

    // 5. Heart / Blood Pressure / BP (Hindi: Dil ki bimari, BP, Hypertension)
    if (
      q.includes('dil') ||
      q.includes('heart') ||
      q.includes('bp') ||
      q.includes('blood pressure') ||
      q.includes('hypertension') ||
      q.includes('cholesterol')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `High blood pressure aur dil ki dekhbhal ke liye **Cardiologist (हृदय रोग विशेषज्ञ)** se paramarsh lein:\n\nMetro Heart Institute me Dr. Amit Sengupta OPD me uplabdh hain:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Amit Sengupta',
          specialty: 'Cardiology & Internal Medicine',
          hospital: 'Metro Heart & Vascular Institute, Sonipat',
          fee: '₹600 (Senior Citizen Priority)',
          schemeBadge: 'Cardiac Care Verified',
          bookUrl: '/search?service=Cardiologist',
        },
        actionLink: {
          label: 'Book Cardiology Appointment →',
          href: '/search?service=Cardiologist',
        },
      };
    }

    // 6. Vernacular Fever / General Illness (Hindi: Bukhar, Khasi, Sardi, Zukaam, Sar dard)
    if (
      q.includes('bukhar') ||
      q.includes('fever') ||
      q.includes('khasi') ||
      q.includes('cough') ||
      q.includes('cold') ||
      q.includes('sardi') ||
      q.includes('zukaam') ||
      q.includes('sar dard') ||
      q.includes('headache') ||
      q.includes('general physician') ||
      q.includes('viral') ||
      q.includes('body pain') ||
      q.includes('kamzori')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Maine aapki baat samajh li hai. Bukhar, sardi, khasi ya sharir me dard ke liye **General Physician (सामान्य चिकित्सक)** sabse sahi doctor hain.\n\nAap Sonipat Civil Hospital me **Dr. Suresh Verma** ke paas direct token lock kar sakte hain (Ayushman Bharat ke tehat 100% Cashless).`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Suresh Verma',
          specialty: 'General Physician / Internal Medicine',
          hospital: 'Ayushman Arogya Mandir, Rai (Sonipat)',
          fee: '₹250 (100% Cashless with PM-JAY)',
          schemeBadge: 'PM-JAY & ABHA Verified',
          bookUrl: '/book/1?slot=10:30',
        },
        actionLink: {
          label: 'Book General Physician (10:30 AM Slot) →',
          href: '/book/1?slot=10:30',
        },
      };
    }

    // 7. Vernacular Knee, Bone, Joint Pain (Hindi: Ghutna, Kamar, Haddi, Gathiya, Ortho)
    if (
      q.includes('ghutn') ||
      q.includes('ghutne') ||
      q.includes('knee') ||
      q.includes('kamar') ||
      q.includes('back pain') ||
      q.includes('haddi') ||
      q.includes('joint') ||
      q.includes('bone') ||
      q.includes('ortho') ||
      q.includes('gathiya') ||
      q.includes('fracture')
    ) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Ghutne ke dard, kamar dard, ya haddi ki samasya ke liye aapko **Orthopedic Specialist (हड्डी रोग विशेषज्ञ)** ko dikhana chahiye.\n\nCivil Hospital Sonipat me orthopedic OPD slots uplabdh hain:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Vikram Malhotra',
          specialty: 'Orthopedics & Joint Replacement',
          hospital: 'Civil Hospital Sonipat',
          fee: '₹0 with Ayushman Card / ₹400 standard',
          schemeBadge: 'Zero Queue Wait',
          bookUrl: '/search?service=Orthopedist',
        },
        actionLink: {
          label: 'View Verified Orthopedic Doctors →',
          href: '/search?service=Orthopedist',
        },
      };
    }

    // 8. Dental / Tooth (Hindi: Daant, Dant, Masoode)
    if (q.includes('daant') || q.includes('dant') || q.includes('tooth') || q.includes('teeth') || q.includes('dentist') || q.includes('cavity') || q.includes('masoode')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Daant me dard, kida lagna ya bleeding gums ke liye **Dentist (दंत चिकित्सक)** se milna zaroori hai.\n\nSmileWell Dental Care me Dr. Priya Nair ke paas painless checkup uplabdh hai:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Priya Nair',
          specialty: 'Dental Surgeon & Conservative Care',
          hospital: 'SmileWell Dental Care, Atlas Road (Sonipat)',
          fee: '₹350',
          schemeBadge: 'FairSlot™ Protection',
          bookUrl: '/book/3?slot=13:15',
        },
        actionLink: {
          label: 'Book Dental Consultation →',
          href: '/book/3?slot=13:15',
        },
      };
    }

    // 9. Child / Baby Care (Hindi: Bacha, Shishu, Tika, Vaccine)
    if (q.includes('bacha') || q.includes('bachhe') || q.includes('baby') || q.includes('shishu') || q.includes('pediatric') || q.includes('tika') || q.includes('vaccin')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Bachho ki bimari, bukhar ya vaccination ke liye **Pediatrician (बाल रोग विशेषज्ञ)** ko dikhayein. Dr. Ananya Sharma Mehta Children Centre me uplabdh hain:`,
        timestamp: time,
        doctorCard: {
          name: 'Dr. Ananya Sharma',
          specialty: 'Pediatrics & Neonatal Care',
          hospital: 'Mehta Women & Child Centre, Model Town (Sonipat)',
          fee: '₹400 (Child Priority)',
          schemeBadge: 'NMC Verified',
          bookUrl: '/book/2?slot=11:15',
        },
        actionLink: {
          label: 'Book Pediatrician Appointment →',
          href: '/book/2?slot=11:15',
        },
      };
    }

    // 10. Skin & Allergy (Hindi: Chamdi, Khujli, Daane, Acne)
    if (q.includes('chamdi') || q.includes('khujli') || q.includes('skin') || q.includes('rash') || q.includes('acne') || q.includes('dermatolog') || q.includes('daane')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Skin allergy, khujli, ya chehre ke daano ke liye **Dermatologist (त्वचा विशेषज्ञ)** se consult karein. Video consult aur clinic dono uplabdh hain:`,
        timestamp: time,
        actionLink: {
          label: 'Search Skin Specialists →',
          href: '/search?service=Dermatologist',
        },
      };
    }

    // 11. Ayushman Bharat PM-JAY & Cashless Care
    if (q.includes('ayushman') || q.includes('pmjay') || q.includes('pm-jay') || q.includes('cashless') || q.includes('card') || q.includes('sarkari')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `**Ayushman Bharat (PM-JAY)** ke tehat har parivar ko har saal **₹5 Lakh** tak ka muft (cashless) ilaaj milta hai.\n\nSehatSetu par:\n1. Search karte waqt **"PM-JAY"** filter chunein.\n2. Civil Hospital aur empaneled private hospitals me cashless ilaaj payein.\n3. Koi hidden charges nahi hain.`,
        timestamp: time,
        actionLink: {
          label: 'View PM-JAY Empaneled Clinics →',
          href: '/dashboard/health-schemes',
        },
      };
    }

    // 12. FairSlot™ Delay Protection (Late in traffic)
    if (q.includes('fairslot') || q.includes('late') || q.includes('delay') || q.includes('traffic') || q.includes('cancel')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `**FairSlot™ Delay Protection** ka fayda:\n\nAgar aap raste me jaam ya traffic ki wajah se 10-15 minute late ho rahe hain, to **My Appointments** me jakar **"Report Delay"** par tap karein.\n\nAapki appointment cancel nahi hogi aur doctor aapka slot hold karke rakhenge!`,
        timestamp: time,
        actionLink: {
          label: 'Go to My Appointments →',
          href: '/dashboard/appointments',
        },
      };
    }

    // 13. Past Report & File Upload
    if (q.includes('report') || q.includes('upload') || q.includes('prescription') || q.includes('file') || q.includes('photo')) {
      return {
        id: `resp_${Date.now()}`,
        sender: 'bot',
        text: `Aap purani report ya doctor ki parchi (prescription) aasaani se upload kar sakte hain:\n\n1. Booking confirm karte waqt Medical Notes ke neeche **"Attach Past Reports"** par tap karein.\n2. Photo ya PDF select karein.\n3. Doctor consultation se pehle hi aapki reports dekh sakenge!`,
        timestamp: time,
        actionLink: {
          label: 'View Care Passport Files →',
          href: '/dashboard/care-passport',
        },
      };
    }

    // Default Fallback Guidance
    return {
      id: `resp_${Date.now()}`,
      sender: 'bot',
      text: `Maine aapka sandesh suna: *"${userQuery}"*.\n\nSehatSetu par aap Sonipat aur aas-paas ke 80+ verified doctors ko search kar sakte hain, Ayushman Bharat cashless ilaaj dekh sakte hain, aur bina line me lage online slot book kar sakte hain.\n\nKya aap kisi bimari (jaise bukhar, ghutne ka dard, pet dard) ya doctor ke bare me poochna chahte hain?`,
      timestamp: time,
      actionLink: {
        label: 'Find Care on SehatSetu →',
        href: '/search',
      },
    };
  };

  const handleSendMessage = (textToSend?: string, fromVoice: boolean = false) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    stopSpeaking();

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    if (fromVoice) {
      setVoiceOutputEnabled(true);
    }

    setTimeout(() => {
      const botMsg = generateBotResponse(text);
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // Auto-read aloud if voice output toggle is active OR if the patient asked using voice!
      if (voiceOutputEnabled || fromVoice) {
        speakText(botMsg.text, botMsg.id);
      }
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ── MINIMAL COMPACT CIRCULAR LAUNCHER BUTTON (Bottom-Right) ── */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 flex-row-reverse group">
          <button
            type="button"
            onClick={handleOpen}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#137b65] to-[#0c5949] text-white flex items-center justify-center shadow-lg shadow-[#137b65]/25 hover:shadow-xl hover:shadow-[#137b65]/35 hover:scale-108 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white"
            title="Open SehatSaathi"
            aria-label="Open SehatSaathi Healthcare Assistant"
          >
            <Bot size={20} className="text-white" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </button>

          {/* Discreet Hover Pill (appears to the left of the button, zero interference) */}
          <span className="hidden group-hover:inline-flex items-center px-2.5 py-1 rounded-full bg-[#172b28]/90 text-white text-[11px] font-semibold shadow-md backdrop-blur-xs pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150 whitespace-nowrap">
            SehatSaathi
          </span>
        </div>
      )}

      {/* ── 3. FLOATING BOTTOM-RIGHT CHAT MODAL ── */}
      {isOpen && (
        <div
          className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[410px] md:w-[440px] h-[570px] max-h-[84vh] bg-white rounded-3xl border border-[#cfe2d7] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 backdrop-blur-md"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#137b65] to-[#0c5949] text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5 leading-tight">
                  <span>SehatSaathi</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-semibold tracking-wider uppercase">
                    AI Copilot
                  </span>
                </div>
                <div className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Care Guide · {languageOption.nativeName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Read Aloud Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (voiceOutputEnabled) {
                    stopSpeaking();
                    setVoiceOutputEnabled(false);
                  } else {
                    setVoiceOutputEnabled(true);
                    speakText('Voice readout enabled. SehatSaathi will read responses aloud in your language.');
                  }
                }}
                className={`p-1.5 rounded-xl transition ${
                  voiceOutputEnabled
                    ? 'bg-amber-400 text-[#172b28] font-bold shadow-2xs'
                    : 'hover:bg-white/15 text-white/80 hover:text-white'
                }`}
                title={voiceOutputEnabled ? 'Voice Readout Active (Click to mute)' : 'Turn on Voice Readout (Bolkar sunayein)'}
                aria-label="Toggle voice readout"
              >
                {voiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition"
                title="Minimize SehatSaathi"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Medical Safety Disclaimer Strip */}
          <div className="bg-[#fef9ee] border-b border-[#f3e6ca] px-3.5 py-1.5 flex items-center justify-between text-[10px] text-amber-900 shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-amber-700 shrink-0" />
              <span>Voice-first care guide · Non-diagnostic</span>
            </div>
            <a
              href="tel:108"
              className="text-amber-800 font-extrabold hover:underline flex items-center gap-0.5 shrink-0"
            >
              <PhoneCall size={10} /> Emergency: 108
            </a>
          </div>

          {/* Active Listening Animated Banner with Audio Wave Bars */}
          {isListening && (
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-1 duration-150 shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                {/* Equalizer Waveform bars */}
                <div className="flex items-end gap-1 h-5">
                  <span className="w-1 bg-white rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-4" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-5" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '250ms' }} />
                </div>
                <div>
                  <div className="font-extrabold flex items-center gap-1.5 leading-tight">
                    <span>Listening... बोलिए</span>
                    <span className="text-[9px] bg-white/25 px-1.5 py-0.2 rounded font-medium">Auto-sends when done</span>
                  </div>
                  <p className="text-[10px] text-white/90 truncate max-w-[210px] italic mt-0.5">
                    {inputValue || "Speak symptom (e.g. 'bukhar hai', 'pet dard')..."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => stopVoiceListening(true)}
                className="px-2.5 py-1 bg-white text-red-700 hover:bg-white/90 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer shrink-0 transition active:scale-95"
              >
                Done
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[#fbfcfa] scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-[#eaf6ee] text-[#137b65] flex items-center justify-center shrink-0 mt-0.5 border border-[#d2e4d9]">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-[#137b65] text-white rounded-br-xs font-medium'
                      : msg.isEmergency
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-xs'
                      : 'bg-white text-[#1f362e] border border-[#e1ece4] rounded-bl-xs'
                  }`}
                >
                  {/* Top Bar for Bot Message: Speaker Button to Read Aloud */}
                  {msg.sender === 'bot' && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5">
                      <span className="text-[10px] font-bold text-[#137b65] flex items-center gap-1">
                        <Sparkles size={11} /> SehatSaathi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeSpeakingId === msg.id) {
                            stopSpeaking();
                          } else {
                            speakText(msg.text, msg.id);
                          }
                        }}
                        className={`p-1 rounded-lg text-[10px] flex items-center gap-1 transition ${
                          activeSpeakingId === msg.id
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'text-[#6f847c] hover:bg-[#edf5f0] hover:text-[#137b65]'
                        }`}
                        title="Listen to this response (Aawaz me sunein)"
                      >
                        <Volume2 size={13} className={activeSpeakingId === msg.id ? 'animate-bounce' : ''} />
                        <span>{activeSpeakingId === msg.id ? 'Speaking...' : 'Listen'}</span>
                      </button>
                    </div>
                  )}

                  {/* Message formatted text */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Embedded 1-Click Doctor Booking Card (for Voice Booking Flow) */}
                  {msg.doctorCard && (
                    <div className="mt-3 p-3 rounded-xl bg-[#f4faf6] border border-[#cbe4d4] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-[#172b28] flex items-center gap-1">
                            <span>{msg.doctorCard.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <p className="text-[10px] text-[#137b65] font-semibold mt-0.5">
                            {msg.doctorCard.specialty}
                          </p>
                          <p className="text-[10px] text-[#556962] mt-0.5">
                            {msg.doctorCard.hospital}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                          {msg.doctorCard.schemeBadge || 'Verified'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#dceee2] flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#172b28]">
                          {msg.doctorCard.fee}
                        </span>
                        <Link
                          href={msg.doctorCard.bookUrl}
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              setIsOpen(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#137b65] hover:bg-[#0c5949] text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Confirm Booking</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Link (if provided) */}
                  {msg.actionLink && !msg.doctorCard && (
                    <div className="mt-2.5 pt-2 border-t border-black/10">
                      <Link
                        href={msg.actionLink.href}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setIsOpen(false);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition shadow-2xs ${
                          msg.isEmergency
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-[#edf7f2] hover:bg-[#137b65] text-[#137b65] hover:text-white border border-[#cce4d6]'
                        }`}
                      >
                        <span>{msg.actionLink.label}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-[#879d94]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Animated Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-[#eaf6ee] text-[#137b65] flex items-center justify-center shrink-0 border border-[#d2e4d9]">
                  <Bot size={15} />
                </div>
                <div className="bg-white border border-[#e1ece4] rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-[#6e857c] flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#137b65] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#137b65] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#137b65] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-[#788f86] ml-1">SehatSaathi is formulating advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Vernacular Voice Sample Prompts (For evaluators and easy testing) */}
          <div className="px-3 py-1.5 bg-[#f4faf6] border-t border-[#e2efe6] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold text-[#137b65] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Mic size={10} /> Voice Demos:
            </span>
            {VERNACULAR_VOICE_DEMOS.map((demo) => (
              <button
                key={demo.label}
                type="button"
                onClick={() => handleSendMessage(demo.query)}
                className="px-2 py-0.8 rounded-full bg-white hover:bg-[#e4f3ea] border border-[#cbe2d3] text-[#243d35] text-[10px] font-semibold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs"
              >
                {demo.label}
              </button>
            ))}
          </div>

          {/* Input Box Footer with Real Microphone Button */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-[#edf2ee] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening... बोलिए / Speak now..." : "Speak or type symptom (e.g. bukhar, knee pain)..."}
                className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border transition text-[#172b28] placeholder:text-[#8e9f97] outline-none ${
                  isListening
                    ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200'
                    : 'border-[#d6e5db] bg-[#fbfdfc] focus:bg-white focus:border-[#137b65] focus:ring-2 focus:ring-[#137b65]/15'
                }`}
              />

              {/* Glowing Microphone Button (Speech to Text) */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopVoiceListening(true);
                  } else {
                    startVoiceListening();
                  }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                    : 'bg-[#eaf5ee] hover:bg-[#d6ecde] text-[#137b65] border border-[#c5e0cf]'
                }`}
                title={isListening ? 'Stop listening (Tap to finish)' : 'Speak in your language (Tap to talk)'}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-[#137b65] hover:bg-[#0c5949] text-white flex items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
