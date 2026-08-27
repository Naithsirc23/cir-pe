import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const projects = [
  {
    number: "01",
    name: "CIR Dashboard",
    type: "Product system · Dashboard",
    description:
      "Un espacio de trabajo para convertir repositorios dispersos en proyectos visibles, organizables y accionables.",
    tags: ["React", "TypeScript", "GitHub API", "Product UX"],
    href: "https://dashboard-cir.vercel.app",
    repo: "https://github.com/Naithsirc23/cir-dashboard",
    tone: "sage",
    status: "Demo disponible",
  },
  {
    number: "02",
    name: "ELICONTABLE",
    type: "Business tool · Sistema interno",
    description:
      "Una herramienta orientada a simplificar operaciones y dar estructura a procesos que normalmente viven en hojas de cálculo.",
    tags: ["TypeScript", "Web app", "Workflow", "Data"],
    href: "#contacto",
    repo: "#contacto",
    tone: "ink",
    status: "Caso privado",
  },
  {
    number: "03",
    name: "Pinas Adventures",
    type: "Interactive product · Juego web",
    description:
      "Una experiencia lúdica que demuestra cómo combinar narrativa, interacción y tecnología para construir productos memorables.",
    tags: ["Game design", "JavaScript", "Interaction", "Storytelling"],
    href: "#contacto",
    repo: "https://github.com/Naithsirc23",
    tone: "coral",
    status: "En selección",
  },
];

const capabilities = [
  "Prototipos que se pueden usar",
  "Interfaces claras y accesibles",
  "Automatización de procesos",
  "IA aplicada al trabajo real",
];

export default function Home() {
  return (
    <div className="portfolio-site">
      <header className="site-header">
        <a className="wordmark" href="#inicio" aria-label="Cristhian S.I.R. — inicio">
          <span className="wordmark-mark">C</span>
          <span>Cristhian S.I.R.</span>
        </a>
        <nav className="site-nav" aria-label="Navegación principal">
          <a href="#proyectos">Proyectos</a>
          <a href="#enfoque">Enfoque</a>
          <a href="#sobre-mi">Sobre mí</a>
          <a className="nav-cta" href="#contacto">Hablemos <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="kicker"><span className="live-dot" /> Disponible para oportunidades remotas</p>
            <h1>Construyo productos digitales con <em>curiosidad</em> y criterio.</h1>
            <p className="hero-lede">
              Soy <strong>Cristhian Saúl Infante Rodríguez</strong>, Product Builder y AI-assisted Developer. Transformo ideas complejas en experiencias web útiles, claras y listas para crecer.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#proyectos">Ver proyectos <ArrowDown size={16} /></a>
              <a className="text-link" href="https://github.com/Naithsirc23" target="_blank" rel="noreferrer">Explorar GitHub <ExternalLink size={15} /></a>
            </div>
          </div>
          <div className="hero-aside" aria-label="Perfil profesional">
            <div className="portrait-placeholder"><span>CSI</span><span className="portrait-caption">product / code / context</span></div>
            <div className="hero-note"><Sparkles size={16} /><span>Entre lo humano y lo técnico.</span></div>
          </div>
        </section>

        <section className="signal-bar" aria-label="Áreas de trabajo">
          <span>Producto digital</span><span>Desarrollo web</span><span>IA aplicada</span><span>Automatización</span><span>Perú · remoto</span>
        </section>

        <section className="projects-section section" id="proyectos">
          <div className="section-intro">
            <div><p className="eyebrow">Muestras de trabajo</p><h2>Ideas convertidas<br /><em>en algo real.</em></h2></div>
            <p>Una selección de proyectos donde exploro cómo diseñar, construir y mejorar productos digitales con recursos concretos.</p>
          </div>
          <div className="project-list">
            {projects.map(project => <article className={`project-card ${project.tone}`} key={project.name}>
              <div className="project-number">{project.number}</div>
              <div className="project-main">
                <div className="project-heading"><div><p className="project-type">{project.type}</p><h3>{project.name}</h3></div><span className="project-status">{project.status}</span></div>
                <p className="project-description">{project.description}</p>
                <div className="project-bottom"><div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="project-links"><a href={project.href} target={project.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{project.href.startsWith("http") ? "Ver producto" : "Solicitar acceso"} <ArrowUpRight size={15} /></a><a className="repo-link" href={project.repo} target={project.repo.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><Github size={15} /> Código</a></div></div>
              </div>
            </article>)}
          </div>
        </section>

        <section className="split-section section" id="enfoque">
          <div className="split-label"><p className="eyebrow">Cómo trabajo</p><span className="section-index">02 / 04</span></div>
          <div className="split-content"><h2>Del problema a la primera versión, <em>sin perder de vista a la persona.</em></h2><p>Mi recorrido por la Filosofía, la Psicología Social, la Gestión Pública y el servicio al ciudadano me ayuda a mirar los productos desde más de un ángulo. Construyo con tecnología, pero decido con contexto.</p><div className="capability-grid">{capabilities.map((item, index) => <div className="capability" key={item}><span>0{index + 1}</span><Check size={16} />{item}</div>)}</div></div>
        </section>

        <section className="about-section section" id="sobre-mi">
          <div className="about-card"><p className="eyebrow">Sobre mí</p><h2>Una mezcla poco convencional. <em>Una ventaja práctica.</em></h2><p>Estudié Filosofía, culminé Psicología Social y cursé una Maestría en Gestión Pública. Hoy trabajo como servidor público en Migraciones, en el Aeropuerto Jorge Chávez, y en mi tiempo libre construyo productos web con asistencia de IA.</p><p>No me defino solo por el código. Me interesa entender el problema, ordenar la experiencia y entregar algo que funcione en el mundo real.</p><div className="about-meta"><span><MapPin size={15} /> Lima, Perú</span><span><WandSparkles size={15} /> AI-assisted development</span></div></div>
        </section>

        <section className="contact-section section" id="contacto"><div className="contact-inner"><p className="eyebrow">¿Construimos algo?</p><h2>Estoy buscando mi próxima oportunidad <em>remota.</em></h2><p>Si buscas a alguien con mirada de producto, sensibilidad por las personas y capacidad para convertir una idea en una primera versión, conversemos.</p><div className="contact-actions"><a className="button button-light" href="mailto:business.cir.pe@gmail.com"><Mail size={16} /> Escribirme por email</a><a className="contact-social" href="https://www.linkedin.com/in/csir23/" target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn <ExternalLink size={14} /></a></div></div></section>
      </main>

      <footer className="site-footer"><span>© 2026 Cristhian S.I.R.</span><span>Hecho con intención, código y café.</span><a href="#inicio">Volver arriba ↑</a></footer>
    </div>
  );
}
