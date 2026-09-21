# Contrato Keymaster → Frontend (API de Menús)

Este documento describe **cómo el frontend debe consumir el servicio Keymaster** para
dibujar dinámicamente el menú de navegación (menús y opciones) en lugar de tenerlo
hardcodeado. El endpoint principal para pintar el menú es
**`GET /api/menubuild/authorized-grouped`**.

Keymaster **no emite** tokens: la autenticación la emite Gatekeeper (ver *Contrato del
token Gatekeeper → Keymaster*). El frontend obtiene el JWT de Gatekeeper y lo reenvía a
Keymaster en cada llamada protegida.

---

## 1. Conceptos del modelo

El menú se arma con tres entidades y una tabla de construcción:

| Entidad          | Qué representa                                                       |
|------------------|---------------------------------------------------------------------|
| **menu_perfil**  | Un perfil de menú (agrupación de alto nivel asignada a usuarios).    |
| **menu_menu**    | Un grupo/sección del menú (con nombre e ícono).                      |
| **menu_option**  | Una opción navegable (nombre, URL, ícono, comando, etc.).           |
| **menu_build**   | Une perfil + grupo (menu_menu) + opción (menu_option) con secuencia. |
| **menu_perfil_user** | Qué perfiles de menú tiene asignado cada usuario.               |

El usuario ve únicamente los menús de los **perfiles** que tiene asignados en
`menu_perfil_user` (con `ACTIVE = 1`).

---

## 2. Autenticación

Todas las llamadas para pintar el menú requieren el token de Gatekeeper:

```
Authorization: Bearer <jwt>
```

Endpoints que **exigen** token:

- `GET /api/menubuild/**` (incluye `authorized-grouped`)
- `/api/menuuser/**`

Si el token falta, expiró, tiene firma inválida o el issuer no es `Gatekeeper`,
Keymaster responde **401**.

> Base URL: definida por el entorno (p. ej. `https://keymaster.tu-dominio`).
> En desarrollo el servicio corre en el puerto `3001`.

---

## 3. Formato de respuesta (común a todos los endpoints)

Todas las respuestas usan una clase `Respuesta` que agrega **headers** de estado además
del cuerpo:

| Header    | Descripción                                              |
|-----------|----------------------------------------------------------|
| `CODE`    | `100` = OK, `200` = parcialmente aplicado, `400` = error |
| `STATUS`  | `OK`, `PARTIALLY_APPLIED` o `NOT_OK`                      |
| `MESSAGE` | Mensaje legible de la operación                          |

El **cuerpo** es JSON. En operaciones de lectura suele venir como
`{ "data": ..., "pagination": {...} }`.

> Recomendación: el frontend debe basar el éxito en el **status HTTP** y opcionalmente
> en el header `STATUS`. El cuerpo `data` es lo que se consume.

---

## 4. Endpoint principal: pintar el menú

### `GET /api/menubuild/authorized-grouped`

Devuelve, **ya agrupados y filtrados por los permisos del usuario del token**, los
grupos de menú (`menu_menu`) con sus opciones (`menu_option`). Es el endpoint pensado
para construir el árbol de navegación.

**Headers**

```
Authorization: Bearer <jwt>
```

**Query params (opcionales)**

| Param     | Tipo | Descripción                                                        |
|-----------|------|--------------------------------------------------------------------|
| `menu_id` | int  | Limita el resultado a un perfil de menú (`menu_perfil.PK_ID`) específico. Si se omite, trae todos los perfiles a los que el usuario tiene acceso. |

> **Importante:** este endpoint responde con la estructura agrupada **solo cuando la
> petición NO trae body JSON**. Envíalo como un `GET` simple con query params, sin
> `Content-Type: application/json` y sin cuerpo.

**Ejemplo de petición**

```
GET /api/menubuild/authorized-grouped HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

o filtrando por un perfil:

```
GET /api/menubuild/authorized-grouped?menu_id=3 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
```

**Estructura de la respuesta**

```json
{
  "data": {
    "menu_menu": [
      {
        "pk_id": 1,
        "name": "Administración",
        "active": 1,
        "icon_name": "settings",
        "menu_options": [
          {
            "pk_id": 10,
            "name": "Usuarios",
            "description": "Gestión de usuarios",
            "url": "/usuarios",
            "command": null,
            "img": null,
            "img_small": null,
            "active": 1,
            "icon_name": "users",
            "external_url": null
          },
          {
            "pk_id": 11,
            "name": "Reportes",
            "description": "Reportes del sistema",
            "url": "/reportes",
            "command": null,
            "img": null,
            "img_small": null,
            "active": 1,
            "icon_name": "chart",
            "external_url": null
          }
        ]
      },
      {
        "pk_id": 2,
        "name": "Operación",
        "active": 1,
        "icon_name": "truck",
        "menu_options": [ /* ...más opciones... */ ]
      }
    ]
  },
  "summoner": {
    "nombre": "John",
    "apellido": "Doe"
  }
}
```

**Campos**

`data.menu_menu[]` — cada grupo del menú:

| Campo          | Tipo   | Descripción                          |
|----------------|--------|--------------------------------------|
| `pk_id`        | int    | Id del grupo (`menu_menu.PK_ID`).    |
| `name`         | string | Nombre del grupo.                    |
| `active`       | int    | 1 activo / 0 inactivo.               |
| `icon_name`    | string | Nombre del ícono del grupo.          |
| `menu_options` | array  | Opciones dentro del grupo.           |

`data.menu_menu[].menu_options[]` — cada opción navegable:

| Campo          | Tipo          | Descripción                                        |
|----------------|---------------|----------------------------------------------------|
| `pk_id`        | int           | Id de la opción (`menu_option.PK_ID`).             |
| `name`         | string        | Texto a mostrar.                                   |
| `description`  | string \| null | Descripción / tooltip.                            |
| `url`          | string \| null | Ruta interna del frontend (routing).              |
| `command`      | string \| null | Comando/acción asociada (opcional).               |
| `img`          | string \| null | Imagen grande (opcional).                         |
| `img_small`    | string \| null | Imagen pequeña / miniatura (opcional).            |
| `active`       | int           | 1 activo / 0 inactivo.                             |
| `icon_name`    | string \| null | Nombre del ícono de la opción.                    |
| `external_url` | string \| null | URL externa (abrir en nueva pestaña si existe).   |

`summoner` — datos del usuario dueño del token (útil para mostrar “Hola, John Doe”):

| Campo      | Tipo   | Descripción           |
|------------|--------|-----------------------|
| `nombre`   | string | Nombre del usuario.   |
| `apellido` | string | Apellido del usuario. |

**Guía de render en el frontend**

1. Recorre `data.menu_menu` para pintar cada sección (usa `name` + `icon_name`).
2. Dentro de cada sección recorre `menu_options`.
3. Para navegar:
   - Si `external_url` tiene valor → abrir enlace externo (nueva pestaña).
   - Si no, usar `url` como ruta interna de tu router.
4. Ignora u oculta los elementos con `active = 0` si aplicara (normalmente el backend ya solo devuelve activos según permisos).
5. El orden ya viene resuelto por el backend; si necesitas reordenar en cliente, apóyate en el endpoint plano (sección 5) que expone `sequence` y `menu_sequence`.

**Errores**

| Situación                          | Status | Cuerpo / Nota                                  |
|------------------------------------|--------|------------------------------------------------|
| Token ausente/ inválido / expirado | 401    | Reautenticar con Gatekeeper.                   |
| `menu_id` no numérico              | 400    | `menu_id debe ser un número entero válido`     |
| Se envió body JSON                 | 400    | `Content-Type must be application/json` (no mandes body; usa GET simple). |
| Error de base de datos             | 500    | Mensaje de error del servidor.                 |

---

## 5. Endpoint alterno: menú autorizado sin agrupar

### `GET /api/menubuild/authorized`

Igual que el anterior pero devuelve los registros de `menu_build` **planos** (no
anidados), con paginación y ordenación. Útil si el frontend prefiere agrupar por su
cuenta o necesita los campos de secuencia.

**Headers:** `Authorization: Bearer <jwt>`

**Query params**

| Param            | Tipo   | Default | Descripción                                                    |
|------------------|--------|---------|----------------------------------------------------------------|
| `menu_id`        | int    | —       | Filtra por perfil de menú específico.                          |
| `page_size`      | int    | 100     | Tamaño de página (`0` = sin paginar, trae todo).               |
| `page_number`    | int    | 1       | Número de página.                                              |
| `columns_order`  | string | —       | Columnas para ordenar, separadas por coma (p. ej. `menu_sequence,sequence`). |
| `columns_sort`   | string | —       | Sentido por columna: `asc`/`desc`, separadas por coma. Debe tener la misma cantidad que `columns_order`. |
| `add_menu_menu`  | flag   | —       | Si está presente, incrusta el objeto `menu_menu` relacionado.  |
| `add_menu_option`| flag   | —       | Si está presente, incrusta el objeto `menu_option` relacionado.|
| `add_menus`      | flag   | —       | Si está presente, incrusta el objeto `menus` (perfil) relacionado. |

> Los “flag” se activan con solo incluir el parámetro en la query (su valor no importa),
> por ejemplo: `?add_menu_menu=1&add_menu_option=1`.

**Respuesta**

```json
{
  "data": [
    {
      "pk_id": 100,
      "menu_id": 3,
      "menu_menu_id": 1,
      "menu_option_id": 10,
      "sequence": 1,
      "active": 1,
      "menu_sequence": 1,
      "menu_menu":  { "pk_id": 1,  "name": "Administración", "active": 1, "icon_name": "settings" },
      "menu_option":{ "pk_id": 10, "name": "Usuarios", "url": "/usuarios", "icon_name": "users", "...": "..." },
      "menus":      { "pk_id": 3,  "name": "Perfil Admin", "active": 1 }
    }
  ],
  "pagination": {
    "page_size": 100,
    "page_number": 1,
    "total_rows": 1,
    "total_pages": 1,
    "page_row_first": 1,
    "page_row_last": 1
  }
}
```

Los objetos `menu_menu`, `menu_option` y `menus` solo aparecen si se envían los flags
`add_*` correspondientes.

---

## 6. Endpoints de catálogo (administración del menú)

Estos endpoints permiten leer/crear/editar las piezas del menú. Útiles para una pantalla
de administración; **no** son necesarios solo para pintar el menú.

> Los CRUD de `menu_perfil`, `menu_menu`, `menu_option` y `user` **no** exigen token en la
> configuración actual. Los de `menu_build` y `menu_perfil_user` **sí**.

Patrón común de cada recurso:

| Método         | Ruta               | Descripción                                                        |
|----------------|--------------------|--------------------------------------------------------------------|
| `POST`         | `/<recurso>`       | Crear (body: **array** de objetos).                                |
| `GET`          | `/<recurso>`       | Leer con filtros/paginación por query params.                      |
| `POST`         | `/<recurso>/read`  | Leer por **array de PKs** (body: `[1,2,3]`).                       |
| `PATCH`        | `/<recurso>`       | Actualizar (body: array de objetos con `pk_id` + campos a cambiar).|
| `PUT`          | `/<recurso>/`      | Crear o actualizar (upsert) por lote.                              |
| `DELETE`       | `/<recurso>`       | Eliminar (body: array de PKs).                                     |
| `POST`         | `/<recurso>/load/validation` | Validar una carga sin persistir.                     |
| `PUT`          | `/<recurso>/load`  | Cargar (persistir) un lote.                                        |

Recursos disponibles:

| Recurso (tabla)          | url_prefix              | Requiere token |
|--------------------------|-------------------------|:--------------:|
| menu_perfil              | `/api/menus`            | No             |
| menu_menu                | `/api/menumenu`         | No             |
| menu_option              | `/api/menuoption`       | No             |
| user                     | `/api/securityuser`     | No             |
| menu_build               | `/api/menubuild`        | **Sí**         |
| menu_perfil_user         | `/api/menuuser`         | **Sí**         |

### 6.1 Lectura con filtros (`GET /<recurso>`)

Query params comunes:

| Param           | Descripción                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `pk_id`         | Trae un registro por su llave primaria.                                     |
| `page_size`     | Tamaño de página (default 100; `0` = sin paginar).                          |
| `page_number`   | Página (default 1).                                                         |
| `columns_order` | Columnas de ordenación separadas por coma.                                  |
| `columns_sort`  | `asc`/`desc` por columna (misma cantidad que `columns_order`).              |
| `<campo>`       | Filtro por campo de la tabla; en texto usa coincidencia tipo `ILIKE`. Usa `null` para filtrar por nulos. |

Respuesta: `{ "data": [...], "pagination": {...} }` (mismos campos de paginación que en la sección 5).

### 6.2 Campos por recurso (para filtros y formularios)

**menu_perfil** (`/api/menus`): `pk_id, name, active`

**menu_menu** (`/api/menumenu`): `pk_id, name, active, icon_name`

**menu_option** (`/api/menuoption`): `pk_id, name, description, url, command, img, img_small, active, icon_name, external_url`

**menu_build** (`/api/menubuild`): `pk_id, menu_id, menu_menu_id, menu_option_id, sequence, active, menu_sequence`

**menu_perfil_user** (`/api/menuuser`): `pk_id, security_user_id, menu_id, active`

**user** (`/api/securityuser`): `pk_id, login, password, name, last_name, email, cell_phone, active`
> Al crear/editar `user`, si envías `password` el servicio lo **hashea** (SHA-256)
> antes de guardarlo. El hash nunca se expone en el token.

---

## 7. Migración desde el menú hardcodeado (guía rápida)

1. Autentícate contra Gatekeeper y guarda el JWT.
2. Al cargar la app (después del login), llama a
   `GET /api/menubuild/authorized-grouped` con el header `Authorization: Bearer <jwt>`.
3. Reemplaza tu arreglo estático de menú por `response.data.menu_menu`.
4. Mapea cada `menu_menu` → sección, y cada `menu_option` → item navegable
   (`url` interna o `external_url`).
5. Usa `summoner.nombre` / `summoner.apellido` para el saludo del usuario.
6. Cachea el resultado por sesión y refréscalo al re-loguear o al cambiar de perfil.
7. Maneja `401` reenviando al login (token expirado o inválido).

### Ejemplo (fetch)

```js
async function cargarMenu(jwt, menuId /* opcional */) {
  const qs = menuId ? `?menu_id=${menuId}` : '';
  const res = await fetch(`${BASE_URL}/api/menubuild/authorized-grouped${qs}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (res.status === 401) {
    // token inválido/expirado -> volver a autenticar con Gatekeeper
    redirigirALogin();
    return;
  }

  const body = await res.json();
  const secciones = body.data.menu_menu;   // array de menu_menu con sus menu_options
  const usuario = body.summoner;           // { nombre, apellido }
  pintarMenu(secciones, usuario);
}
```

---

## 8. Resumen rápido

- Para pintar el menú: **`GET /api/menubuild/authorized-grouped`** con `Authorization: Bearer <jwt>`.
- Respuesta: `data.menu_menu[]` (grupos) → `menu_options[]` (opciones) + `summoner`.
- Filtra por perfil con `?menu_id=<id>` (opcional).
- El backend ya filtra por los permisos del usuario del token.
- Alternativa plana con paginación/orden: `GET /api/menubuild/authorized`.
- CRUD de administración disponible por recurso (sección 6).
- Errores de token → `401`; reautenticar con Gatekeeper.
