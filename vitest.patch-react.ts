// Setup file que corre ANTES de vitest.setup.ts (orden en vitest.config.ts).
//
// `@testing-library/react@16` (via act-compat.js) evalúa al CARGARSE:
//     const reactAct = typeof React.act === 'function' ? React.act : DeprecatedReactTestUtils.act;
// y cachea esa referencia. Si en ese momento React.act es undefined, queda
// pegado al `DeprecatedReactTestUtils.act` — que en react-dom@19 ya no existe
// como función y tira "React.act is not a function" en runtime.
//
// React@19 sí exporta `act` pero solo como named export ESM, NO como propiedad
// del namespace default en CJS. Le agregamos la propiedad antes de que
// `@testing-library/react` la lea.
import React, { act } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactAny = React as any;
if (typeof ReactAny.act !== "function" && typeof act === "function") {
    ReactAny.act = act;
}
