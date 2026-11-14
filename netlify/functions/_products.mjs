
// catálogo canônico — única fonte de verdade de preços.
// os preços do navegador são ignorados; o checkout monta as line_items daqui.
// price sempre em centavos, moeda BRL.

export const PRODUCTS = [
  {
    id: 'tpl-social',
    name: 'Pack de Templates para Redes Sociais',
    price: 1990,
    tagline: 'Templates prontos para posts e stories, editáveis no Canva.',
    file: null,
  },
  {
    id: 'plan-fin',
    name: 'Planilha de Organização Financeira',
    price: 1490,
    tagline: 'Controle de gastos, dívidas e reserva com dashboards automáticos.',
    file: null,
  },
  {
    id: 'guide-study',
    name: 'Guia de Estudos e Planejamento',
    price: 1290,
    tagline: 'Método de rotina, revisão espaçada e cronograma semanal.',
    file: null,
  },
  {
    id: 'creator-kit',
    name: 'Kit de Conteúdo para Criadores',
    price: 2490,
    tagline: 'Pautas, roteiros e calendário editorial para 90 dias.',
    file: null,
  },
  {
    id: 'menu-kit',
    name: 'Modelos de Cardápio Digital',
    price: 1790,
    tagline: 'Cardápios editáveis com QR code para restaurantes e delivery.',
    file: null,
  },
  {
    id: 'budget-sheet',
    name: 'Planilha de Metas e Orçamento',
    price: 1190,
    tagline: 'Orçamento mensal por categoria com alertas de limite.',
    file: null,
  },
  {
    id: 'ebook-start',
    name: 'Guia Prático para Começar um Projeto',
    price: 1690,
    tagline: 'Do zero ao lançamento: validação, escopo e primeiro cliente.',
    file: null,
  },
  {
    id: 'video-kit',
    name: 'Kit de Planejamento de Vídeos',
    price: 2190,
    tagline: 'Scripts, checklists de gravação e templates de edição.',
    file: null,
  },
];

export const LIMITS = {
  MAX_DISTINCT_ITEMS: 20,
  MAX_QTY_PER_ITEM: 10,
};

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function formatBRL(cents) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
