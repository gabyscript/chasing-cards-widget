# Cómo usar Chasing Cards

Chasing Cards muestra en tu stream las cartas más valiosas de un set, una por una, con su precio de mercado en dólares. Es ideal para aperturas de sobres: tus viewers ven qué cartas están buscando ("chaseando") y cuánto valen.

## 1. Configura el widget

1. Abre la página de configuración.
2. Elige el **TCG** y busca el **set** que vas a abrir.
3. Ajusta lo que quieras mostrar:
   - **Cantidad de cartas** (entre 5 y 15), ordenadas de mayor a menor precio.
   - **Precio**, **nombre de la carta** y **título**. En el título puedes usar `{set}` para el nombre del set o `{code}` para su código.
   - **Color del texto**: claro, oscuro o el que elijas, según el fondo de tu escena.
   - **Ancho de la carta**, **tiempo por carta** y **animación** (deslizar, desvanecer o girar).
   - **Actualizar precios**: en streams largos, el widget vuelve a consultar los precios cada cierto tiempo sin que tengas que recargar OBS.
4. Revisa la vista previa. Puedes cambiar su fondo a oscuro, claro o transparente para ver cómo se verá sobre tu escena.
5. Copia el **link del widget**.

## 2. Agrégalo a OBS

1. En OBS, en el panel **Fuentes**, pulsa **+** y elige **Navegador**.
2. Pega el link en **URL**.
3. Usa el ancho y alto que indica el configurador en "Cómo agregarlo a OBS". El tamaño cambia según el ancho de la carta y si muestras título, nombre o precio.
4. Marca **Actualizar navegador cuando la escena se active** para que la rotación empiece desde la primera carta cada vez que entras a la escena.
5. Acepta y ubica el widget en tu escena. El fondo es transparente: no necesitas CSS personalizado.

Si cambias algo en la configuración, copia el link nuevo y reemplázalo en la fuente.

## Problemas comunes

**El widget dice "Este set no tiene cartas con precio".**
El set todavía no tiene precios de mercado, algo común en sets recién lanzados o en preventa. Prueba con otro set o vuelve a intentarlo en unos días.

**El widget dice "No se pudo conectar con TCGplayer. Reintentando…".**
Es un problema temporal al consultar los precios. El widget reintenta solo; no hace falta recargar la fuente.

**Aparece "Link de widget inválido".**
Al link le falta el set. Vuelve al configurador, elige el set y copia el link de nuevo.

**El fondo no se ve transparente.**
Revisa que la fuente sea de tipo **Navegador** y que no tenga CSS personalizado que le ponga color de fondo.

**El texto no se lee sobre mi escena.**
Cambia el **color del texto** a claro u oscuro según tu fondo, o elige un color personalizado.

**Los precios no cambian durante el stream.**
Revisa la opción **Actualizar precios**: con "Nunca", el widget solo consulta los precios al cargar.
