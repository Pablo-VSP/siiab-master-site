/* Menus -> menu_perfil */
CREATE TABLE IF NOT EXISTS `menu_perfil` (
    `PK_ID`  INT      NOT NULL AUTO_INCREMENT,
    `NAME`   CHAR(50) NULL,
    `Active` TINYINT  NULL,
    PRIMARY KEY (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* MenuMenu -> menu_menu */
CREATE TABLE IF NOT EXISTS `menu_menu` (
    `PK_ID`     INT      NOT NULL AUTO_INCREMENT,
    `NAME`      CHAR(50) NULL,
    `ACTIVE`    TINYINT  NULL,
    `ICON_NAME` CHAR(50) NULL,
    PRIMARY KEY (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* MenuOption -> menu_option */
CREATE TABLE IF NOT EXISTS `menu_option` (
    `PK_ID`        INT       NOT NULL AUTO_INCREMENT,
    `NAME`         CHAR(255) NULL,
    `DESCRIPTION`  CHAR(255) NULL,
    `URL`          CHAR(255) NULL,
    `COMMAND`      CHAR(20)  NULL,
    `IMG`          CHAR(255) NULL,
    `IMG_SMALL`    CHAR(255) NULL,
    `ACTIVE`       TINYINT   NULL,
    `ICON_NAME`    CHAR(50)  NULL,
    `EXTERNAL_URL` CHAR(255) NULL,
    PRIMARY KEY (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* SecurityUser -> user */
CREATE TABLE IF NOT EXISTS `user` (
    `PK_ID`      INT          NOT NULL AUTO_INCREMENT,
    `LOGIN`      CHAR(50)     NULL,
    `PASSWORD`   VARCHAR(500) NULL,
    `NAME`       CHAR(100)    NULL,
    `LAST_NAME`  CHAR(100)    NULL,
    `EMAIL`      CHAR(100)    NULL,
    `CELL_PHONE` CHAR(20)     NULL,
    `ACTIVE`     TINYINT      NULL,
    PRIMARY KEY (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* MenuBuild -> menu_build
   FK: MENU_ID        -> menu_perfil.PK_ID
       MENU_MENU_ID   -> menu_menu.PK_ID
       MENU_OPTION_ID -> menu_option.PK_ID */
CREATE TABLE IF NOT EXISTS `menu_build` (
    `PK_ID`          INT     NOT NULL AUTO_INCREMENT,
    `MENU_ID`        INT     NULL,
    `MENU_MENU_ID`   INT     NULL,
    `MENU_OPTION_ID` INT     NULL,
    `SEQUENCE`       INT     NULL,
    `ACTIVE`         TINYINT NULL,
    `MENU_SEQUENCE`  INT     NULL,
    PRIMARY KEY (`PK_ID`),
    KEY `FK_MENU_BUILD_MENU` (`MENU_ID`),
    KEY `FK_MENU_BUILD_MENU_MENU` (`MENU_MENU_ID`),
    KEY `FK_MENU_BUILD_MENU_OPTION` (`MENU_OPTION_ID`),
    CONSTRAINT `FK_MENU_BUILD_MENU`
        FOREIGN KEY (`MENU_ID`) REFERENCES `menu_perfil` (`PK_ID`),
    CONSTRAINT `FK_MENU_BUILD_MENU_MENU`
        FOREIGN KEY (`MENU_MENU_ID`) REFERENCES `menu_menu` (`PK_ID`),
    CONSTRAINT `FK_MENU_BUILD_MENU_OPTION`
        FOREIGN KEY (`MENU_OPTION_ID`) REFERENCES `menu_option` (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* MenuUser -> menu_perfil_user
   FK: MENU_ID          -> menu_perfil.PK_ID
       SECURITY_USER_ID -> user.PK_ID */
CREATE TABLE IF NOT EXISTS `menu_perfil_user` (
    `PK_ID`            INT     NOT NULL AUTO_INCREMENT,
    `SECURITY_USER_ID` INT     NOT NULL,
    `MENU_ID`          INT     NOT NULL,
    `ACTIVE`           TINYINT NULL,
    PRIMARY KEY (`PK_ID`),
    KEY `FK_USUARIO_MENU_MENU` (`MENU_ID`),
    KEY `FK_USUARIO_MENU_USER` (`SECURITY_USER_ID`),
    CONSTRAINT `FK_USUARIO_MENU_MENU`
        FOREIGN KEY (`MENU_ID`) REFERENCES `menu_perfil` (`PK_ID`),
    CONSTRAINT `FK_USUARIO_MENU_USER`
        FOREIGN KEY (`SECURITY_USER_ID`) REFERENCES `user` (`PK_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;