import { defineMarkdocConfig, component, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    link: {
      ...nodes.link,
      render: component('./src/components/SmartLink.astro'),
    },
  },
  tags: {
    livret: {
      render: component('./src/components/LivretModeles.astro'),
    },
    ctaSiteResa: {
      render: component('./src/components/CtaSiteResa.astro'),
    },
    methode97Popup: {
      render: component('./src/components/Methode97Popup.astro'),
    },
  },
});
