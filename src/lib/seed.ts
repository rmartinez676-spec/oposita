import type { NewNote } from "@/db/schema";

/**
 * Apuntes de ejemplo que se siembran la primera vez que se abre la app.
 * Sintaxis del contenido:
 *   ==texto==  → subrayado con rotulador
 *   **texto**  → negrita con subrayado ondulado
 *   - texto    → viñeta con flecha
 *   ! texto    → aviso importante en rojo
 */
export const SEED_NOTES: NewNote[] = [
  {
    title: "Igualdad ante la ley",
    lawName: "Constitución Española",
    article: "Art. 14",
    category: "Constitucional",
    content:
      "Los españoles son ==iguales ante la ley==, sin que pueda prevalecer discriminación alguna por razón de:\n- Nacimiento, raza o sexo\n- Religión u opinión\n- Cualquier otra condición o circunstancia personal o social\n! Es un derecho fundamental → protegido por **recurso de amparo** (Art. 53.2 CE)\nTruco de examen: igualdad **formal** (Art. 14) frente a igualdad **material** (Art. 9.2 CE), que obliga a los poderes públicos a promoverla.",
    paperColor: "crema",
    fontStyle: "caveat",
    inkColor: "azul",
    isFavorite: true,
    tags: "derechos fundamentales, examen, test",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
  },
  {
    title: "Tutela judicial efectiva",
    lawName: "Constitución Española",
    article: "Art. 24",
    category: "Constitucional",
    content:
      "Derecho a obtener la ==tutela efectiva de jueces y tribunales== en el ejercicio de los derechos e intereses legítimos.\n- Sin que, en ningún caso, pueda producirse **indefensión**\n- Derecho al juez predeterminado por la ley\n- Proceso público, sin dilaciones indebidas y con todas las garantías\n- Derecho a la defensa y a la asistencia de letrado\n! Nadie puede ser condenado sin ser oído → principio de **contradicción**\nEjemplo típico: la falta de notificación de una resolución = indefensión = vulneración del 24.1 CE.",
    paperColor: "amarillo",
    fontStyle: "caveat",
    inkColor: "negro",
    isFavorite: true,
    tags: "derechos fundamentales, proceso",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    title: "Fuentes del Derecho",
    lawName: "Código Civil",
    article: "Art. 1",
    category: "Civil",
    content:
      "Son fuentes del ordenamiento jurídico español:\n- La **ley**\n- La **costumbre**\n- Los **principios generales del derecho**\nLa costumbre solo rige en defecto de ley aplicable, siempre que no sea contraria a la moral o al orden público y que resulte probada.\n! La jurisprudencia NO es fuente formal: **complementa** el ordenamiento con la doctrina del Tribunal Supremo (Art. 1.6 CC)\nOrden de aplicación: 1º ley → 2º costumbre → 3º principios generales.",
    paperColor: "azul",
    fontStyle: "kalam",
    inkColor: "azul",
    isFavorite: false,
    tags: "teoría del derecho, básico",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
  },
  {
    title: "El acto administrativo",
    lawName: "Ley 39/2015, del Procedimiento Administrativo Común",
    article: "Arts. 39 y ss.",
    category: "Administrativo",
    content:
      "Declaración de voluntad de la Administración que produce ==efectos jurídicos== sobre los ciudadanos.\n- **Presunción de validez** (Art. 39.1): los actos se presumen válidos y producen efectos desde que se dictan\n- **Nulidad de pleno derecho** (Art. 47): casos tasados e imprescriptibles\n- **Anulabilidad** (Art. 48): cualquier otra infracción del ordenamiento\n! Nulidad ≠ anulabilidad: la nulidad puede alegarse **en cualquier momento**, la anulabilidad no\nLa eficacia puede demorarse cuando así lo exija el contenido del acto o esté supeditada a su notificación o publicación.",
    paperColor: "verde",
    fontStyle: "caveat",
    inkColor: "azul",
    isFavorite: false,
    tags: "procedimiento, oposiciones",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    title: "Eximentes de responsabilidad criminal",
    lawName: "Código Penal",
    article: "Art. 20",
    category: "Penal",
    content:
      "Están ==exentos de responsabilidad criminal==, entre otros:\n- Quien obra en **defensa** de la persona o derechos propios o ajenos (legítima defensa)\n- Quien obra en **estado de necesidad**\n- Quien actúa en cumplimiento de un deber o en el ejercicio legítimo de un derecho, oficio o cargo\n- Quien obra impulsado por **miedo insuperable**\n- Quien sufre una anomalía o alteración psíquica que le impida comprender la ilicitud del hecho\n! Requisitos de la legítima defensa: agresión ilegítima + necesidad racional del medio empleado + falta de provocación suficiente",
    paperColor: "rosa",
    fontStyle: "patrick",
    inkColor: "rojo",
    isFavorite: false,
    tags: "parte general, examen",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
  },
  {
    title: "Despido disciplinario",
    lawName: "Estatuto de los Trabajadores",
    article: "Art. 54",
    category: "Laboral",
    content:
      "La empresa puede extinguir el contrato por ==incumplimiento grave y culpable== del trabajador:\n- Faltas repetidas e injustificadas de asistencia o puntualidad\n- Indisciplina o desobediencia en el trabajo\n- Ofensas verbales o físicas al empresario o a los compañeros\n- Disminución continuada y voluntaria del rendimiento\n- Embriaguez habitual o toxicomanía que repercutan negativamente en el trabajo\nPlazo para despedir: **60 días** desde que la empresa conoce la falta y, en todo caso, 6 meses desde que se cometió (Art. 60.2 ET).\n! Si se declara improcedente: readmisión o indemnización de **33 días de salario por año** trabajado (Art. 56 ET)",
    paperColor: "amarillo",
    fontStyle: "caveat",
    inkColor: "negro",
    isFavorite: true,
    tags: "contrato, despido, examen",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    title: "La demanda en el juicio ordinario",
    lawName: "Ley de Enjuiciamiento Civil",
    article: "Art. 399",
    category: "Procesal",
    content:
      "El juicio ordinario comienza por **demanda**, en la que se consignarán:\n- Los datos del tribunal, del demandante y del demandado\n- La narración numerada y clara de los **hechos**\n- Los **fundamentos de derecho**\n- La petición clara y determinada: el famoso **suplico**\nDeben acompañarse el poder notarial o el apoderamiento apud acta y los documentos en que se funde el derecho.\n! Truco: el suplico manda → lo no pedido no se concede (principio de **congruencia**, Art. 216 LEC)",
    paperColor: "crema",
    fontStyle: "shadows",
    inkColor: "azul",
    isFavorite: false,
    tags: "juicio ordinario, práctica",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    title: "Sociedad de responsabilidad limitada",
    lawName: "Ley de Sociedades de Capital",
    article: "Arts. 1 y ss.",
    category: "Mercantil",
    content:
      "- Capital mínimo: desde la Ley 18/2022 puede constituirse con solo **1 €** (antes eran 3.000 €)\n- El capital se divide en **participaciones sociales**, nunca en acciones\n- Los socios **no responden personalmente** de las deudas sociales\n- Órganos sociales: junta general y órgano de administración\n! Diferencia clave con la SA: capital mínimo de 60.000 € y dividido en **acciones**\nMientras el capital no alcance 3.000 €, hay que destinar a reserva legal el 20 % del beneficio y los socios responden solidariamente hasta esa cifra.",
    paperColor: "lila",
    fontStyle: "kalam",
    inkColor: "violeta",
    isFavorite: false,
    tags: "sociedades, empresa",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    title: "El hecho imponible",
    lawName: "Ley General Tributaria",
    article: "Art. 20",
    category: "Fiscal",
    content:
      "El hecho imponible es el ==presupuesto fijado por la ley== para configurar cada tributo.\nSu realización origina el nacimiento de la **obligación tributaria principal**: el pago de la deuda tributaria.\n- Sin hecho imponible no hay tributo → principio de **legalidad** (Art. 8 LGT)\n- La ley puede definir supuestos de **no sujeción** y de **exención**\n! No confundir: en la no sujeción la obligación **no llega a nacer**; en la exención nace, pero el sujeto queda liberado del pago",
    paperColor: "verde",
    fontStyle: "caveat",
    inkColor: "verde",
    isFavorite: false,
    tags: "tributos, básico",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
];
