-- =============================================================================
-- seed-menu.sql
-- Carga inicial del menú (Keymaster) con las opciones que hoy existen en la
-- página. Compatible con el DDL de base.sql (MySQL / InnoDB).
--
-- Estructura:
--   menu_perfil      -> perfil de menú de alto nivel (asignado a usuarios)
--   menu_menu        -> secciones/grupos del menú
--   menu_option      -> opciones navegables (url interna o external_url)
--   menu_build       -> une perfil + sección + opción con secuencia
--   menu_perfil_user -> qué perfil ve cada usuario
--
-- Notas:
--   * Es idempotente: usa INSERT ... ON DUPLICATE KEY UPDATE apoyándose en PKs
--     explícitas, de modo que puede re-ejecutarse sin duplicar.
--   * Se fijan los PK_ID a mano para que menu_build pueda referenciarlos de
--     forma estable.
--   * SEQUENCE ordena las opciones dentro de una sección; MENU_SEQUENCE ordena
--     las secciones entre sí.
-- =============================================================================

SET NAMES utf8mb4;
START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1) Perfil de menú
--    Un único perfil "Portal Interno" (PK_ID = 1) que agrupa todo el menú.
-- -----------------------------------------------------------------------------
INSERT INTO `menu_perfil` (`PK_ID`, `NAME`, `Active`) VALUES
    (1, 'Portal Interno', 1)
ON DUPLICATE KEY UPDATE `NAME` = VALUES(`NAME`), `Active` = VALUES(`Active`);

-- -----------------------------------------------------------------------------
-- 2) Secciones del menú (menu_menu)
-- -----------------------------------------------------------------------------
INSERT INTO `menu_menu` (`PK_ID`, `NAME`, `ACTIVE`, `ICON_NAME`) VALUES
    (1, 'Inicio',         1, 'home'),
    (2, 'Proyectos',      1, 'projects'),
    (3, 'Vacaciones',     1, 'calendar'),
    (4, 'Aprobaciones',   1, 'inbox'),
    (5, 'Administración', 1, 'settings'),
    (6, 'Reportes',       1, 'chart'),
    (7, 'Sitios',         1, 'globe')
ON DUPLICATE KEY UPDATE
    `NAME` = VALUES(`NAME`), `ACTIVE` = VALUES(`ACTIVE`), `ICON_NAME` = VALUES(`ICON_NAME`);

-- -----------------------------------------------------------------------------
-- 3) Opciones navegables (menu_option)
--    URL     -> ruta interna del frontend (router).
--    EXTERNAL_URL -> enlace externo (nueva pestaña). Se deja URL en NULL.
-- -----------------------------------------------------------------------------
INSERT INTO `menu_option`
    (`PK_ID`, `NAME`, `DESCRIPTION`, `URL`, `COMMAND`, `IMG`, `IMG_SMALL`, `ACTIVE`, `ICON_NAME`, `EXTERNAL_URL`)
VALUES
    -- Inicio
    (1,  'Dashboard',        'Índice central de sitios y reportes', '/',                    'Link', NULL, NULL, 1, 'dashboard', NULL),
    -- Proyectos
    (2,  'Proyectos',        'Catálogo de proyectos',               '/projects',            'Link', NULL, NULL, 1, 'projects',  NULL),
    -- Vacaciones
    (3,  'Mis solicitudes',  'Mis solicitudes de vacaciones',       '/vacations',           'Link', NULL, NULL, 1, 'calendar',  NULL),
    (4,  'Nueva solicitud',  'Crear una nueva solicitud',           '/vacations/new',       'Link', NULL, NULL, 1, 'calendar',  NULL),
    -- Aprobaciones
    (5,  'Bandeja de aprobación', 'Solicitudes por aprobar',        '/vacations/inbox',     'Link', NULL, NULL, 1, 'inbox',     NULL),
    -- Administración
    (6,  'Panel de administración', 'Panel principal',              '/admin',               'Link', NULL, NULL, 1, 'settings',  NULL),
    (7,  'Usuarios',         'Gestión de usuarios',                 '/admin/users',         'Link', NULL, NULL, 1, 'users',     NULL),
    (8,  'Proyectos y recursos', 'Gestión de proyectos y recursos', '/admin/projects',      'Link', NULL, NULL, 1, 'projects',  NULL),
    (9,  'Permisos',         'Asignación de permisos por proyecto', '/admin/permissions',   'Link', NULL, NULL, 1, 'settings',  NULL),
    -- Reportes (Looker Studio) -> external_url
    (10, 'Gasto MB Starlink', 'Gasto de envío de información Telemetría y TuViajeADO', NULL, 'Link', NULL, NULL, 1, 'report',
         'https://datastudio.google.com/embed/reporting/bed2a1d5-6a8b-432c-8418-8c5af64617e2/page/p_r8lkddeg6d'),
    (11, 'Monitoreo Viajes Telemetría', 'Monitoreo de viajes de Telemetría y TuViajeADO', NULL, 'Link', NULL, NULL, 1, 'report',
         'https://datastudio.google.com/embed/reporting/a7365a4e-7a2d-4667-98f4-ffb993848dec/page/qlD'),
    -- Sitios -> external_url
    (12, 'MyTools',     'Sitio de MyTools Productivo',   NULL, 'Link', NULL, NULL, 1, 'site', 'https://mytools.siiab.app/login'),
    (13, 'SIT',         'Sitio de SIT Productivo',       NULL, 'Link', NULL, NULL, 1, 'site', 'http://sitv3.ado.net/'),
    (14, 'Telemetría',  'Sitio de Telemetría Productivo', NULL, 'Link', NULL, NULL, 1, 'site',
         'https://telemetriat2.siiab.dev/Account/Login?ReturnUrl=%2F')
ON DUPLICATE KEY UPDATE
    `NAME` = VALUES(`NAME`), `DESCRIPTION` = VALUES(`DESCRIPTION`), `URL` = VALUES(`URL`),
    `COMMAND` = VALUES(`COMMAND`), `ACTIVE` = VALUES(`ACTIVE`), `ICON_NAME` = VALUES(`ICON_NAME`),
    `EXTERNAL_URL` = VALUES(`EXTERNAL_URL`);

-- -----------------------------------------------------------------------------
-- 4) Construcción del menú (menu_build)
--    Une perfil (MENU_ID=1) + sección (MENU_MENU_ID) + opción (MENU_OPTION_ID).
--    MENU_SEQUENCE ordena secciones; SEQUENCE ordena opciones dentro de cada una.
-- -----------------------------------------------------------------------------
INSERT INTO `menu_build`
    (`PK_ID`, `MENU_ID`, `MENU_MENU_ID`, `MENU_OPTION_ID`, `SEQUENCE`, `ACTIVE`, `MENU_SEQUENCE`)
VALUES
    -- Inicio
    (1,  1, 1, 1,  1, 1, 1),
    -- Proyectos
    (2,  1, 2, 2,  1, 1, 2),
    -- Vacaciones
    (3,  1, 3, 3,  1, 1, 3),
    (4,  1, 3, 4,  2, 1, 3),
    -- Aprobaciones
    (5,  1, 4, 5,  1, 1, 4),
    -- Administración
    (6,  1, 5, 6,  1, 1, 5),
    (7,  1, 5, 7,  2, 1, 5),
    (8,  1, 5, 8,  3, 1, 5),
    (9,  1, 5, 9,  4, 1, 5),
    -- Reportes
    (10, 1, 6, 10, 1, 1, 6),
    (11, 1, 6, 11, 2, 1, 6),
    -- Sitios
    (12, 1, 7, 12, 1, 1, 7),
    (13, 1, 7, 13, 2, 1, 7),
    (14, 1, 7, 14, 3, 1, 7)
ON DUPLICATE KEY UPDATE
    `MENU_ID` = VALUES(`MENU_ID`), `MENU_MENU_ID` = VALUES(`MENU_MENU_ID`),
    `MENU_OPTION_ID` = VALUES(`MENU_OPTION_ID`), `SEQUENCE` = VALUES(`SEQUENCE`),
    `ACTIVE` = VALUES(`ACTIVE`), `MENU_SEQUENCE` = VALUES(`MENU_SEQUENCE`);

-- -----------------------------------------------------------------------------
-- 5) Asignación del perfil a un usuario
--    Ajusta SECURITY_USER_ID al PK_ID real del usuario en la tabla `user`.
--    Este ejemplo asigna el perfil 1 (Portal Interno) al usuario 1.
-- -----------------------------------------------------------------------------
INSERT INTO `menu_perfil_user` (`PK_ID`, `SECURITY_USER_ID`, `MENU_ID`, `ACTIVE`) VALUES
    (1, 1, 1, 1)
ON DUPLICATE KEY UPDATE
    `SECURITY_USER_ID` = VALUES(`SECURITY_USER_ID`), `MENU_ID` = VALUES(`MENU_ID`),
    `ACTIVE` = VALUES(`ACTIVE`);

COMMIT;

-- =============================================================================
-- Resultado esperado en GET /api/menubuild/authorized-grouped (para el usuario
-- con el perfil 1 asignado):
--   Inicio        -> Dashboard
--   Proyectos     -> Proyectos
--   Vacaciones    -> Mis solicitudes, Nueva solicitud
--   Aprobaciones  -> Bandeja de aprobación
--   Administración-> Panel, Usuarios, Proyectos y recursos, Permisos
--   Reportes      -> Gasto MB Starlink, Monitoreo Viajes Telemetría (external_url)
--   Sitios        -> MyTools, SIT, Telemetría (external_url)
-- =============================================================================
