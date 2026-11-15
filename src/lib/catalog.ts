/* ------------------------------------------------------------------ */
/*  Catálogo orientativo: oposiciones → leyes que suelen entrar         */
/*  (cada convocatoria concreta puede variar: revisa siempre tus bases) */
/* ------------------------------------------------------------------ */

export interface CatalogLaw {
  key: string;
  name: string;
  shortName: string;
  boeId: string;
  topic: string;
}

export interface Oposicion {
  id: string;
  name: string;
  group: string;
  emoji: string;
  description: string;
  aliases: string;
  laws: string[];
}

const L = (key: string, shortName: string, name: string, boeId: string, topic: string): CatalogLaw => ({
  key, shortName, name, boeId, topic,
});

export const CATALOG_LAWS: Record<string, CatalogLaw> = Object.fromEntries(
  [
    L("ce", "CE", "Constitución Española de 1978", "BOE-A-1978-31229", "Derechos fundamentales, Corona, Cortes, Gobierno, Poder Judicial, TC"),
    L("lpac", "LPAC", "Ley 39/2015, del Procedimiento Administrativo Común de las Administraciones Públicas", "BOE-A-2015-10565", "Acto y procedimiento administrativo, recursos"),
    L("lrjsp", "LRJSP", "Ley 40/2015, de Régimen Jurídico del Sector Público", "BOE-A-2015-10566", "Órganos, competencia, Administración General del Estado"),
    L("ebep", "TREBEP", "Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público", "BOE-A-2015-11719", "Empleados públicos: derechos, deberes, acceso"),
    L("lgob", "Ley del Gobierno", "Ley 50/1997, del Gobierno", "BOE-A-1997-25336", "Presidente, Consejo de Ministros, potestad reglamentaria"),
    L("transp", "Transparencia", "Ley 19/2013, de transparencia, acceso a la información pública y buen gobierno", "BOE-A-2013-12887", "Publicidad activa y derecho de acceso"),
    L("lopdgdd", "LOPDGDD", "Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales", "BOE-A-2018-16673", "Protección de datos y derechos digitales"),
    L("lcsp", "LCSP", "Ley 9/2017, de Contratos del Sector Público", "BOE-A-2017-12902", "Contratación pública"),
    L("lgp", "LGP", "Ley 47/2003, General Presupuestaria", "BOE-A-2003-21614", "Presupuestos y control del gasto"),
    L("lgsub", "LGS", "Ley 38/2003, General de Subvenciones", "BOE-A-2003-20977", "Subvenciones públicas"),
    L("lgt", "LGT", "Ley 58/2003, General Tributaria", "BOE-A-2003-23186", "Tributos, procedimientos de gestión e inspección"),
    L("irpf", "IRPF", "Ley 35/2006, del Impuesto sobre la Renta de las Personas Físicas", "BOE-A-2006-20764", "Renta de las personas físicas"),
    L("iva", "IVA", "Ley 37/1992, del Impuesto sobre el Valor Añadido", "BOE-A-1992-28740", "IVA"),
    L("is", "IS", "Ley 27/2014, del Impuesto sobre Sociedades", "BOE-A-2014-12328", "Impuesto de sociedades"),
    L("lopj", "LOPJ", "Ley Orgánica 6/1985, del Poder Judicial", "BOE-A-1985-12666", "Organización de juzgados y tribunales"),
    L("lec", "LEC", "Ley 1/2000, de Enjuiciamiento Civil", "BOE-A-2000-323", "Proceso civil"),
    L("lecrim", "LECrim", "Real Decreto de 14 de septiembre de 1882, Ley de Enjuiciamiento Criminal", "BOE-A-1882-6036", "Proceso penal"),
    L("ljca", "LJCA", "Ley 29/1998, reguladora de la Jurisdicción Contencioso-administrativa", "BOE-A-1998-16718", "Proceso contencioso-administrativo"),
    L("lrjs", "LRJS", "Ley 36/2011, reguladora de la Jurisdicción Social", "BOE-A-2011-15936", "Proceso laboral"),
    L("cp", "CP", "Ley Orgánica 10/1995, del Código Penal", "BOE-A-1995-25444", "Delitos y penas"),
    L("cc", "CC", "Real Decreto de 24 de julio de 1889, por el que se publica el Código Civil", "BOE-A-1889-4763", "Derecho civil común"),
    L("loi", "LOIEMH", "Ley Orgánica 3/2007, para la igualdad efectiva de mujeres y hombres", "BOE-A-2007-6115", "Igualdad"),
    L("lovg", "LOVG", "Ley Orgánica 1/2004, de Medidas de Protección Integral contra la Violencia de Género", "BOE-A-2004-21760", "Violencia de género"),
    L("et", "ET", "Real Decreto Legislativo 2/2015, Texto Refundido de la Ley del Estatuto de los Trabajadores", "BOE-A-2015-11430", "Relación laboral"),
    L("lgss", "LGSS", "Real Decreto Legislativo 8/2015, Texto Refundido de la Ley General de la Seguridad Social", "BOE-A-2015-11724", "Seguridad Social"),
    L("lprl", "LPRL", "Ley 31/1995, de Prevención de Riesgos Laborales", "BOE-A-1995-24292", "Prevención de riesgos laborales"),
    L("lofcs", "LOFCS", "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad", "BOE-A-1986-6859", "Fuerzas y Cuerpos de Seguridad"),
    L("lopsc", "LOPSC", "Ley Orgánica 4/2015, de protección de la seguridad ciudadana", "BOE-A-2015-3442", "Seguridad ciudadana"),
    L("lextr", "LOEX", "Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros en España", "BOE-A-2000-544", "Extranjería"),
    L("trafico", "LTSV", "Real Decreto Legislativo 6/2015, Texto Refundido de la Ley de Tráfico y Seguridad Vial", "BOE-A-2015-11722", "Tráfico y seguridad vial"),
    L("menor", "LOPJM", "Ley Orgánica 1/1996, de Protección Jurídica del Menor", "BOE-A-1996-1069", "Protección del menor"),
    L("victima", "Estatuto víctima", "Ley 4/2015, del Estatuto de la víctima del delito", "BOE-A-2015-4606", "Derechos de las víctimas"),
    L("lbrl", "LBRL", "Ley 7/1985, Reguladora de las Bases del Régimen Local", "BOE-A-1985-5392", "Régimen local"),
    L("trlrhl", "TRLRHL", "Real Decreto Legislativo 2/2004, Texto Refundido de la Ley Reguladora de las Haciendas Locales", "BOE-A-2004-4214", "Haciendas locales"),
    L("lotc", "LOTC", "Ley Orgánica 2/1979, del Tribunal Constitucional", "BOE-A-1979-23709", "Tribunal Constitucional"),
    L("loreg", "LOREG", "Ley Orgánica 5/1985, del Régimen Electoral General", "BOE-A-1985-11672", "Elecciones"),
    L("logp", "LOGP", "Ley Orgánica 1/1979, General Penitenciaria", "BOE-A-1979-23708", "Sistema penitenciario"),
    L("rp", "RP", "Real Decreto 190/1996, por el que se aprueba el Reglamento Penitenciario", "BOE-A-1996-3307", "Reglamento penitenciario"),
    L("lgsan", "Ley Gral. Sanidad", "Ley 14/1986, General de Sanidad", "BOE-A-1986-10499", "Sistema sanitario"),
    L("autonomia", "Autonomía paciente", "Ley 41/2002, básica reguladora de la autonomía del paciente", "BOE-A-2002-22188", "Derechos del paciente e historia clínica"),
    L("lops", "LOPS", "Ley 44/2003, de ordenación de las profesiones sanitarias", "BOE-A-2003-21340", "Profesiones sanitarias"),
    L("estmarco", "Estatuto Marco", "Ley 55/2003, del Estatuto Marco del personal estatutario de los servicios de salud", "BOE-A-2003-23101", "Personal estatutario"),
    L("loe", "LOE", "Ley Orgánica 2/2006, de Educación", "BOE-A-2006-7899", "Sistema educativo"),
    L("lomloe", "LOMLOE", "Ley Orgánica 3/2020, por la que se modifica la Ley Orgánica 2/2006, de Educación", "BOE-A-2020-17264", "Reforma educativa"),
    L("igualtrato", "Igualdad de trato", "Ley 15/2022, integral para la igualdad de trato y la no discriminación", "BOE-A-2022-11589", "No discriminación"),
    L("informantes", "Informantes", "Ley 2/2023, reguladora de la protección de las personas que informen sobre infracciones normativas", "BOE-A-2023-4513", "Canal de denuncias"),
    L("patrimonio", "LPAP", "Ley 33/2003, del Patrimonio de las Administraciones Públicas", "BOE-A-2003-20254", "Bienes públicos"),
  ].map((l) => [l.key, l]),
);

const O = (
  id: string, name: string, group: string, emoji: string, description: string, aliases: string, laws: string[],
): Oposicion => ({ id, name, group, emoji, description, aliases, laws });

const COMUN = ["ce", "lpac", "lrjsp", "ebep"];

export const OPOSICIONES: Oposicion[] = [
  O("aux-age", "Auxiliar Administrativo del Estado (C2)", "Administración General", "🗂️",
    "Cuerpo General Auxiliar de la AGE: bloque jurídico de organización del Estado y procedimiento.",
    "auxiliar administrativo age aux admin c2 estado",
    [...COMUN, "lgob", "transp", "lopdgdd", "loi", "lovg"]),
  O("adm-age", "Administrativo del Estado (C1)", "Administración General", "🗃️",
    "Cuerpo General Administrativo de la AGE: derecho administrativo, contratación y presupuestos.",
    "administrativo age c1 estado cgap",
    [...COMUN, "lgob", "transp", "lopdgdd", "loi", "lovg", "lcsp", "lgp", "lgsub"]),
  O("gestion-age", "Gestión de la Administración Civil del Estado (A2)", "Administración General", "📋",
    "Cuerpo de Gestión de la Administración Civil del Estado.",
    "gestion gacE a2 gestion civil estado",
    [...COMUN, "lgob", "transp", "lopdgdd", "lcsp", "lgp", "lgt", "lgsub", "lgss", "lopj"]),
  O("tag", "Técnico de Administración General (A1)", "Administración General", "🎓",
    "TAG de Administración local, autonómica o estatal: derecho administrativo y constitucional completo.",
    "tag tecnico administracion general a1 superior",
    [...COMUN, "lgob", "transp", "lopdgdd", "lcsp", "lgp", "lbrl", "trlrhl", "lgt", "cc", "lopj", "ljca", "lotc", "patrimonio"]),
  O("adm-ccaa", "Administrativo / Auxiliar de Comunidad Autónoma", "Administración Autonómica", "🏢",
    "Temario común de las CCAA (añade después tu Estatuto de Autonomía y normas propias).",
    "ccaa autonomica junta generalitat xunta auxiliar administrativo comunidad",
    [...COMUN, "transp", "lopdgdd", "loi", "lovg", "lcsp", "lbrl"]),
  O("adm-local", "Administrativo / Auxiliar de Administración Local", "Administración Local", "🏘️",
    "Ayuntamientos, diputaciones y entidades locales.",
    "ayuntamiento local municipal diputacion auxiliar administrativo local",
    [...COMUN, "lbrl", "trlrhl", "lcsp", "lopdgdd", "transp", "loi", "lovg"]),
  O("aux-judicial", "Auxilio Judicial", "Justicia", "⚖️",
    "Cuerpo de Auxilio Judicial (C2) de la Administración de Justicia.",
    "auxilio judicial justicia juzgados c2",
    ["ce", "lopj", "lec", "lecrim", "loi", "lovg", "lopdgdd", "lrjs"]),
  O("tramitacion", "Tramitación Procesal y Administrativa", "Justicia", "📑",
    "Cuerpo de Tramitación Procesal y Administrativa (C1).",
    "tramitacion procesal administrativa justicia juzgados c1",
    ["ce", "lopj", "lec", "lecrim", "ljca", "lrjs", "loi", "lovg", "lopdgdd", "lpac"]),
  O("gestion-procesal", "Gestión Procesal y Administrativa", "Justicia", "🏛️",
    "Cuerpo de Gestión Procesal y Administrativa (A2).",
    "gestion procesal administrativa justicia a2 juzgados",
    ["ce", "lopj", "lec", "lecrim", "ljca", "lrjs", "cc", "cp", "loi", "lovg", "lopdgdd", "lpac", "lrjsp"]),
  O("policia-nacional", "Policía Nacional (Escala Básica)", "Seguridad", "👮",
    "Escala Básica del Cuerpo Nacional de Policía.",
    "policia nacional cnp escala basica agente",
    ["ce", "lofcs", "lopsc", "cp", "lecrim", "lextr", "trafico", "lovg", "loi", "menor", "victima"]),
  O("guardia-civil", "Guardia Civil", "Seguridad", "🪖",
    "Cuerpo de la Guardia Civil: acceso a la Escala de Cabos y Guardias.",
    "guardia civil gc cabos guardias",
    ["ce", "lofcs", "lopsc", "cp", "lecrim", "lextr", "trafico", "lovg", "loi", "victima"]),
  O("policia-local", "Policía Local", "Seguridad", "🚓",
    "Policías locales: parte jurídica común (añade la ley de coordinación de tu comunidad).",
    "policia local municipal agente",
    ["ce", "lofcs", "lopsc", "lbrl", "lpac", "lrjsp", "ebep", "trafico", "cp", "lecrim", "lovg", "loi"]),
  O("prisiones", "Ayudantes de Instituciones Penitenciarias", "Seguridad", "🔐",
    "Cuerpo de Ayudantes de Instituciones Penitenciarias.",
    "prisiones penitenciarias ayudante instituciones",
    ["ce", "logp", "rp", "cp", "lecrim", "ebep", "loi", "lovg", "lopdgdd"]),
  O("hacienda", "Técnicos de Hacienda / Agentes Tributarios", "Hacienda y Seguridad Social", "💶",
    "Cuerpo Técnico de Hacienda y Agencia Tributaria: derecho tributario.",
    "hacienda agencia tributaria aeat tecnicos agentes tributarios",
    ["ce", "lgt", "irpf", "iva", "is", "lgp", "lcsp", "lpac", "lrjsp", "ebep", "lgsub"]),
  O("seguridad-social", "Cuerpos de la Seguridad Social / Inspección", "Hacienda y Seguridad Social", "🧾",
    "Seguridad Social, relaciones laborales y proceso social.",
    "seguridad social inss inspeccion trabajo tgss",
    ["ce", "lgss", "et", "lprl", "lrjs", "lpac", "lrjsp", "ebep", "loi", "lopdgdd"]),
  O("sanidad", "Sanidad: Auxiliar, Celador, Administrativo (SNS)", "Sanidad", "🩺",
    "Servicios de salud autonómicos (añade el estatuto y normas de tu servicio de salud).",
    "sanidad sns servicio salud celador auxiliar enfermeria administrativo sas sermas",
    ["ce", "lgsan", "autonomia", "lops", "estmarco", "lprl", "lopdgdd", "loi", "lovg", "ebep"]),
  O("educacion", "Educación (Maestros / Secundaria)", "Educación", "📚",
    "Parte normativa común: sistema educativo, igualdad y función pública.",
    "educacion maestros profesores secundaria docente",
    ["ce", "loe", "lomloe", "lopdgdd", "loi", "lovg", "igualtrato", "menor", "ebep"]),
];

/* ------------------------------ Utilidades ------------------------------ */

export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Siglas razonables a partir del nombre oficial. */
export function autoShortName(name: string): string {
  const n = name.trim();
  if (/^constituci[oó]n/i.test(n)) return "CE";
  if (/^c[oó]digo civil/i.test(n)) return "CC";
  if (/^c[oó]digo penal/i.test(n)) return "CP";
  const m = n.match(/^(Ley Org[aá]nica|Ley|Real Decreto Legislativo|Real Decreto-ley|Real Decreto|Decreto Legislativo|Decreto|Orden)\s+(\d+\/\d{4})/i);
  if (m) {
    const abbr: Record<string, string> = {
      "ley orgánica": "LO", "ley organica": "LO", ley: "Ley", "real decreto legislativo": "RDLeg",
      "real decreto-ley": "RDL", "real decreto": "RD", "decreto legislativo": "DLeg", decreto: "D", orden: "Orden",
    };
    return `${abbr[m[1].toLowerCase()] ?? m[1]} ${m[2]}`;
  }
  const words = n.replace(/[.,]/g, "").split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w) && w.length > 2);
  if (words.length >= 2) return words.map((w) => w[0]).join("").slice(0, 7);
  return n.slice(0, 22);
}

const BRANCH_RULES: [RegExp, string][] = [
  [/enjuiciamiento|poder judicial|procesal|jurisdicci|contencioso/i, "Procesal"],
  [/impuesto|tributari|hacienda|presupuest|subvenci|renta de las personas/i, "Fiscal"],
  [/penal|penitenciari|menores|seguridad ciudadana|fuerzas y cuerpos|criminal|v[ií]ctima/i, "Penal"],
  [/trabajadores|laboral|seguridad social|prevenci[oó]n de riesgos|empleo|sindical/i, "Laboral"],
  [/mercantil|sociedades de capital|concursal|comercio/i, "Mercantil"],
  [/constituci|tribunal constitucional|electoral|derechos fundamentales/i, "Constitucional"],
  [/internacional|tratado|uni[oó]n europea/i, "Internacional"],
  [/c[oó]digo civil|\bcivil\b|arrendamientos|propiedad horizontal/i, "Civil"],
];

export function guessBranch(name: string): string {
  for (const [re, b] of BRANCH_RULES) if (re.test(name)) return b;
  return "Administrativo";
}

export const BRANCH_ICON: Record<string, string> = {
  Constitucional: "🏛️",
  Civil: "📜",
  Penal: "🔨",
  Administrativo: "🗂️",
  Laboral: "👷",
  Mercantil: "💼",
  Procesal: "⚖️",
  Fiscal: "💶",
  Internacional: "🌍",
};

const FOLDER_COLORS = ["amarillo", "azul", "verde", "rosa", "lila", "crema"];

export function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FOLDER_COLORS[h % FOLDER_COLORS.length];
}

export function addOpo(existing: string, opo: string): string {
  const list = existing.split(",").map((s) => s.trim()).filter(Boolean);
  if (opo.trim() && !list.some((o) => o.toLowerCase() === opo.trim().toLowerCase())) list.push(opo.trim());
  return list.join(", ");
}

export function opoList(opos: string): string[] {
  return opos.split(",").map((s) => s.trim()).filter(Boolean);
}
