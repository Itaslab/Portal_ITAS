BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Usuarios" (
	"Id"	INTEGER,
	"Email"	TEXT NOT NULL,
	"Password"	TEXT NOT NULL,
	PRIMARY KEY("Id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "ejecucionesRealizadas" (
	"id"	INTEGER,
	"FlujoEjecutado"	TEXT NOT NULL,
	"Solicitante"	TEXT NOT NULL,
	"Identificador"	TEXT,
	"FlujoSeleccionado"	TEXT NOT NULL,
	"Estado"	TEXT NOT NULL,
	"FHInicio"	TEXT,
	"FHFin"	TEXT,
	"Prioridad"	TEXT,
	"Proceso"	INTEGER DEFAULT 0,
	"Resultado"	TEXT,
	"Datos"	TEXT,
	"Salida"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "flujos" (
	"id"	INTEGER,
	"nombreFlujo"	TEXT NOT NULL,
	"descripcion"	TEXT,
	"instrucciones"	TEXT,
	"campos"	TEXT,
	"tipoFlujo"	TEXT,
	"subTipoFlujo"	TEXT,
	"intentosAutomaticos"	INTEGER,
	"prioridad"	INTEGER,
	"cantPorLote"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "Usuarios" VALUES (1,'francisco@telecom.com','Francisco123');
INSERT INTO "Usuarios" VALUES (2,'prueba@telecom.com','Prueba123');
INSERT INTO "flujos" VALUES (1,'SF_Retry','Por cada OrderNo que se ingresa, se valida que el estado sea Fataly Failed y luego da Retry sobre el mismo.','Requiere que se ingresen los OrderNo uno debajo del otro.','OrderNo','RPA',NULL,1,8,0);
INSERT INTO "flujos" VALUES (2,'SF_Complete','Realiza el Complete de cualquier OrderNo que reciba. No realiza Chequeo pre ni post.','Requiere que se ingresen los OrderNo uno debajo del otro.','OrderNo','RPA',NULL,1,8,0);
INSERT INTO "flujos" VALUES (3,'SF_Cancelar_xMQ','Toma la lista de OrderNo y por cada una evalua el estado... Si es Fataly Failed, cambia el valor de Inbox Manual Queue a ''Ordenes a cancelar''. Si el Estado es Running, Frozen Running o Frozen Fataly Failed, primero cambia el estado a Fatal Failed y luego cambia el MQ a ''Ordenes a cancelar''.','Requiere que se ingresen los OrderNo uno debajo del otro.','OrderNo','RPA',NULL,1,8,0);
INSERT INTO "flujos" VALUES (4,'SF_Retry_S563_from_S564','Por cada TaskID que se ingresa, se valida que el estado sea "Fatally Failed". Si la dependencia 563 está en estado "Complete", la cambia a "Fatally failed" y luego da Retry sobre la misma. Si la dependencia 563 está en estado "Fatally Failed", solo da retry sobre la misma. Luego envía reporte con estado de cada orden antes y después del proceso','Requiere que se ingresen los OrderNo uno debajo del otro.','OrderNo564','RPA','n/a',1,8,0);
INSERT INTO "flujos" VALUES (5,'OM_Order_Report','Ejecuta la consulta por API del OM Order Report.','Ingrese los OrderID uno debajo del otro, sin espacios.','OrderID','Cloud','n/a',1,5,0);
INSERT INTO "flujos" VALUES (6,'OM_Order_Report_COMPLETED','Ejecuta la consulta por API del OM Order Report ### OJO ### SOLO PARA ESTADOS COMPLETED.','Ingrese los OrderID uno debajo del otro, sin espacios.','OrderID','Cloud','n/a',1,5,0);
INSERT INTO "flujos" VALUES (7,'SF_Fataly_Complete','Si el Estado del TaskID es Completed, lo pasa a Fataly Failed y luego da Complete.','Requiere que se ingresen los TaskID uno debajo del otro.','OrderNo','RPA','n/a',1,8,0);
INSERT INTO "flujos" VALUES (8,'SF_CaTit_Muni','Ejecuta el WA para los casos de Cambio de Titularidad con error XOM_MUNICIPALIDAD... editando en la descomposición los componentes de HUAWEI con los datos de Provincia y Municipalidad que se describen en la lista.','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID; Provincia; Municipalidad','OrderID;OrderNumber;TaskID;Provincia;Municipalidad','RPA','n/a',1,8,0);
INSERT INTO "flujos" VALUES (9,'SF_Retry_Modular','Por cada TaskID que se ingresa, se valida que el estado sea Fataly Failed y luego da Retry sobre el mismo. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (10,'SF_Retry_S563_from_S564_Modular','Por cada TaskID que se ingresa, se valida que el estado sea "Fatally Failed". Si es así se cambia el estado a "Running", luego busca la dependencia 563. Si la dependencia 563 está en estado "Complete", la cambia a "Fatally failed" y luego da Retry sobre la misma. Si la dependencia 563 está en estado "Fatally Failed", solo da retry sobre la misma. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (11,'SF_Cancelar_xMQ_Modular','Toma la lista de OrderNo y por cada una evalúa el estado... Si es Fatally Failed, cambia el valor de Inbox Manual Queue a "Ordenes a Cancelar". Si el Estado es Running, Frozen Running o Frozen Fatally Failed, primero cambia el estado a Fatally Failed y luego cambia el MQ a "Ordenes a Cancelar". Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (12,'SF_Fatally_Complete_Modular','Si el Estado del TaskID es Completed, lo pasa a Fataly Failed y luego da Complete. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (13,'SF_CaTit_Muni_Modular','Ejecuta el WA para los casos de Cambio de Titularidad con error XOM_MUNICIPALIDAD... editando en la descomposición los componentes de HUAWEI con los datos de Provincia y Municipalidad que se describen en la lista. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID; Provincia; Municipalidad','OrderID;OrderNumber;TaskID;Provincia;Municipalidad','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (14,'SF_Complete_Modular','Da Complete a cada Task del listado sin ninguna validación. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,3,500);
INSERT INTO "flujos" VALUES (15,'SF_S374_Accion_Resume_Modular','SF_S374_Accion_Resume_Modular','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (16,'SF_Amend_Cancelacion_xMQ_Modular','Toma la lista de TaskID y por cada uno evalúa el estado... Si es Fatally Failed, cambia el valor de Inbox Manual Queue a "Amend cancelación de órdenes". Si el Estado es Running, Frozen Running o Frozen Fatally Failed, primero cambia el estado a Fatally Failed y luego cambia el MQ a "Amend cancelación de órdenes". Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
INSERT INTO "flujos" VALUES (17,'OPPRO_C281_No_Se_Encontro_ONT','Proceso automático diario para WA del error C281 No se Encontró ONT','','IdListaAux','RPA','OPPRO',1,2,0);
INSERT INTO "flujos" VALUES (18,'SF_Cambiar_Task_State_A_Fatally_failed','Valida si el State del Task ID es Running, de ser así lo cambia a Fatally Failed y no realiza más acciones. Si son más de 500 registros, el portal los divide en lotes de 500 o menos y crea una nueva tarea para cada uno','Se debe ingresar los datos separados por punto y coma; OrderID; OrderNumber; TaskID','OrderID;OrderNumber;TaskID','RPA','SF_Ordenes',1,2,500);
COMMIT;
