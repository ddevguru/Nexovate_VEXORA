import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ShieldAlert,
  Database,
  Terminal,
  Cpu,
  Brain,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Radio,
  Globe2
} from 'lucide-react';
import { investigationsAPI, multiAgentAPI } from '../services/api';
import { Investigation, MultiAgentSuiteResponse, AgentResult, AgentTraceStep } from '../types';
import { InteractiveTiltCard } from '../components/common/InteractiveTiltCard';

interface AgentsConsolePageProps {
  investigationId?: string | null;
}

// Comprehensive multi-language speech scripts for every agent
const MULTI_LANG_SCRIPTS: Record<string, Record<string, string>> = {
  hi: {
    'auth-sentinel':
      'ऑथ सेंटिनल एजेंट रिपोर्ट: मैंने ऑथेंटिकेशन लॉग्स का विश्लेषण किया है। आईपी 192.168.1.50 से लगातार विफल लॉगिन प्रयास पाए गए, जिसके तुरंत बाद यूजर राहुल के खाते में सफल लॉगिन हुआ। खाता पूरी तरह से अनधिकृत रूप से समझौता होने की 99% संभावना है।',
    'db-exfiltration':
      'डेटाबेस और एक्सफिल्ट्रेशन एजेंट रिपोर्ट: कस्टमर वॉल्ट टेबल पर अनधिकृत एसक्यूएल क्वेरी का पता चला है। इसके तुरंत बाद बाहरी सर्वर पर एससीपी के माध्यम से 1.4 जीबी गोपनीय डेटा ट्रांसफर किया गया। डेटा एक्सफिल्ट्रेशन की पुष्टि हो चुकी है।',
    'privilege-os':
      'प्रिविलेज और ओएस एजेंट रिपोर्ट: सर्वर पर सुडो कमांड निष्पादन लॉग पाया गया। यूजर राहुल ने सामान्य स्तर से रूट सुपरयूज़र अधिकार प्राप्त कर लिए हैं। प्रिविलेज एस्केलेशन की पुष्टि 98% सटीकता के साथ हुई है।',
    'threat-synthesizer':
      'थ्रेट सिंथेसाइज़र एजेंट अंतिम निर्णय: चारों एजेंटों के सहसंबंध से एक पूर्ण साइबर हमले के जीवनचक्र की पुष्टि हुई है। प्रारंभिक ब्रूट-फोर्स, रूट प्रिविलेज एस्केलेशन, डेटाबेस एक्सेस और डेटा चोरी पाए गए हैं। तत्काल यूजर सत्र रद्द करने और आईपी को ब्लॉक करने की सिफारिश की जाती है।'
  },
  en: {
    'auth-sentinel':
      'Auth Sentinel Agent Report: I analyzed authentication log records. Detected failed brute force attempts from IP 192.168.1.50 followed by a successful login for user rahul. Account compromise probability is rated at 99%.',
    'db-exfiltration':
      'Database and Exfiltration Agent Report: Audited SQL query executions and network egress sockets. Discovered unauthorized query dumping customer vault tables, followed by encrypted SCP exfiltration to an external host.',
    'privilege-os':
      'Privilege and OS Agent Report: Scanned system execution logs on host SERVER-01. Identified unauthorized sudo command execution spawning an interactive root shell for user rahul. Privilege escalation confirmed with 98% confidence.',
    'threat-synthesizer':
      'Threat Synthesizer Agent Final Verdict: Multi-agent correlation confirms a full cyber attack lifecycle. Initial SSH brute force led to account compromise, followed by sudo privilege escalation to root, database exfiltration, and external data transfer. Immediate containment recommended.'
  },
  es: {
    'auth-sentinel':
      'Informe del Agente Auth Sentinel: He analizado los registros de autenticación. Se detectaron múltiples intentos fallidos desde la IP 192.168.1.50, seguidos de un inicio de sesión exitoso para el usuario rahul. Probabilidad de compromiso de cuenta del 99%.',
    'db-exfiltration':
      'Informe del Agente de Base de Datos y Exfiltración: Se auditaron consultas SQL y transferencias de red. Se detectó una consulta no autorizada en customer_vault seguida de exfiltración de datos hacia un servidor externo.',
    'privilege-os':
      'Informe del Agente de Privilegios y Sistema Operativo: Se detectó ejecución administrativa con sudo en el servidor SERVER-01. El usuario rahul elevó permisos a superusuario root con un 98% de confianza.',
    'threat-synthesizer':
      'Veredicto Final del Agente Sintetizador de Amenazas: La correlación multi-agente confirma un ciclo de ataque completo. Acceso inicial, elevación de privilegios, extracción de base de datos y exfiltración. Se recomienda contención inmediata.'
  },
  fr: {
    'auth-sentinel':
      "Rapport de l'agent Auth Sentinel : J'ai analysé les journaux d'authentification. Détection de multiples tentatives infructueuses depuis l'IP 192.168.1.50, suivies d'une connexion réussie pour l'utilisateur rahul. Compromission du compte confirmée à 99%.",
    'db-exfiltration':
      "Rapport de l'agent Base de Données et Exfiltration : Requêtes SQL non autorisées détectées sur la table customer_vault, suivies d'un transfert sortant vers un serveur distant. Exfiltration confirmée.",
    'privilege-os':
      "Rapport de l'agent Privilèges et Système d'Exploitation : Exécution administrative sudo détectée sur SERVER-01. L'utilisateur rahul a obtenu les privilèges root avec 98% de confiance.",
    'threat-synthesizer':
      "Verdict final de l'agent Synthétiseur de Menaces : La corrélation multi-agents confirme un cycle complet de cyberattaque. Accès initial, escalade de privilèges et exfiltration. Confinement immédiat recommandé."
  },
  de: {
    'auth-sentinel':
      'Bericht des Auth Sentinel Agenten: Authentifizierungsprotokolle analysiert. Mehrere fehlgeschlagene Anmeldeversuche von IP 192.168.1.50 festgestellt, gefolgt von erfolgreichem Login. Kontokompromittierung mit 99% Wahrscheinlichkeit bestätigt.',
    'db-exfiltration':
      'Bericht des Datenbank- und Exfiltrations-Agenten: Nicht autorisierte SQL-Abfragen auf Kundendatenbank erkannt, gefolgt von externem Datentransfer. Datenexfiltration bestätigt.',
    'privilege-os':
      'Bericht des Privilege- und Betriebssystem-Agenten: Sudo-Befehlsausführung auf SERVER-01 festgestellt. Benutzer rahul hat Root-Berechtigungen mit 98% Konfidenz erlangt.',
    'threat-synthesizer':
      'Endgültiges Urteil des Bedrohungssynthesizers: Multi-Agenten-Korrelation bestätigt vollständigen Cyber-Angriffslebenszyklus. Sofortige Eindämmungsmaßnahmen empfohlen.'
  },
  ja: {
    'auth-sentinel':
      '認証センチネルエージェント報告：認証ログを解析しました。IP 192.168.1.50からのブルートフォース失敗を検出後、ユーザーrahulのログイン成功を確認。アカウント侵害確率は99％です。',
    'db-exfiltration':
      'データベース・流出エージェント報告：顧客保管テーブルに対する不正なSQLクエリと、外部サーバーへのデータ転送を検出しました。データ持ち出しを確認しました。',
    'privilege-os':
      '権限・OSエージェント報告：SERVER-01でのsudo実行を検知。ユーザーrahulがroot権限に昇格しました。信頼度98％で権限昇格を確認。',
    'threat-synthesizer':
      '脅威統合エージェント最終判定：4エージェントの相関分析により一連のサイバー攻撃を立証。直ちにアカウント停止とIP遮断を推奨します。'
  },
  zh: {
    'auth-sentinel':
      '身份验证哨兵报告：分析认证日志发现来自IP 192.168.1.50的暴力破解尝试，随后用户rahul成功登录。账户沦陷置信度高达99%。',
    'db-exfiltration':
      '数据库与数据泄露报告：发现针对核心数据库的越权查询，随后通过SCP协议向外部服务器传输敏感数据，确认存在数据窃取。',
    'privilege-os':
      '系统特权审计报告：在SERVER-01服务器上检测到sudo提权指令，用户rahul获取root权限，提权置信度98%。',
    'threat-synthesizer':
      '威胁综合研判最终结论：多智能体联合证实完整攻击链条。涵盖初始暴力破解、特权提升与数据泄露，建议立即实施应急隔离处置。'
  },
  ar: {
    'auth-sentinel':
      'تقرير وكيل حراسة المصادقة: تم تحليل سجلات المصادقة ورصد هجمات تخمين كلمات المرور من العنوان 192.168.1.50 أعقبها تسجيل دخول ناجح. تم تأكيد اختراق الحساب بنسبة 99%.',
    'db-exfiltration':
      'تقرير وكيل قواعد البيانات وتسريب البيانات: تم رصد استعلام غير مصرح به على جداول العملاء أعقبه نقل خارجي للبيانات المسروقة.',
    'privilege-os':
      'تقرير وكيل صلاحيات نظام التشغيل: تم رصد تنفيذ أمر sudo وترقية الصلاحيات إلى حساب root بنسبة ثقة 98%.',
    'threat-synthesizer':
      'حكم وكيل تحليل التهديدات النهائي: يؤكد التحليل المترابط هجوماً سيبرانياً متكاملاً. نوصي بالعزل الفوري وتعطيل الحسابات المخترقة.'
  },
  ru: {
    'auth-sentinel':
      'Отчет агента Auth Sentinel: Проанализированы журналы аутентификации. Зафиксированы попытки подбора пароля с IP 192.168.1.50 с последующим успешным входом. Вероятность компрометации 99%.',
    'db-exfiltration':
      'Отчет агента баз данных и утечек: Обнаружен несанкционированный SQL-запрос к таблице customer_vault и последующая передача данных на внешний сервер.',
    'privilege-os':
      'Отчет агента ОС и привилегий: Зафиксировано выполнение команды sudo на SERVER-01. Пользователь rahul получил права root с достоверностью 98%.',
    'threat-synthesizer':
      'Итоговый вердикт агента синтеза угроз: Корреляция подтверждает полную цепочку атаки. Рекомендуется немедленная блокировка учетной записи и изоляция IP.'
  },
  pt: {
    'auth-sentinel':
      'Relatório do Agente Auth Sentinel: Analisei os logs de autenticação. Detectadas múltiplas falhas de força bruta seguidas de login bem-sucedido para o usuário rahul. Probabilidade de comprometimento de 99%.',
    'db-exfiltration':
      'Relatório do Agente de Banco de Dados e Exfiltração: Consulta não autorizada detectada na tabela customer_vault seguida de transferência de dados para servidor externo.',
    'privilege-os':
      'Relatório do Agente de Privilégios e SO: Execução de comando sudo detectada no SERVER-01. Usuário rahul elevou privilégios para root com 98% de confiança.',
    'threat-synthesizer':
      'Veredito Final do Agente Sintetizador de Ameaças: A correlação confirma o ciclo completo de ataque. Recomendada contenção e bloqueio imediatos.'
  },
  it: {
    'auth-sentinel':
      "Rapporto dell'Agente Auth Sentinel: Ho analizzato i registri di autenticazione. Rilevati attacchi brute force dall'IP 192.168.1.50 seguiti da accesso riuscito. Compromissione dell'account confermata al 99%.",
    'db-exfiltration':
      "Rapporto dell'Agente Database ed Esfiltrazione: Rilevata query non autorizzata sul vault clienti seguita da trasferimento dati non autorizzato.",
    'privilege-os':
      "Rapporto dell'Agente Privilegi e Sistema Operativo: Esecuzione del comando sudo rilevata su SERVER-01. L'utente rahul ha ottenuto i privilegi di root con il 98% di confidenza.",
    'threat-synthesizer':
      "Verdetto Finale dell'Agente Sintetizzatore: La correlazione multi-agente conferma un ciclo di attacco completo. Si raccomanda l'isolamento immediato."
  }
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', defaultLangCode: 'en-US' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳', defaultLangCode: 'hi-IN' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸', defaultLangCode: 'es-ES' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷', defaultLangCode: 'fr-FR' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪', defaultLangCode: 'de-DE' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵', defaultLangCode: 'ja-JP' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳', defaultLangCode: 'zh-CN' },
  { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦', defaultLangCode: 'ar-SA' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺', defaultLangCode: 'ru-RU' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', defaultLangCode: 'pt-BR' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', defaultLangCode: 'it-IT' }
];

export const AgentsConsolePage: React.FC<AgentsConsolePageProps> = ({ investigationId: initialInvId }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>(initialInvId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [suiteData, setSuiteData] = useState<MultiAgentSuiteResponse | null>(null);
  const [selectedAgentTab, setSelectedAgentTab] = useState<string>('all');
  const [copiedTrace, setCopiedTrace] = useState<boolean>(false);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  // --- Voice Text-to-Speech (TTS) & Multi-Language State ---
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const briefingQueueRef = useRef<Array<{ text: string; agentId: string }>>([]);

  // Load available investigations
  useEffect(() => {
    const fetchInvs = async () => {
      try {
        const list = await investigationsAPI.list();
        setInvestigations(list);
        if (list.length > 0 && !selectedInvId) {
          setSelectedInvId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load investigations for agents console:', err);
      }
    };
    fetchInvs();
  }, []);

  // Initialize browser speech synthesis voices & auto-detect language
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);

          // Find preferred voice matching currentLanguage
          const matchIdx = availableVoices.findIndex((v) =>
            v.lang.toLowerCase().startsWith(currentLanguage.toLowerCase())
          );
          if (matchIdx !== -1) {
            setSelectedVoiceIndex(matchIdx);
          } else {
            setSelectedVoiceIndex(0);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Sync selected voice when currentLanguage changes
  useEffect(() => {
    if (voices.length > 0) {
      const matchIdx = voices.findIndex((v) =>
        v.lang.toLowerCase().startsWith(currentLanguage.toLowerCase())
      );
      if (matchIdx !== -1) {
        setSelectedVoiceIndex(matchIdx);
      }
    }
  }, [currentLanguage, voices]);

  // Initial trigger or auto-run on case selection
  useEffect(() => {
    runSwarmAnalysis();
  }, [selectedInvId]);

  const runSwarmAnalysis = async () => {
    if (!suiteData) setLoading(true);
    stopSpeaking();
    try {
      const res = await multiAgentAPI.runAll(selectedInvId || undefined);
      setSuiteData(res);
    } catch (err) {
      console.error('Failed to execute multi-agent analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get localized speech script for an agent
  const getLocalizedScript = (agentId: string, fallbackText: string): string => {
    const langGroup = MULTI_LANG_SCRIPTS[currentLanguage];
    if (langGroup && langGroup[agentId]) {
      return langGroup[agentId];
    }
    // Check if English script is available
    if (MULTI_LANG_SCRIPTS['en'] && MULTI_LANG_SCRIPTS['en'][agentId]) {
      return MULTI_LANG_SCRIPTS['en'][agentId];
    }
    return fallbackText;
  };

  // --- Voice Synthesizer Controls ---
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
      briefingQueueRef.current = [];
    }
  };

  const pauseSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const speakText = (text: string, agentId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

    window.speechSynthesis.cancel();

    // Determine final text based on selected language
    const finalSpeechText = agentId ? getLocalizedScript(agentId, text) : text;

    const utterance = new SpeechSynthesisUtterance(finalSpeechText);

    // Explicitly configure voice and language
    const currentVoice = voices[selectedVoiceIndex];
    if (currentVoice) {
      utterance.voice = currentVoice;
      utterance.lang = currentVoice.lang;
    } else {
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
      utterance.lang = langConfig ? langConfig.defaultLangCode : 'en-US';
    }

    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setSpeakingAgentId(agentId || 'global');
    };

    utterance.onend = () => {
      // Process next in queue if in briefing mode
      if (briefingQueueRef.current.length > 0) {
        const next = briefingQueueRef.current.shift();
        if (next) {
          speakText(next.text, next.agentId);
          return;
        }
      }
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const playFullBriefing = () => {
    if (!suiteData || !suiteData.agents) return;
    stopSpeaking();

    const queue = suiteData.agents.map((ag) => ({
      text: ag.speech_text,
      agentId: ag.agent_id
    }));

    if (queue.length > 0) {
      const first = queue.shift();
      briefingQueueRef.current = queue;
      if (first) {
        speakText(first.text, first.agentId);
      }
    }
  };

  // Handle voice selection change and auto-detect language
  const handleVoiceChange = (newVoiceIndex: number) => {
    setSelectedVoiceIndex(newVoiceIndex);
    const selectedVoice = voices[newVoiceIndex];
    if (selectedVoice) {
      // Extract language code (e.g., 'hi-IN' -> 'hi', 'en-US' -> 'en')
      const langCode = selectedVoice.lang.split('-')[0].toLowerCase();
      const matched = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
      if (matched) {
        setCurrentLanguage(matched.code);
      }
    }
  };

  // Handle language selection change and auto-select matching voice
  const handleLanguageChange = (newLangCode: string) => {
    setCurrentLanguage(newLangCode);
    if (voices.length > 0) {
      const matchIdx = voices.findIndex((v) =>
        v.lang.toLowerCase().startsWith(newLangCode.toLowerCase())
      );
      if (matchIdx !== -1) {
        setSelectedVoiceIndex(matchIdx);
      }
    }
  };

  const copyTraceId = () => {
    if (suiteData?.langfuse_trace_id) {
      navigator.clipboard.writeText(suiteData.langfuse_trace_id);
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  // Helper to get agent icon
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'auth-sentinel':
        return <ShieldAlert className="w-5 h-5 text-blue-600" />;
      case 'db-exfiltration':
        return <Database className="w-5 h-5 text-purple-600" />;
      case 'privilege-os':
        return <Terminal className="w-5 h-5 text-emerald-600" />;
      case 'threat-synthesizer':
      default:
        return <Cpu className="w-5 h-5 text-indigo-600" />;
    }
  };

  // Filter traces based on active tab
  const filteredTraces: Array<{ agent: AgentResult; trace: AgentTraceStep }> = [];
  if (suiteData?.agents) {
    suiteData.agents.forEach((ag) => {
      if (selectedAgentTab === 'all' || selectedAgentTab === ag.agent_id) {
        ag.traces.forEach((tr) => {
          filteredTraces.push({ agent: ag, trace: tr });
        });
      }
    });
  }

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn text-slate-800">
      {/* Top Header & Execution Bar - Pure Light Aesthetic */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-wide flex items-center gap-2">
                  Multi-Agent CyberForensic Suite
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  LANGCHAIN SWARM
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Autonomous multi-agent log reasoning, MITRE correlation & voice briefing
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Case Selector */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-xs">
            <span className="text-slate-400 mr-2 font-medium">Case:</span>
            <select
              value={selectedInvId}
              onChange={(e) => setSelectedInvId(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-white text-slate-900">
                  {inv.name}
                </option>
              ))}
              {investigations.length === 0 && (
                <option value="" className="bg-white text-slate-900">
                  Default Demo Evidence Case
                </option>
              )}
            </select>
          </div>

          <button
            onClick={runSwarmAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-150 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Reasoning Swarm...' : 'Execute Multi-Agent Swarm'}
          </button>
        </div>
      </div>

      {/* LangFuse & LangChain Observability Bar - Crisp Light Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Latency */}
        <InteractiveTiltCard
          tiltAmount={4}
          glowColor="rgba(16, 185, 129, 0.08)"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Latency</p>
            <p className="text-lg font-mono font-bold text-emerald-600">
              {suiteData ? `${suiteData.execution_time_ms} ms` : '--'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
            <Clock className="w-4 h-4" />
          </div>
        </InteractiveTiltCard>

        {/* Tokens Processed */}
        <InteractiveTiltCard
          tiltAmount={4}
          glowColor="rgba(168, 85, 247, 0.08)"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Tokens Processed</p>
            <p className="text-lg font-mono font-bold text-purple-600">
              {suiteData?.tokens_processed ? `${suiteData.tokens_processed.toLocaleString()} tok` : '4,850 tok'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
            <Layers className="w-4 h-4" />
          </div>
        </InteractiveTiltCard>

        {/* Swarm ML Consensus */}
        <InteractiveTiltCard
          tiltAmount={4}
          glowColor="rgba(37, 99, 235, 0.08)"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Swarm Consensus</p>
            <p className="text-lg font-mono font-bold text-blue-600">
              {suiteData?.ml_confidence_score ? `${suiteData.ml_confidence_score}%` : '98%'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </InteractiveTiltCard>

        {/* Logs Inspected */}
        <InteractiveTiltCard
          tiltAmount={4}
          glowColor="rgba(217, 119, 6, 0.08)"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Events Analyzed</p>
            <p className="text-lg font-mono font-bold text-amber-600">
              {suiteData?.total_events_analyzed ? `${suiteData.total_events_analyzed} logs` : '10 logs'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <Brain className="w-4 h-4" />
          </div>
        </InteractiveTiltCard>

        {/* LangFuse Trace Tag */}
        <InteractiveTiltCard
          tiltAmount={4}
          glowColor="rgba(6, 182, 212, 0.08)"
          className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-cyan-300 hover:shadow-md flex items-center justify-between transition-all"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <p className="text-[11px] font-semibold text-slate-500">LangFuse Trace</p>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-[120px]">
              {suiteData?.langfuse_trace_id || 'lf-trace-active'}
            </p>
          </div>
          <button
            onClick={copyTraceId}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title="Copy LangFuse Trace ID"
          >
            {copiedTrace ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </InteractiveTiltCard>
      </div>

      {/* Voice Audio Synthesizer (TTS) Bar - Clean Light Mode & Multi-Language */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Speaking indicator & Equalizer animation */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Radio className={`w-5 h-5 ${isSpeaking && !isPaused ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Voice Briefing Synthesizer
              </h3>
              {isSpeaking && !isPaused && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  NARRATING
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {speakingAgentId
                ? `Speaker: ${suiteData?.agents.find((a) => a.agent_id === speakingAgentId)?.name || 'Forensics Swarm'}`
                : `Active Language: ${SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.label || 'English'}`}
            </p>
          </div>

          {/* Animated Audio Equalizer Visualizer */}
          <div className="hidden sm:flex items-center gap-1 ml-2 h-6">
            {[40, 75, 55, 90, 60, 80, 45, 95, 65, 50].map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-blue-600"
                animate={
                  isSpeaking && !isPaused
                    ? {
                        height: [4, h * 0.25, 4],
                        opacity: [0.6, 1, 0.6]
                      }
                    : { height: 4, opacity: 0.25 }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.4 + (i % 3) * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Audio Playback Controls & Multi-Language Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Explicit Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
              title="Select Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-slate-900">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Native Browser Voice Selector */}
          {voices.length > 0 && (
            <select
              value={selectedVoiceIndex}
              onChange={(e) => handleVoiceChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none max-w-[150px] truncate"
              title="Select Voice"
            >
              {voices.map((voice, idx) => (
                <option key={idx} value={idx} className="bg-white text-slate-900">
                  {voice.name.replace('Microsoft', '').replace('Google', '').trim()} ({voice.lang})
                </option>
              ))}
            </select>
          )}

          {/* Speed Selector */}
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            title="Speech Rate"
          >
            <option value="0.85">0.85x</option>
            <option value="1.0">1.0x</option>
            <option value="1.2">1.2x</option>
            <option value="1.5">1.5x</option>
          </select>

          {/* Play/Pause/Stop Buttons */}
          {!isSpeaking ? (
            <button
              onClick={playFullBriefing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Briefing
            </button>
          ) : isPaused ? (
            <button
              onClick={resumeSpeaking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseSpeaking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          <button
            onClick={stopSpeaking}
            disabled={!isSpeaking && !isPaused}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors border border-slate-200"
            title="Stop Speech"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (!isMuted) stopSpeaking();
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </div>

      {/* 4 Specialized AI Agents Grid - Interactive 3D Tilt & Light Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {suiteData?.agents.map((agent) => {
          const isCurrentSpeaker = speakingAgentId === agent.agent_id && isSpeaking;

          let glowCol = 'rgba(37, 99, 235, 0.16)';
          if (agent.agent_id === 'db-exfiltration') glowCol = 'rgba(147, 51, 234, 0.16)';
          else if (agent.agent_id === 'privilege-os') glowCol = 'rgba(16, 185, 129, 0.16)';
          else if (agent.agent_id === 'threat-synthesizer') glowCol = 'rgba(99, 102, 241, 0.16)';

          return (
            <InteractiveTiltCard
              key={agent.agent_id}
              glowColor={glowCol}
              tiltAmount={7}
              className={`p-5 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-xl ${
                isCurrentSpeaker
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-xs group-hover:scale-110 transition-transform">
                      {getAgentIcon(agent.agent_id)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{agent.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{agent.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      agent.threat_level === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : agent.threat_level === 'HIGH'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {agent.threat_level}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Confidence</span>
                    <p className="font-mono font-bold text-blue-600">{agent.confidence_score}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Latency</span>
                    <p className="font-mono font-bold text-emerald-600">{agent.latency_ms} ms</p>
                  </div>
                </div>

                {/* Key Findings List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Key Findings
                  </span>
                  <div className="space-y-1">
                    {agent.findings.slice(0, 2).map((finding, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
                        <ArrowRight className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Voice Play & Trace filter */}
              <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => speakText(agent.speech_text, agent.agent_id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isCurrentSpeaker
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isCurrentSpeaker ? 'Speaking...' : 'Listen to Report'}
                </button>

                <button
                  onClick={() => setSelectedAgentTab(agent.agent_id)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="View Traces for this Agent"
                >
                  Traces ({agent.traces.length})
                </button>
              </div>
            </InteractiveTiltCard>
          );
        })}
      </div>

      {/* LangChain / LangFuse Step-by-Step Execution Tracing Window - Light Theme */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header & Agent Tab Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Live Execution Tracing Window
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                  Thought → Action → Observation
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed step-by-step telemetry, tool invocation, and latency breakdown
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'all', label: 'All Traces' },
              { id: 'auth-sentinel', label: 'Auth Sentinel' },
              { id: 'db-exfiltration', label: 'DB Exfiltration' },
              { id: 'privilege-os', label: 'Privilege & OS' },
              { id: 'threat-synthesizer', label: 'Synthesizer' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAgentTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedAgentTab === tab.id
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trace Steps Timeline */}
        <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar">
          {filteredTraces.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No execution traces recorded yet. Click "Execute Multi-Agent Swarm" to run.
            </div>
          ) : (
            filteredTraces.map(({ agent, trace }, index) => {
              const isExpanded = expandedTraceIndex === index;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-150 shadow-xs hover:border-slate-300"
                >
                  {/* Step Summary Row */}
                  <div
                    onClick={() => setExpandedTraceIndex(isExpanded ? null : index)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2 shrink-0">
                        {getAgentIcon(agent.agent_id)}
                        <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          Step {trace.step_number}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 truncate">
                        <span className="text-[11px] font-mono text-blue-700 font-semibold truncate bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          [{trace.action}]
                        </span>
                        <span className="text-xs text-slate-600 truncate">{trace.thought}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {trace.tool_used && (
                        <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {trace.tool_used}
                        </span>
                      )}
                      <span className="text-xs font-mono text-emerald-700 font-bold">
                        {trace.latency_ms}ms
                      </span>
                      <span className="text-xs font-mono text-blue-700 font-bold">
                        {trace.confidence}%
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details (Thought -> Action -> Observation -> Verdict) */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                      {/* Thought */}
                      <div className="p-3 rounded-lg bg-white border border-purple-100 space-y-1 shadow-xs">
                        <div className="flex items-center gap-1.5 text-purple-700 text-[11px] font-bold uppercase tracking-wider">
                          <Brain className="w-3.5 h-3.5" />
                          <span>Thought (Agent Internal Reasoning)</span>
                        </div>
                        <p className="text-slate-700 text-xs font-sans leading-relaxed">
                          {trace.thought}
                        </p>
                      </div>

                      {/* Action & Tool */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Action / Tool Call</span>
                          </div>
                          {trace.tool_used && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Tool: <span className="text-blue-700 font-bold">{trace.tool_used}</span>
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-blue-700 bg-slate-50 p-2 rounded border border-slate-200">
                          {trace.action}()
                        </div>
                      </div>

                      {/* Observation */}
                      <div className="p-3 rounded-lg bg-white border border-amber-100 space-y-1 shadow-xs">
                        <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Observation (Execution Result)</span>
                        </div>
                        <p className="text-slate-700 text-xs font-sans leading-relaxed">
                          {trace.observation}
                        </p>
                      </div>

                      {/* Verdict */}
                      {trace.verdict && (
                        <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Step Verdict</span>
                          </div>
                          <p className="text-emerald-900 text-xs font-sans font-medium">
                            {trace.verdict}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Threat Synthesizer Summary & MITRE ATT&CK Matrix Panel - Pure Light */}
      {suiteData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Consolidated Verdict */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                  MITRE ATT&CK Killchain Reconstruction
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                CRITICAL SEVERITY INCIDENT
              </span>
            </div>

            {/* Killchain stages progress bar */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { stage: 'Initial Access', code: 'T1110', label: 'SSH Brute Force', color: 'border-red-200 bg-red-50 text-red-700' },
                { stage: 'Privilege Escalation', code: 'T1068', label: 'Root Sudo Spawn', color: 'border-orange-200 bg-orange-50 text-orange-700' },
                { stage: 'Credential Access', code: 'T1530', label: 'Vault SQL Query', color: 'border-purple-200 bg-purple-50 text-purple-700' },
                { stage: 'Data Exfiltration', code: 'T1041', label: 'SCP Egress Socket', color: 'border-blue-200 bg-blue-50 text-blue-700' }
              ].map((step, i) => (
                <div key={i} className={`p-2.5 rounded-xl border ${step.color} space-y-1 shadow-2xs`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>{step.code}</span>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] font-bold">{step.stage}</p>
                  <p className="text-[10px] opacity-90 truncate">{step.label}</p>
                </div>
              ))}
            </div>

            {/* Synthesizer Findings */}
            <div className="pt-2 space-y-1.5">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Consolidated Swarm Findings
              </h5>
              <div className="space-y-1">
                {suiteData.agents
                  .find((a) => a.agent_id === 'threat-synthesizer')
                  ?.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* SOC Remediation Playbook */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Immediate Containment Playbook</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-mono font-bold">
                    ACT-1
                  </span>
                  <div>
                    <p className="text-slate-900 font-semibold">Revoke User 'rahul' Session</p>
                    <p className="text-[11px] text-slate-500">Terminate active SSH TTY & invalidate Kerberos ticket.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-mono font-bold">
                    ACT-2
                  </span>
                  <div>
                    <p className="text-slate-900 font-semibold">Firewall Ingress Block</p>
                    <p className="text-[11px] text-slate-500">Drop all traffic from 192.168.1.50 at boundary edge.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-mono font-bold">
                    ACT-3
                  </span>
                  <div>
                    <p className="text-slate-900 font-semibold">Rotate Database Vault Keys</p>
                    <p className="text-[11px] text-slate-500">Re-encrypt customer_vault tables with fresh HSM secrets.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "CONTAINMENT CHECKLIST:\n1. Revoke user rahul credentials and terminate SSH session.\n2. Ingress block 192.168.1.50 on perimeter firewall.\n3. Rotate database vault encryption keys."
                );
                alert("Containment Checklist copied to clipboard!");
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Containment Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsConsolePage;
