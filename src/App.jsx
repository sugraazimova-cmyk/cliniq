import { useState, useRef, useEffect } from "react"

const allCases = [
  {
    id: 1,
    title: "Yorğunluq və arıqlama",
    specialty: "İnfeksion xəstəliklər",
    difficulty: "Çətin",
    patientSummary: "36 yaşlı kişi 6 aydır davam edən yorğunluq, aralıq temperatur, 7 kq çəki itkisi və xronik ishal şikayətləri ilə müraciət edir. Ağız boşluğunda yaralar və 3 həftədir güclənən quru öskürək qeyd edir. Dəfələrlə 'viral infeksiya' və 'IBS' diaqnozu ilə müalicə olunub, effekt yoxdur.",
    tags: ["36 yaş · Kişi", "Çəki itkisi", "Xronik ishal"],
    vitals: [
      { label: "Temp", value: "37.8°C" },
      { label: "Nəbz", value: "102" },
      { label: "AT", value: "108/70" },
      { label: "SpO2", value: "94%" },
    ],
    patientContext: `Sən 36 yaşlı Elnur adlı xəstəsən. 6 aydır yorğunluq, aralıq temperatur, 7 kq çəki itkisi və xronik ishal var. Ağız boşluğunda ağ örtük var, 3 həftədir quru öskürək var. Yük sürücüsüsən, tez-tez uzaq səfərlərə gedirsən. Birdən çox cinsi tərəfdaşın olub. İV narkotik istifadən olmayıb. Qan köçürməsi tarixçən yoxdur. Dəfələrlə "viral infeksiya" və "IBS" diaqnozu ilə müalicə olunmusan, effekt olmayıb. Cavablarını birinci şəxsdə, xəstə kimi ver — məsələn "Mənim..." deyə başla. Qısa və təbii danış, tibbi termin işlətmə.`,
    historyQuestions: [
      { q: "Peşəniz nədir?", a: "Yük sürücüsüdür, tez-tez uzaq səfərlərə gedir." },
      { q: "Son bir ildə cinsi həyatınız necə olub?", a: "Birdən çox cinsi tərəfdaşı olduğunu bildirir." },
      { q: "İV narkotik istifadəniz olubmu?", a: "Xeyr, heç vaxt istifadə etməyib." },
      { q: "Qan köçürməsi tarixçəniz varmı?", a: "Xeyr." },
    ],
    examinations: [
      { system: "Ağız boşluğu", finding: "Oral kandidiaz (ağ örtük) aşkar edildi — immunosuppressiyanın əlaməti" },
      { system: "Limfa düyünləri", finding: "Servikal və aksiller limfadenopatiya — ümumiləşmiş" },
      { system: "Ağciyərlər", finding: "Auskultasiyada ikitərəfli xırıltı eşidilir" },
      { system: "Dəri", finding: "Səpgi və sarılıq yoxdur" },
    ],
    investigations: [
      { test: "Tam qan analizi", result: "Normositar anemiya, CRP yüksək", relevant: true },
      { test: "Anti-HIV (ELISA)", result: "Müsbət — dərhal Western Blot ilə təsdiq lazımdır", relevant: true },
      { test: "CD4 sayı", result: "CD4: 180 hüceyrə/μL (normadan kəskin aşağı)", relevant: true },
      { test: "Döş qəfəsi rentgeni", result: "İkitərəfli interstisial infiltratlar — PCP ehtimalı", relevant: true },
      { test: "Qaraciyər fermentləri", result: "ALT/AST normada", relevant: false },
      { test: "Sidik analizi", result: "Normada", relevant: false },
    ],
    correctDiagnosis: "QİÇS (AIDS)",
    diagnosisKeywords: ["qiçs", "aids", "hiv", "immunodefisit"],
    explanationPoints: [
      "Anti-HIV müsbət, CD4 180 — AIDS mərhələsi",
      "Oral kandidiaz — immunosupressiyanın göstəricisi",
      "İkitərəfli ağciyər infiltratları — PCP pnevmoniyası",
      "Risk faktoru: çoxlu cinsi tərəfdaş",
      "Uzunmüddətli müalicəyə cavabsız simptomlar",
    ],
    treatmentPoints: [
      "Antiretroviral terapiya (ART): Tenofovir + Emtrisitabin + Efavirenz",
      "PCP profilaktikası: Kotrimoksazol",
      "Fırsatçı infeksiyaların müalicəsi",
      "CD4 və viral yük monitorinqi hər 3 ayda bir",
      "Psixoloji dəstək və yaxın kontaktların müayinəsi",
    ],
  },
  {
    id: 2,
    title: "Əldə yaralaşma",
    specialty: "İnfeksion xəstəliklər",
    difficulty: "Orta",
    patientSummary: "22 yaşlı çoban sol əlinin arxasında 7 həftədir yavaş-yavaş böyüyən yara ilə müraciət edir. Mal-qara yanında həşərat sancmasından sonra qaşınan papul kimi başlayıb, tədricən xoralanıb. Topikal antibiotiklər kömək etməyib.",
    tags: ["22 yaş · Kişi", "Dəri yarası", "Kənd bölgəsi"],
    vitals: [
      { label: "Temp", value: "36.9°C" },
      { label: "Nəbz", value: "76" },
      { label: "AT", value: "120/78" },
      { label: "SpO2", value: "99%" },
    ],
    patientContext: `Sən 22 yaşlı Tural adlı çobansa. Sol əlinin arxasında 7 həftədir böyüyən yara var. Həşərat sancmasından sonra başlayıb, getsə-getdikcə böyüyüb. Topikal antibiotiklər işə yaramayıb. Hər gün mal-qara ilə işləyirsən. Qonşu kənddə oxşar yarası olan birini tanıyırsan. Qızdırman yoxdur, ümumi vəziyyətin qənaətbəxşdir. Cavablarını birinci şəxsdə ver, sadə dillə danış.`,
    historyQuestions: [
      { q: "Peşəniz nədir, heyvanlarla təmasınız olurmu?", a: "Çobandır, hər gün mal-qara ilə işləyir." },
      { q: "Yara necə başladı?", a: "Həşərat sancmasından sonra qaşınan şişkinlik kimi başladı." },
      { q: "Antibiotik müalicəsi effektiv oldumu?", a: "Xeyr, topikal antibiotiklər heç bir dəyişiklik etmədi." },
      { q: "Bölgənizdə oxşar xəstəliklər olubmu?", a: "Qonşu kənddə oxşar yarası olan birini bilir." },
    ],
    examinations: [
      { system: "Dəri yarası", finding: "2 sm xora, qaldırılmış indurasiyalı kənarlar, qranülyar baza — klassik 'vulkan kratı' görünüşü" },
      { system: "Limfa düyünləri", finding: "Kiçik, ağrısız epitroklear limfa düyünü palpasiya olunur" },
      { system: "Ümumi vəziyyət", finding: "Qızdırma yoxdur, ümumi vəziyyət qaneedicidir" },
    ],
    investigations: [
      { test: "Leishmania serologiyası (rK39)", result: "Müsbət — kutanöz leişmaniyoza dəlalət edir", relevant: true },
      { test: "Yara sürtüntüsü (Giemsa)", result: "Amastigotlar görünür — Leishmania spp. təsdiqləndi", relevant: true },
      { test: "Tam qan analizi", result: "Normada, ESR yüngül yüksək", relevant: true },
      { test: "Göbələk mədəniyyəti", result: "Mənfi", relevant: false },
      { test: "TST (tuberkulin)", result: "Mənfi", relevant: false },
    ],
    correctDiagnosis: "Kutanöz leişmaniyoz",
    diagnosisKeywords: ["leişmaniyoz", "leishmania", "kutanöz", "dəri leişmaniyoz"],
    explanationPoints: [
      "Çoban — heyvanlarla təmas, həşərat sancması riski yüksək",
      "Klassik indurasiyalı kənarlı xora görünüşü",
      "Antibiotiklərə cavabsızlıq — bakterial deyil",
      "rK39 serologiyası və Giemsa boyası müsbət",
      "Ağrısız limfadenopatiya — leişmaniyoz üçün xarakterik",
    ],
    treatmentPoints: [
      "Meglumin antimonat (Glucantime) — lokal inyeksiya",
      "Ağır hallarda: Amfoterisin B",
      "Yara baxımı və infeksiyanın qarşısının alınması",
      "Həşəratlara qarşı qoruyucu tədbirlər",
      "6 ay sonra nəzarət müayinəsi",
    ],
  },
  {
    id: 3,
    title: "Uzunsürən qızdırma",
    specialty: "İnfeksion xəstəliklər",
    difficulty: "Çətin",
    patientSummary: "25 yaşlı qadın 12 gündür davam edən qızdırma (39–40°C), qarın ağrısı və ishal şikayətləri ilə təcili yardıma müraciət edir. Son iki gündür artan zəiflik və şüur bulanıqlığı qeyd edir.",
    tags: ["25 yaş · Qadın", "12 günlük qızdırma", "Qarın ağrısı"],
    vitals: [
      { label: "Temp", value: "39.8°C" },
      { label: "Nəbz", value: "88" },
      { label: "AT", value: "100/65" },
      { label: "SpO2", value: "96%" },
    ],
    patientContext: `Sən 25 yaşlı Aytən adlı xəstəsən. 12 gündür yüksək qızdırman var (39-40°C), qarın ağrın var, ishal var. Son 2 gündür zəiflik və başın bulanır. 3 həftə əvvəl kənd ərazisinə getmişdin, orada müxtəlif su mənbəyindən içmişdin. Qızdırma yavaş-yavaş başlayıb, tədricən artıb. Son 2 gündür baş ağrın da var. Cavablarını birinci şəxsdə ver, özünü çox xəstə hiss edən biri kimi danış.`,
    historyQuestions: [
      { q: "Qızdırma nə vaxtdan başlayıb?", a: "12 gün əvvəl yavaş-yavaş başlayıb, tədricən artıb." },
      { q: "Kənd rayonuna səfəriniz olubmu?", a: "3 həftə əvvəl kənd ərazisinə getmişdi." },
      { q: "İçməli su mənbəyi necədir?", a: "Kənddə müxtəlif su mənbəyindən içib." },
      { q: "Başqa simptomlar varmı?", a: "Son 2 gündür baş ağrısı və yüngül şüur bulanıqlığı var." },
    ],
    examinations: [
      { system: "Ümumi görünüş", finding: "Toksik görünüş, letarji" },
      { system: "Ürək-damar", finding: "Nisbi bradikardiya — qızdırmaya uyğun olmayan yavaş nəbz (xarakterik əlamət)" },
      { system: "Qarın", finding: "Sağ qasıq nahiyəsində ağrı, qarın şişkinliyi, bağırsaq səsləri azalmış" },
    ],
    investigations: [
      { test: "Qan mədəniyyəti", result: "Salmonella typhi üreməsi müsbət — tifozu təsdiqlər", relevant: true },
      { test: "Tam qan analizi", result: "Lökopenia: WBC 3.2×10⁹/L — xarakterik tapıntı", relevant: true },
      { test: "Widal testi", result: "Anti-O titrləri yüksək", relevant: true },
      { test: "Qarın rentgeni", result: "Hava-maye səviyyələri, pnevmoperitoneum şübhəsi — perforasiya riski!", relevant: true },
      { test: "ALT/AST", result: "Yüngül yüksəlmə", relevant: true },
      { test: "HBsAg", result: "Mənfi", relevant: false },
    ],
    correctDiagnosis: "Qarın tifi (Typhoid fever)",
    diagnosisKeywords: ["tif", "typhoid", "salmonella", "qarın tifi"],
    explanationPoints: [
      "Salmonella typhi qan mədəniyyətində üremişdir",
      "Nisbi bradikardiya — tif üçün klassik əlamət",
      "Lökopenia — bakterial infeksiya üçün qeyri-adi, tifə xasdır",
      "Kənd ərazisi, şübhəli su mənbəyi — risk faktoru",
      "Perforasiya riski — pnevmoperitoneum şübhəsi cərrahi konsultasiya tələb edir",
    ],
    treatmentPoints: [
      "Sefalosporinlər (Seftriakson 2q/gün IV) — birinci sıra",
      "Alternativ: Siprofloksasin (floroquinolon həssaslığı varsa)",
      "Yataq rejimi, hidrasiya",
      "Perforasiya şübhəsində cərrahi konsultasiya",
      "Epidemioloji araşdırma və kontaktların izlənməsi",
    ],
  },
  {
    id: 4,
    title: "Sarılıq və qaraciyər şişməsi",
    specialty: "İnfeksion xəstəliklər",
    difficulty: "Orta",
    patientSummary: "32 yaşlı kişi bir həftədir yorğunluq, ürək bulanması, tünd sidik və gözlərin sarıması ilə müraciət edir. Sarılıq başlamazdan əvvəl oynaq ağrısı və aşağı dərəcəli qızdırma olub. Üç ay əvvəl qorunmadan cinsi əlaqə tarixçəsi var.",
    tags: ["32 yaş · Kişi", "Sarılıq", "Qaraciyər"],
    vitals: [
      { label: "Temp", value: "37.4°C" },
      { label: "Nəbz", value: "82" },
      { label: "AT", value: "122/76" },
      { label: "SpO2", value: "98%" },
    ],
    patientContext: `Sən 32 yaşlı Kamran adlı xəstəsən. Bir həftədir yorğunluğun var, ürəyin bulanır, sidiin tündləşib, gözlərin sarılaşıb. Sarılıqdan 2 həftə əvvəl oynaq ağrın və hərarətin olmuşdu. 3 ay əvvəl qorunmadan cinsi əlaqən olub. Hepatit B əleyhinə peyvənd olmamısan. Assit və ensefalopatiya yoxdur. Cavablarını birinci şəxsdə ver, narahat amma sakit bir adam kimi danış.`,
    historyQuestions: [
      { q: "Sarılıq nə vaxtdan var?", a: "Təxminən 1 həftədir, gözlər sarılaşıb, sidik tündləşib." },
      { q: "Əvvəlcə başqa simptomlar oldumu?", a: "Bəli, 2 həftə əvvəl oynaq ağrısı və hərarət olmuşdu." },
      { q: "Son vaxtlar cinsi əlaqəniz olubmu?", a: "3 ay əvvəl qorunmadan cinsi əlaqə olub." },
      { q: "Peyvəndlənmisiniz?", a: "Hepatit B əleyhinə peyvənd olmayıb." },
    ],
    examinations: [
      { system: "Göz sklerası", finding: "İkterik skleralar — sarılıq aydın görünür" },
      { system: "Qarın", finding: "Qaraciyər yüngül böyümüş, kənarı düzgün, ağrılı" },
      { system: "Ümumi", finding: "Assit və ensefalopatiya yoxdur — qeyri-fulminant kurs" },
    ],
    investigations: [
      { test: "ALT/AST", result: "ALT: 1200 U/L, AST: 950 U/L — kəskin hepatoselülyar zədə", relevant: true },
      { test: "HBsAg", result: "Müsbət — aktiv HBV infeksiyası", relevant: true },
      { test: "Anti-HBc IgM", result: "Müsbət — kəskin infeksiya göstəricisi", relevant: true },
      { test: "Anti-HBs", result: "Mənfi — immunitet yoxdur", relevant: true },
      { test: "Ümumi bilirubin", result: "6.8 mg/dL (yüksək)", relevant: true },
      { test: "Anti-HCV", result: "Mənfi", relevant: false },
    ],
    correctDiagnosis: "Kəskin Hepatit B",
    diagnosisKeywords: ["hepatit b", "hbv", "kəskin hepatit", "hepatit"],
    explanationPoints: [
      "HBsAg müsbət + Anti-HBc IgM müsbət = kəskin HBV",
      "ALT 1200 U/L — kəskin hepatoselülyar zədə",
      "3 ay əvvəl qorunmadan cinsi əlaqə — inkubasiya dövrünə uyğun",
      "Peyvəndsizlik — risk faktoru",
      "Assit/ensefalopatiya yoxdur — fulminant deyil",
    ],
    treatmentPoints: [
      "Çox hallarda kəskin HBV özbaşına keçir — dəstəkləyici müalicə",
      "İstirahət, qaraciyərə zəhərli maddələrdən çəkinmə (alkohol, hepatotoksik dərmanlar)",
      "Fulminant hepatit varsa: Tenofovir",
      "Qaraciyər funksiyasına həftəlik nəzarət",
      "Yaxın kontaktların peyvəndi tövsiyə edilir",
    ],
  },
  {
    id: 5,
    title: "Göz düşməsi və udma çətinliyi",
    specialty: "İnfeksion xəstəliklər",
    difficulty: "Çətin",
    patientSummary: "37 yaşlı kişi 18 saat əvvəl başlayan görmə bulanıqlığı, göz qapağı sallanması (ptoz), udma çətinliyi və baş ağrısı ilə müraciət edir. Kənd ərazisindən gətirilən ev konservindən ət yemişdir.",
    tags: ["37 yaş · Kişi", "Neyroloji simptomlar", "Ev konservi"],
    vitals: [
      { label: "Temp", value: "36.6°C" },
      { label: "Nəbz", value: "68" },
      { label: "AT", value: "115/72" },
      { label: "SpO2", value: "96%" },
    ],
    patientContext: `Sən 37 yaşlı Rauf adlı xəstəsən. 18 saat əvvəl görmən bulanıb, göz qapaqların sallanıb, udmağa çətinlik çəkirsən, başın ağrıyır. 18 saat əvvəl ev konservindən ət yemişdin. Qardaşın da eyni yeməyi yeyib və ona da oxşar simptomlar başlayıb. Qızdırman yoxdur. Nəfəs almaq çətinləşib, özünü çox halsız hiss edirsən. Şüurun tam yerindədir. Cavablarını birinci şəxsdə ver, qorxmuş və zəif bir adam kimi danış.`,
    historyQuestions: [
      { q: "Nə yemişdiniz simptomlardan əvvəl?", a: "18 saat əvvəl ev konservindən ət yemişdir." },
      { q: "Başqa ailə üzvlərinin simptomları varmı?", a: "Eyni yeməyi yimiş qardaşında da oxşar simptomlar başlayıb." },
      { q: "Qızdırma var mı?", a: "Xeyr, temperatur normaldır." },
      { q: "Nəfəs almaqda çətinlik varmı?", a: "Nəfəs dərin və yavaşdır, halsızlıq hiss edir." },
    ],
    examinations: [
      { system: "Göz", finding: "Sabit genişlənmiş göz bəbəkləri, oftalmoplegia — xarici göz əzələlərinin iflici" },
      { system: "Ağız/boğaz", finding: "Selikli qişalar quru, dysphonia (zəif səs), udma çətin" },
      { system: "Əzələ/reflektor", finding: "Ümumiləşmiş əzələ zəifliyi, hipotoniya, dərin vətər refleksləri azalmış" },
      { system: "Şüur", finding: "Şüur tam qorunub — botulizm üçün xarakterik" },
    ],
    investigations: [
      { test: "Botulinum toksini (qan/nəcis)", result: "Müsbət — Clostridium botulinum toksini təsdiqləndi", relevant: true },
      { test: "Elektromiaqrafiya (EMG)", result: "Neyromuskular blok — botulizm üçün xarakterik pattern", relevant: true },
      { test: "Spirometriya / tənəffüs funksiyası", result: "FVC azalıb — tənəffüs dəstəyi lazım ola bilər", relevant: true },
      { test: "KT beyin", result: "Normada — struktur patologiya yoxdur", relevant: false },
      { test: "Lumbal punksiya", result: "Normada — Guillain-Barré istisna olundu", relevant: false },
    ],
    correctDiagnosis: "Botulizm",
    diagnosisKeywords: ["botulizm", "botulinum", "clostridium botulinum"],
    explanationPoints: [
      "Ev konservi — Clostridium botulinum üçün əsas mənbə",
      "Ptoz, oftalmoplegia, udma çətinliyi — kranial sinir tutulması",
      "Qızdırma YOX — toksinin birbaşa təsiri, infeksiya deyil",
      "Şüur qorunub — botulizm üçün xarakterik",
      "Ailə üzvlərinin eyni yeməkdən xəstələnməsi — sübut",
    ],
    treatmentPoints: [
      "Botulinum antitoksini (trivalent) — mümkün qədər tez verin",
      "Tənəffüs dəstəyi — tənəffüs iflici riski var, ICU-ya qəbul",
      "Mədə yuma (yenilik yenicə qəbul edilmişsə)",
      "Dəstəkləyici qulluq — bəzən həftələr-aylar sürmür",
      "Epidemioloji bildiriş — qalan konserv məhsullarını imha et",
    ],
  },
]

function norm(s) {
  return s.toLowerCase().replace(/[\s/() -]/g, "")
}

const ALIASES = [
  ["alt", "altast"],
  ["ast", "altast"],
  ["altast", "altast"],
  ["ferment", "ferment"],
  ["qaraciyərferment", "ferment"],
  ["hbsag", "hbsag"],
  ["antihbc", "antihbc"],
  ["hbc", "antihbc"],
  ["antihbs", "antihbs"],
  ["hbs", "antihbs"],
  ["bilirubin", "bilirubin"],
  ["antihiv", "antihiv"],
  ["hiv", "antihiv"],
  ["cd4", "cd4"],
  ["rentgen", "rentgen"],
  ["cxr", "rentgen"],
  ["döşrentgen", "döşqəfəsi"],
  ["tamqan", "tamqan"],
  ["qananalizi", "tamqan"],
  ["klinikalıqan", "tamqan"],
  ["leishmania", "leishmania"],
  ["leişmania", "leishmania"],
  ["rk39", "rk39"],
  ["giemsa", "giemsa"],
  ["yarasürtüntüsü", "sürtüntü"],
  ["qanmədəniyyəti", "mədəniyyəti"],
  ["hemokültur", "mədəniyyəti"],
  ["widal", "widal"],
  ["qarınrentgen", "qarınrentgeni"],
  ["botulinum", "botulinum"],
  ["emg", "emg"],
  ["elektromiaqrafiya", "emg"],
  ["spirometriya", "spirometriya"],
  ["tənəffüs", "spirometriya"],
  ["kt", "ktbeyin"],
  ["ktbeyin", "ktbeyin"],
  ["lumbal", "lumbal"],
  ["lp", "lumbal"],
  ["antihcv", "antihcv"],
  ["hepatitc", "antihcv"],
  ["göbələk", "göbələk"],
  ["tst", "tst"],
  ["tuberkulin", "tst"],
  ["sidik", "sidik"],
]

const STEPS = ["Anamnez", "Müayinə", "Analizlər", "Diaqnoz", "Müalicə", "Nəticə"]
const MAX_QUESTIONS = 5

async function askPatient(question, historyQuestions) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, historyQuestions }),
    })
    const data = await response.json()
    console.log("API response:", data)
    return data.content?.[0]?.text || "Bağışlayın, bu sualı başa düşmədim. Başqa cür soruşa bilərsiniz."
  } catch (err) {
    console.error("API error:", err)
    return "Bağışlayın, bu sualı başa düşmədim. Başqa cür soruşa bilərsiniz."
  }
}

export default function App() {
  const [selectedCase, setSelectedCase] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  const [conversation, setConversation] = useState([])
  const [questionInput, setQuestionInput] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [anamnesisComplete, setAnamnesisComplete] = useState(false)
  const chatEndRef = useRef(null)

  const [examined, setExamined] = useState([])
  const [orderedTests, setOrderedTests] = useState([])
  const [testInput, setTestInput] = useState("")
  const [testFeedback, setTestFeedback] = useState(null)
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [score, setScore] = useState(0)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation, isAsking])

  async function handleAskQuestion() {
  if (!questionInput.trim() || isAsking || questionsUsed >= MAX_QUESTIONS) return

  const question = questionInput.trim()
  setQuestionInput("")
  setIsAsking(true)

  // Show clean question in UI, send enhanced prompt to API
  const displayMessage = { role: "user", content: question }
  const apiMessage = { role: "user", content: `[Xəstə kimi cavab ver, Azərbaycan dilində, qısa və təbii. Tibbi termin işlətmə.] ${question}` }

  // For display
  setConversation(prev => [...prev, displayMessage])
  setQuestionsUsed(q => q + 1)

  // For API: use clean history + enhanced current question
  const cleanHistory = conversation.filter(m =>
  m.role === "assistant" ? !m.content.includes("Bağışlayın") : true
)
  const apiConversation = [...cleanHistory, apiMessage]

  console.log("Sending to Gemini:", JSON.stringify(apiConversation))  // ADD THIS LINE

  try {
const answer = await askPatient(question, selectedCase.historyQuestions)
    const matched = selectedCase.historyQuestions.some(hq =>
      question.toLowerCase().includes(hq.q.toLowerCase().slice(0, 8)) ||
      hq.q.toLowerCase().includes(question.toLowerCase().slice(0, 8))
    )
    if (matched) setScore(s => s + 5)
    setConversation(prev => [...prev, { role: "assistant", content: answer }])
  } catch {
  // don't pollute conversation history with error messages
}

  setIsAsking(false)

  if (questionsUsed + 1 >= MAX_QUESTIONS) {
    setAnamnesisComplete(true)
  }
}

  function toggle(list, setList, index, points = 0) {
    if (!list.includes(index)) {
      setList([...list, index])
      setScore(s => s + points)
    }
  }

  function submitTest() {
    if (!testInput.trim()) return
    const c = selectedCase
    const inputNorm = norm(testInput)
    const aliasEntry = ALIASES.find(([key]) => inputNorm.includes(key) || key.includes(inputNorm))
    const fragment = aliasEntry ? aliasEntry[1] : inputNorm
    const match = c.investigations.findIndex(inv => norm(inv.test).includes(fragment))

    if (match !== -1 && !orderedTests.includes(match)) {
      const inv = c.investigations[match]
      setOrderedTests(prev => [...prev, match])
      setTestFeedback({ type: inv.relevant ? "good" : "warning", test: inv.test, result: inv.result, message: inv.relevant ? "Düzgün seçim" : "Bu test lazımsızdır — xərci artırır", points: inv.relevant ? 10 : -5 })
      setScore(s => s + (inv.relevant ? 10 : -5))
    } else if (match !== -1 && orderedTests.includes(match)) {
      setTestFeedback({ type: "info", test: testInput, result: "", message: "Bu test artıq sifariş edilib", points: 0 })
    } else {
      setTestFeedback({ type: "error", test: testInput, result: "", message: "Tapılmadı. Fərqli yazın (məs: ALT, HBsAg, Widal...)", points: 0 })
    }
    setTestInput("")
  }

  function submitTestDirect(value) {
    const c = selectedCase
    const clean = (s) => s.toLowerCase()
      .replace(/ı/g, "i").replace(/ə/g, "e").replace(/ö/g, "o")
      .replace(/ü/g, "u").replace(/ğ/g, "g").replace(/ş/g, "s")
      .replace(/ç/g, "c").replace(/İ/g, "i").replace(/[^a-z0-9]/g, "")
    const input = clean(value)
    const match = c.investigations.findIndex(inv => {
      const t = clean(inv.test)
      return t.includes(input) || input.includes(t)
    })
    if (match !== -1 && !orderedTests.includes(match)) {
      const inv = c.investigations[match]
      setOrderedTests(prev => [...prev, match])
      setTestFeedback({ type: inv.relevant ? "good" : "warning", test: inv.test, result: inv.result, message: inv.relevant ? "Düzgün seçim" : "Bu test lazımsızdır — xərci artırır", points: inv.relevant ? 10 : -5 })
      setScore(s => s + (inv.relevant ? 10 : -5))
    } else if (match !== -1) {
      setTestFeedback({ type: "info", test: value, result: "", message: "Bu test artıq sifariş edilib", points: 0 })
    } else {
      setTestFeedback({ type: "error", test: value, result: "", message: "Tapılmadı", points: 0 })
    }
  }

  function checkDiagnosis() {
    const input = diagnosis.toLowerCase()
    const correct = selectedCase.diagnosisKeywords.some(k => input.includes(k))
    setScore(s => s + (correct ? 20 : 0))
    setCurrentStep(4)
  }

  function resetAll() {
    setSelectedCase(null)
    setCurrentStep(0)
    setConversation([])
    setQuestionInput("")
    setIsAsking(false)
    setQuestionsUsed(0)
    setAnamnesisComplete(false)
    setExamined([])
    setOrderedTests([])
    setTestInput("")
    setTestFeedback(null)
    setDiagnosis("")
    setTreatment("")
    setScore(0)
  }

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-stone-100 p-4">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-medium text-indigo-700">ClinIQ</span>
            <span className="text-sm text-stone-400">Azərbaycan Tibbi Simulator</span>
          </div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Xəstə seçin</p>
          {allCases.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className="bg-white border border-stone-200 rounded-xl p-4 mb-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-stone-800">{c.title}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full
                  ${c.difficulty === "Çətin" ? "bg-red-100 text-red-700" :
                    c.difficulty === "Orta" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"}`}>
                  {c.difficulty}
                </span>
              </div>
              <p className="text-xs text-stone-400">{c.specialty}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const c = selectedCase
  const questionsLeft = MAX_QUESTIONS - questionsUsed

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-xl mx-auto">

        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-medium text-indigo-700">ClinIQ</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {score} xal
            </span>
            <button onClick={resetAll} className="text-xs text-stone-400 hover:text-stone-600">
              ← Geri
            </button>
          </div>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-stone-200 mb-4">
          {STEPS.map((step, i) => (
            <div key={step} className={`flex-1 py-2 text-center text-xs font-medium border-r border-stone-200 last:border-r-0
              ${i === currentStep ? "bg-indigo-100 text-indigo-700" :
                i < currentStep ? "bg-emerald-50 text-emerald-700" : "bg-white text-stone-400"}`}>
              {step}
            </div>
          ))}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Xəstənin təqdimatı</p>
          <p className="text-sm text-stone-800 leading-relaxed mb-3">{c.patientSummary}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {c.tags.map((tag, i) => (
              <span key={i} className={`text-xs font-medium px-3 py-1 rounded-full
                ${i === 0 ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800"}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Həyati göstəricilər</p>
          <div className="grid grid-cols-4 gap-2">
            {c.vitals.map((v) => (
              <div key={v.label} className="bg-stone-100 rounded-lg p-2 text-center">
                <p className="text-sm font-medium text-stone-800">{v.value}</p>
                <p className="text-xs text-stone-400">{v.label}</p>
              </div>
            ))}
          </div>
        </div>

        {currentStep === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Xəstəyə sual verin</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full
                ${questionsLeft > 2 ? "bg-emerald-100 text-emerald-700" :
                  questionsLeft > 0 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"}`}>
                {questionsLeft > 0 ? `${questionsLeft} sual qaldı` : "Suallar bitdi"}
              </span>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 mb-3 min-h-32 max-h-72 overflow-y-auto flex flex-col gap-3">
              {conversation.length === 0 && (
                <p className="text-xs text-stone-400 text-center mt-4">
                  Xəstəyə istədiyiniz sualı yazın. Məsələn: "Şikayətləriniz nə vaxtdan başlayıb?"
                </p>
              )}
              {conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm"}`}>
                    {msg.role === "assistant" && (
                      <p className="text-xs font-medium text-stone-400 mb-1">Xəstə</p>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-xl rounded-bl-sm px-3 py-2">
                    <p className="text-xs font-medium text-stone-400 mb-1">Xəstə</p>
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!anamnesisComplete && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder="Sualınızı yazın..."
                  disabled={isAsking || questionsLeft === 0}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:bg-stone-50 disabled:text-stone-400"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !questionInput.trim() || questionsLeft === 0}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-stone-300 transition-colors">
                  Soruş
                </button>
              </div>
            )}

            {anamnesisComplete && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-medium text-amber-700 mb-2">📋 Anamnez tamamlandı — topladığınız məlumat:</p>
                <div className="flex flex-col gap-1">
                  {conversation
                    .filter(m => m.role === "user")
                    .map((m, i) => (
                      <p key={i} className="text-xs text-stone-600">• {m.content}</p>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Hansı sistemi müayinə etmək istərsiniz?</p>
            <div className="flex flex-col gap-2">
              {c.examinations.map((item, i) => (
                <div key={i}>
                  <button onClick={() => toggle(examined, setExamined, i, 8)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                      ${examined.includes(i) ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                    {item.system}
                  </button>
                  {examined.includes(i) && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-1 border border-emerald-200">
                      {item.finding}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Analiz sifariş edin</p>
            <p className="text-xs text-stone-400 mb-3">Analiz adını yazın və göndərin. Lazımsız testlər xal azaldır.</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {["Tam qan", "ALT", "HBsAg", "Anti-HIV", "CD4", "Widal", "Qan mədəniyyəti", "Rentgen", "Bilirubin", "Leishmania", "Botulinum", "EMG"].map(hint => (
                <button key={hint} onClick={() => submitTestDirect(hint)}
                  className="text-xs bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-500 px-2 py-1 rounded border border-stone-200 transition-colors">
                  {hint}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTest()}
                placeholder="məs: ALT, HBsAg, Widal..."
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <button onClick={submitTest}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Sifariş et
              </button>
            </div>
            {testFeedback && (
              <div className={`rounded-lg px-3 py-2 mb-3 border text-sm
                ${testFeedback.type === "good" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                  testFeedback.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
                  testFeedback.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
                  "bg-stone-50 border-stone-200 text-stone-700"}`}>
                <p className="font-medium">{testFeedback.message} {testFeedback.points !== 0 && `(${testFeedback.points > 0 ? "+" : ""}${testFeedback.points} xal)`}</p>
                {testFeedback.result && <p className="mt-1">{testFeedback.result}</p>}
              </div>
            )}
            {orderedTests.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Sifariş edilmiş testlər</p>
                <div className="flex flex-col gap-1">
                  {orderedTests.map((idx) => (
                    <div key={idx} className={`text-xs px-2 py-1 rounded flex justify-between
                      ${c.investigations[idx].relevant ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <span>{c.investigations[idx].test}</span>
                      <span>{c.investigations[idx].relevant ? "✓" : "⚠ lazımsız"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Diaqnozunuzu daxil edin</p>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Əsas diaqnoz..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 mb-4 outline-none focus:border-indigo-400"
            />
            <button
              onClick={checkDiagnosis}
              disabled={!diagnosis.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-xl text-sm transition-colors">
              Diaqnozu təsdiqlə
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə planınızı daxil edin</p>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Müalicə, dərmanlar, göndərişlər..."
              rows={5}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-indigo-400 resize-none"
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="mb-3">
            <div className={`rounded-xl p-4 mb-3 border ${
              selectedCase.diagnosisKeywords.some(k => diagnosis.toLowerCase().includes(k))
                ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1 text-stone-500">Yekun xal</p>
              <p className="text-3xl font-medium text-stone-800 mb-1">{score} xal</p>
              <p className="text-sm text-stone-600">Düzgün diaqnoz: <span className="font-medium text-indigo-700">{c.correctDiagnosis}</span></p>
              <p className="text-sm text-stone-600 mt-1">Sizin cavab: <span className="font-medium">{diagnosis || "Daxil edilməyib"}</span></p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Diaqnostik əsaslar</p>
              <div className="flex flex-col gap-1">
                {c.explanationPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə protokolu</p>
              <div className="flex flex-col gap-1">
                {c.treatmentPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="text-indigo-400 mt-0.5">→</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={resetAll}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              Başqa xəstə seç →
            </button>
          </div>
        )}

        {currentStep < 5 && currentStep !== 3 && (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={currentStep === 0 && !anamnesisComplete && questionsUsed === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            Növbəti mərhələ →
          </button>
        )}

      </div>
    </div>
  )
}
