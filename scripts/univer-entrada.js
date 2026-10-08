// Gera vendor/univer/univer.js e univer.css (a mesma planilha Univer 1.0.3 da Matriz do SST, em um arquivo só).
// Rodar dentro da pasta do SST (que já tem os pacotes @univerjs instalados):
//   node_modules/.bin/esbuild --bundle --minify --format=iife --platform=browser --target=es2020 \
//     --define:process.env.NODE_ENV='"production"' --legal-comments=none --loader:.woff=dataurl --loader:.woff2=dataurl \
//     --loader:.ttf=dataurl --loader:.svg=dataurl --loader:.png=dataurl --outfile=<Efetivo>/vendor/univer/univer.js < univer-entrada.js
// Grátis (Apache-2.0). Mudou a versão no SST? Gere de novo e troque VERSAO em js/planilha-excel.js.

import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import nucleoPt from "@univerjs/preset-sheets-core/locales/pt-BR";
import { UniverSheetsFilterPreset } from "@univerjs/preset-sheets-filter";
import filtroPt from "@univerjs/preset-sheets-filter/locales/pt-BR";
import { UniverSheetsFindReplacePreset } from "@univerjs/preset-sheets-find-replace";
import buscaPt from "@univerjs/preset-sheets-find-replace/locales/pt-BR";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs/preset-sheets-filter/lib/index.css";
import "@univerjs/preset-sheets-find-replace/lib/index.css";
window.SGEUniver = { createUniver, LocaleType, mergeLocales, UniverSheetsCorePreset, UniverSheetsFilterPreset, UniverSheetsFindReplacePreset, locais: [nucleoPt, filtroPt, buscaPt] };
