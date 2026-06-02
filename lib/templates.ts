// F14: Text templates for common budget descriptions.
// Users can quickly insert pre-written descriptions for frequent job types.

export interface TextTemplate {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const TEXT_TEMPLATES: TextTemplate[] = [
  // Construccion
  {
    id: 'reparacion-humedad',
    label: 'Reparacion de humedad',
    category: 'Construccion',
    description: 'Tratamiento integral contra humedad en paredes y techos. Incluye: diagnostico de la causa, sellado de filtraciones, aplicacion de membrana hidrofuga, revoque y pintura final.',
  },
  {
    id: 'pintura-interior',
    label: 'Pintura interior',
    category: 'Construccion',
    description: 'Pintura interior completa de ambientes. Incluye: preparacion de superficies, masillado de grietas, imprimacion y dos manos de pintura látex de primera calidad.',
  },
  {
    id: 'revoque-general',
    label: 'Revoque general',
    category: 'Construccion',
    description: 'Revoque grueso y fino en paredes exteriores e interiores. Incluye preparacion de superficie, colocacion de malla, revoque grueso, pañete fino y alisado.',
  },
  {
    id: 'impermeabilizacion',
    label: 'Impermeabilizacion de terraza',
    category: 'Construccion',
    description: 'Impermeabilizacion de terrazas y cubiertas. Incluye: limpieza, sellado de fisuras, aplicacion de membrana asfaltica o acrilica, y protection solar.',
  },
  {
    id: 'electricidad-general',
    label: 'Instalacion electrica',
    category: 'Electricidad',
    description: 'Instalacion o modificacion de red electrica. Incluye: cableado, canalizaciones, llave termica, placas, tomas y verificacion de continuidad.',
  },
  {
    id: 'plomeria-general',
    label: 'Reparacion de plomeria',
    category: 'Plomeria',
    description: 'Reparacion de fugas y roturas en cañerias. Incluye: diagnostico, reemplazo de tramos danados, soldadura, pruebas de estanqueidad y reacondicionamiento.',
  },
  {
    id: 'cierre-perimetral',
    label: 'Cierre perimetral',
    category: 'Construccion',
    description: 'Construccion de cerramiento perimetral con ladrillos o bloques. Incluye: fundacion, levantado de muros, columnas, encadenado superior y acabados.',
  },
  {
    id: 'drywall',
    label: 'Plafon de drywall',
    category: 'Construccion',
    description: 'Instalacion de cielorrasos y paneles de yeso carton. Incluye: estructura metalica, colocacion de placas, masillado, lijado y pintura final.',
  },
];

export function getTemplatesByCategory(): Record<string, TextTemplate[]> {
  return TEXT_TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, TextTemplate[]>);
}

export function searchTemplates(query: string): TextTemplate[] {
  const q = query.toLowerCase();
  return TEXT_TEMPLATES.filter(
    t => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}
