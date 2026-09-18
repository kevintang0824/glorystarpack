import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const languages = ['fr', 'es', 'pt', 'ru', 'zh-CN'];

const obsolete = [
  'A practical selection guide and OEM supply service for beauty founders, skincare brands, contract fillers and distributors choosing bottles, jars, tubes, components and retail packaging.',
  'Beer bottle selection', 'Beverage bottle hub', 'Build a Dropper RFQ', 'Build an MOQ Quote',
  'Compare Dropper Routes', 'Compare glass bottle, neck, gasket, bulb, collar and pipette configurations by formula, viscosity, dose, leakage, light exposure and approval evidence.',
  'Continue from the RFQ field guide', 'Continue the fragrance sourcing cluster', 'Continue the glass bottle approval cluster',
  'Glass packaging', 'Glass packaging hub', 'Need a project answer?', 'Open the RFQ builder →',
  'Pair the quality checklist with the glass, beverage, closure and project-brief pages that define the production-intent bottle and packed route.',
  'Serum Dropper Bottle Packaging | Selection Guide', 'Serum dropper system selection', 'Start OEM Project',
  'Use the contact page to prepare a complete email or WhatsApp inquiry.',
  'Use the fragrance category, components and sample approval pages to compare a perfume bottle project from silhouette through packed shipment.',
  'Use the relevant sourcing hub and application page to turn the RFQ fields into a stable bottle, closure, decoration and approval route.',
  'Wine bottle selection'
];

const common = {
  '30ml Serum Dropper Bottle Supplier China | Guide': '30ml serum dropper bottle supplier in China | Guide',
  'China supplier route for serum packaging': 'China supplier route for serum packaging',
  'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': 'Choose stock or custom packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.',
  'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': 'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.',
  'Get MOQ &amp; Lead Time': 'Get MOQ &amp; Lead Time',
  'Get a Dropper Quote': 'Get a Dropper Quote',
  'Get a Project Quote': 'Get a Project Quote',
  'Ready to compare a configuration?': 'Ready to compare a configuration?',
  'Request 30ml Samples': 'Request 30ml Samples',
  'Request Private Label Samples': 'Request Private Label Samples',
  'Request Samples →': 'Request Samples →',
  'Send Packaging Specs': 'Send Packaging Specs',
  'Send Packaging Specs →': 'Send Packaging Specs →',
  'Send packaging specifications': 'Send packaging specifications',
  'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': 'Share application, capacity, component, quantity, destination and timing for a project-specific answer.'
};

const localized = {
  fr: {
    ...common,
    '30ml Serum Dropper Bottle Supplier China | Guide': 'Fournisseur chinois de flacons compte-gouttes 30 ml pour sérum | Guide',
    'China supplier route for serum packaging': 'Parcours fournisseur chinois pour emballages de sérums',
    'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': 'Choisissez des flacons, pots, tubes, composants et emballages de vente stock ou sur mesure, puis passez d’un brief clair aux échantillons, à la validation de la décoration et à une étude du MOQ et du calendrier du projet.',
    'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': 'Comparez les parcours en verre de 15 ml, 30 ml et 50 ml selon la formule, la viscosité, le col, le joint, la poire, la pipette, la dose et les preuves d’approbation. Une référence 30 ml documentée indique un MOQ de 500 pièces ; confirmez la configuration, les échantillons et le calendrier exacts.',
    'Get MOQ &amp; Lead Time': 'Obtenir le MOQ et le délai', 'Get a Dropper Quote': 'Obtenir un devis pour compte-gouttes', 'Get a Project Quote': 'Obtenir un devis de projet',
    'Ready to compare a configuration?': 'Prêt à comparer une configuration ?', 'Request 30ml Samples': 'Demander des échantillons 30 ml', 'Request Private Label Samples': 'Demander des échantillons en marque blanche', 'Request Samples →': 'Demander des échantillons →',
    'Send Packaging Specs': 'Envoyer les spécifications d’emballage', 'Send Packaging Specs →': 'Envoyer les spécifications d’emballage →', 'Send packaging specifications': 'Envoyer les spécifications d’emballage',
    'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': 'Indiquez l’application, la capacité, le composant, la quantité, la destination et le calendrier pour obtenir une réponse adaptée au projet.'
  },
  es: {
    ...common,
    '30ml Serum Dropper Bottle Supplier China | Guide': 'Proveedor chino de frascos cuentagotas de 30 ml para sérum | Guía', 'China supplier route for serum packaging': 'Ruta de proveedor chino para envases de sérum',
    'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': 'Elige frascos, tarros, tubos, componentes y envases de venta estándar o personalizados, y pasa de un brief claro a muestras, pruebas de decoración y una revisión del MOQ y calendario del proyecto.',
    'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': 'Compara rutas de vidrio cuentagotas de 15, 30 y 50 ml según fórmula, viscosidad, cuello, junta, pera, pipeta, dosis y evidencias de aprobación. Una ruta documentada de 30 ml indica una referencia de MOQ de 500 piezas; confirma la configuración, las muestras y el calendario exactos.',
    'Get MOQ &amp; Lead Time': 'Obtener MOQ y plazo', 'Get a Dropper Quote': 'Obtener presupuesto para cuentagotas', 'Get a Project Quote': 'Obtener presupuesto del proyecto', 'Ready to compare a configuration?': '¿Listo para comparar una configuración?',
    'Request 30ml Samples': 'Solicitar muestras de 30 ml', 'Request Private Label Samples': 'Solicitar muestras para marca blanca', 'Request Samples →': 'Solicitar muestras →', 'Send Packaging Specs': 'Enviar especificaciones de envase', 'Send Packaging Specs →': 'Enviar especificaciones de envase →', 'Send packaging specifications': 'Enviar especificaciones de envase',
    'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': 'Comparte la aplicación, capacidad, componente, cantidad, destino y calendario para obtener una respuesta específica del proyecto.'
  },
  pt: {
    ...common,
    '30ml Serum Dropper Bottle Supplier China | Guide': 'Fornecedor chinês de frascos conta-gotas de 30 ml para sérum | Guia', 'China supplier route for serum packaging': 'Rota de fornecedor chinês para embalagens de sérum',
    'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': 'Escolha frascos, potes, tubos, componentes e embalagens de varejo padrão ou personalizadas, passando de um briefing claro para amostras, prova de decoração e revisão do MOQ e prazo do projeto.',
    'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': 'Compare rotas de vidro conta-gotas de 15, 30 e 50 ml por fórmula, viscosidade, gargalo, vedação, pera, pipeta, dose e evidências de aprovação. Uma rota documentada de 30 ml indica referência de MOQ de 500 peças; confirme a configuração, as amostras e o prazo exatos.',
    'Get MOQ &amp; Lead Time': 'Obter MOQ e prazo', 'Get a Dropper Quote': 'Obter cotação para conta-gotas', 'Get a Project Quote': 'Obter cotação do projeto', 'Ready to compare a configuration?': 'Pronto para comparar uma configuração?',
    'Request 30ml Samples': 'Solicitar amostras de 30 ml', 'Request Private Label Samples': 'Solicitar amostras de marca própria', 'Request Samples →': 'Solicitar amostras →', 'Send Packaging Specs': 'Enviar especificações da embalagem', 'Send Packaging Specs →': 'Enviar especificações da embalagem →', 'Send packaging specifications': 'Enviar especificações da embalagem',
    'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': 'Envie aplicação, capacidade, componente, quantidade, destino e prazo para uma resposta específica do projeto.'
  },
  ru: {
    ...common,
    '30ml Serum Dropper Bottle Supplier China | Guide': 'Китайский поставщик флаконов с пипеткой 30 мл для сыворотки | Руководство', 'China supplier route for serum packaging': 'Китайский маршрут поставки упаковки для сывороток',
    'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': 'Выберите стандартные или индивидуальные флаконы, банки, тубы, компоненты и розничную упаковку, затем перейдите от четкого брифа к образцам, пробе декора и проверке MOQ и сроков проекта.',
    'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': 'Сравните стеклянные флаконы с пипеткой 15, 30 и 50 мл по формуле, вязкости, горлышку, прокладке, груше, пипетке, дозе и подтверждающим материалам. В одной документированной конфигурации 30 мл указана справочная партия MOQ 500 штук; подтвердите точную конфигурацию, образцы и сроки.',
    'Get MOQ &amp; Lead Time': 'Получить MOQ и сроки', 'Get a Dropper Quote': 'Получить расчет для флакона с пипеткой', 'Get a Project Quote': 'Получить расчет проекта', 'Ready to compare a configuration?': 'Готовы сравнить конфигурацию?',
    'Request 30ml Samples': 'Запросить образцы 30 мл', 'Request Private Label Samples': 'Запросить образцы упаковки private label', 'Request Samples →': 'Запросить образцы →', 'Send Packaging Specs': 'Отправить спецификации упаковки', 'Send Packaging Specs →': 'Отправить спецификации упаковки →', 'Send packaging specifications': 'Отправить спецификации упаковки',
    'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': 'Укажите применение, объем, компонент, количество, страну назначения и сроки, чтобы получить ответ по проекту.'
  },
  'zh-CN': {
    ...common,
    '30ml Serum Dropper Bottle Supplier China | Guide': '中国30ml精华滴管瓶供应商｜采购指南', 'China supplier route for serum packaging': '精华包装中国供应商路线',
    'Choose stock or custom bottles, jars, tubes, components and retail packaging, then move from a clear brief to samples, decoration proof and a project-specific MOQ and timing review.': '选择现货或定制的瓶、罐、管、配件和零售包装，从清晰的项目简报推进到样品、装饰打样以及针对项目的MOQ和时间评估。',
    'Compare 15ml, 30ml and 50ml glass serum dropper routes by formula, viscosity, neck, gasket, bulb, pipette, dose and approval evidence. One documented 30ml product route lists a 500-piece MOQ reference; confirm the exact configuration, samples and timing for your project.': '根据配方、粘度、瓶口、垫片、胶帽、滴管、剂量和审批证据比较15ml、30ml和50ml玻璃精华滴管方案。一条有记录的30ml产品路线给出500件MOQ参考；具体配置、样品和时间请以项目确认。',
    'Get MOQ &amp; Lead Time': '获取MOQ和交期', 'Get a Dropper Quote': '获取滴管瓶报价', 'Get a Project Quote': '获取项目报价', 'Ready to compare a configuration?': '准备好比较配置了吗？',
    'Request 30ml Samples': '申请30ml样品', 'Request Private Label Samples': '申请贴牌包装样品', 'Request Samples →': '申请样品 →', 'Send Packaging Specs': '发送包装规格', 'Send Packaging Specs →': '发送包装规格 →', 'Send packaging specifications': '发送包装规格',
    'Share application, capacity, component, quantity, destination and timing for a project-specific answer.': '请提供应用、容量、配件、数量、目的地和时间，以便获得针对项目的回复。'
  }
};

for (const language of languages) {
  const filePath = path.join(rootDir, 'data', 'full-translations', `${language}.json`);
  const dictionary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const key of obsolete) delete dictionary[key];
  Object.assign(dictionary, localized[language]);
  fs.writeFileSync(filePath, `${JSON.stringify(dictionary, null, 2)}\n`);
}
console.log(`Reconciled commercial translation dictionaries for ${languages.length} languages.`);
