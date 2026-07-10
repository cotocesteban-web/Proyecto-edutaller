# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

### corregir
    1. [Listo] Neceito que el nuevo usuari antes de ser asignado como estudiante se pueda autenticar con su correo de google para luego llenar el formulario con sus datos que ya esta listo ee formulario  que no sea simulado porque niiquiera me pide con que cuenta autenticarme

## nuevas correcciones:
    1. tenemos un error al crear curso ya si lo crea pero no lo publica al login si me y agregar desde el adminisstrador agregar imagen para cada curso que se publica  ocupo la subir imagen y agregar horarios y dias cupo disponibles marcar agotados un limite conforme los usuarios vallas inscibiendoe se van descontando por ejemplo si son 10 y solo 1 se inscribe quedan 9 disponibles.
    2. cuando el estudiante sube la tarea el profesor no puede ver el socumento que el etudiante a enviado como profesor neceito descargar el documento que el estudiante a enviado para revisar la tarea y luego colocar su calificacion.
    3. como administrador tambien necesito la seccion de profesores o instructore con sus dato y el curso que imparten.
    y como administrador aun no funciona el boton o la funcion de alerta de insolvencia para notificar atravez de correo al estudiante que tiene pagos pendientes.

## nuevas correcciones.
    1. [Listo] Panel de administracion no puedo eliminar instructore y estudiates y actualizar cin un boton al estudiante desoues de verificar los datos de la boleta que envio marcar al estuiante como solvente.
    colocar el boton ala par de ver boleta asiganar como solvente y que el regitro sea por clasificacion de cursos ejemplo: mecanica estudiante juan peres solvente no solvente. carrera electricidad estudiantes solvente o no solvente el listado pdesplegado hacia abajo por cada carrera que existe y se creara.
    y mejor quita la alerta atraves de correo porque solo dice alerta enviada pero no hace la funcion ya verifique y no me ha llegado ningun correo eliminalo mejor solo aprecera el boton sovente o la alerta insolvente. (Removido alerta de correo y habilitado el botón de solvencia y agrupación de carreras)

## nuevas correciones
    1. [Listo] Panel de administrador no puedo ver la boleta que envio el estudiante
    2. [Listo] Panel de administrador falta agregar en los curso los costos de inscripcion y menualidades par que les aparesca en el login cada que se cree el curso tener esa cajita para colocar los costos similiar a lo de las fechas.
    3. [Listo] como administrr dejame agregar una imagen de fondo de la institucion para que se vea profesional y que tenga yo es panel para modificar la imagenes o fotos.
    4. [Listo] En el login hace falta la seccion de contacto el cual ira un formulario para que los usuarios puedan enviar mensajes y correo a la institucion y que a mi me llegue el correo y el numero de telefonos direccion. el cual sera el panel como administrador podre yo editar y dubir imagenes de fondo. necesito que este adentro del panel en una eccion donde diga editar presentacion. 
    5. [Listo] que tenga 2 temas claro y oscuro la web
    [Listo] falta agregar la seccion de mensajes que los usuarios envian atravezde al panel de administracion. (Agregados en la pestaña "Editar Presentación")

## cambios de fondo de color
  1. [Listo] cambuame el color e fondo y el color de las letras de edutaller a un color mas profesianal (Actualizado a slate-grey #2e333f y cajas combinadas)


## Cambios forntend login
    1. [Listo] que el tema de claro oscuro se active por medio de un boton que diga claro en ingle o dark pero que no sea un emoji si no el botn diciendo en que tema y camcbiado el tema. (Habilitado botón estilizado con texto en inglés 'Light' / 'Dark')

    2. [Listo] cambia etodos los coleores de fono a colore mas claros y agrega nuevo diseo a las letras. (Colores de fondo aclarados para un look más moderno en ambos temas, e integrada la fuente Plus Jakarta Sans junto a mejoras tipográficas). 


### ultimas revisiones:
    1. [Listo] haz una ultima revision con el codigo en general con el backend y frontend (Revisado y validado el flujo de endpoints, rutas y archivos)
    2. [Listo] si falta instalar dependencias avisaeme y si hay que corregir o hacer algo mas corrigelo antes de desplegar a vercel. (Añadido `@fastify/cors` en el backend para admitir peticiones cross-origin, y creado el archivo `vercel.json` en el frontend para enrutar peticiones `/api` al servidor backend automáticamente).


### Correcciones
    1. [Listo] 1, en el panel de administrador elimina donde se agrega imagen de fondo no la voy a neceitar. (Removido el selector y envío de imagen de fondo del Hero en el panel de administración)
    2. [Listo] en el login cuando quiero asignarme a un curso me aparece: Ya tienes una solicitud de inscripción para este curso con estado: rejected reparalo. al para que el administrador pueda ver las solicitudes de inscripcion y pueda aceptar o rechazar la inscripcion del estudiante. (Corregido en el backend: ahora se permite resometer solicitudes si la anterior fue rechazada, limpiando el registro antiguo de forma automática).
    
    3. [Listo] Probe autenticarme con mi cuenta de google y con mi correo quise asignarme a todos los cursos llego la solicitud del lado del administrador y al momento de aprobar al estudiante para asignarlo al curso no me deja hacerlo. unicamente funciono con el curso de carpinteria. (Corregido en el backend: ahora si el estudiante ya tiene un usuario creado con ese email, en lugar de intentar crearlo de nuevo y causar un error por duplicado, se utiliza la cuenta existente y se le matricula en el nuevo curso de forma directa).


### nuevoas cambios.
    1. [Listo] El curso de electricidad lo elimine en el panel de administracion pero cuando volvi a entrar volvio aparecer era porque ese era un dato semilla el cual debe de ser modificable al querer eliminarlo. (Corregido: Las semillas ahora se inicializan una única vez en la base de datos de manera condicional).
    
    2. [Listo] tambien como profesres y estudiantes que son datos semillas porfavor que tengas la opcion de eliminarlo pero que se se eliminer correctamente porque veo al hacerlo me lo borra pero  cuando reinicio el servidor vuelven aparecer nuevamente aplica para todos los datos semilla. (Corregido: El borrado de instructores, estudiantes y cursos semilla ahora es persistente y no se vuelven a crear en los reinicios del servidor).

### nuevos cambios.
    1. [Listo] Desde el panel de estudiar no funciona no le que es enviar mensaje al profesor. 
    2. [Listo] Tener una seccion de resumen de taras pendientes entregados y no entregados.
    3. [Listo] seccion de resumen de las notas.
    4. [Listo] que la tarea enviada se marque con enviada y pendiente hasta que el profesor la califique.
    5. [Listo] que se puedan eliminar el historial de de la conversasion con el profesor y e la mima que el profesor pueda responder o eliminar el historial de conversacion.
    6. [Listo] el estudiante si esta asignado a 5 cursos debede interactruar con los cursos asignados. y un panel por cada curso para no tener desorden.
    7. [Listo] desde el panel de instructor no se puede enviar mensaje alos etudiantes.
    8. [Listo] En la web cambiar el color del contraste light el color oscuro cuando veo las letras no se ven porque esta en gris.
    9. [Listo] en el panel del instructor no puede ver ni descargar la tarea de los estudiantes.
    10. [Listo] en el panel de intructorla fecha de entrega esta bien solo que la hora limite de entregar tarea no especifica am o pm
    10. [Listo] el profesor debe tener el listado tal y como esta con los alumnos que ya entregaron tarea que sea apartado por alumno para mantener un orden.
    11. [Listo] En el panel de instructor que tambien pueda eliminar los materiales de apoyo de los etudiantes si funciona lo dube pero no la puedo elimar la publicacion.
    
### nuevo cambios:
    1. [Listo] en el panel de estudiante cuando veo mis tareas enviadas en el modo light el contraste oscuro no me deja ver bien las letras.
    2. [Listo] En los paneles de administrador, estudiante, administrador. al boton de seleccionar archivo que visualmente ea mas bonito. 
    3. [Listo] del panel de estudiante no me deja enviar mensaje a mi profesor.


### nuevas correcione:
    1. [Listo] del panel de etudiante no puedo enviar tareas.
    2. [Listo] no puedo enviar mensajes a mi profesor.
    3. [Listo] panel del instructor tener resumen de notas por alumno. si el alumno no hizo la entrega aparecera como 0 su nota.
    4. [Listo] En el panel de administrador agregar la seccion donde voy a subir imagenes de fondo el cual sera de unamanera muy interactiva estaran imagenes que e van a ir cambiando poco apoco colocalo en un lugar enespecifico que e vea bien, pudiendo seleccionar hasta 5 y agregándolas al fondo del login.
    6. [Listo] Agrega mas imgenes al panel yquita ladel hobre con saco agrega unas 5 mas.
    7. [Listo] que el panel de administrador no pueda asignarse a los cursos ni tampoco los profesores. unicamente usuarios y estudiates.
    8. [Listo] en el panel de administrador agreagame el eparta para subirn imagenes de fonfo en forma de carrusel si tu ya tienen una funcion interactiva de fonfo eliminala.

