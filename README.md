🎫 Sistema de Tickets de Soporte

Mi proyecto para el TP3 de Programación III es una aplicación web full-stack que permite gestionar pedidos de soporte técnico. Los usuarios pueden registrarse, loguearse y crear tickets, mientras que los agentes se encargan de actualizarlos.

🛠 Tecnologías usadas

Node.js + Express — servidor y API REST.  
MySQL — base de datos relacional (usada en lugar de PostgreSQL).  
JWT + bcryptjs — autenticación segura y cifrado de claves. 
HTML + CSS + JavaScript — frontend sin frameworks.  

⚙️ Cómo levantar el proyecto1.

1. Clonar el repositorio

git clone

https://github.com/tamybrandan-svg/Trabajo_Practico_N-3.git

2. Instalar dependencias
npm install

3. Crear la base de datos

Abrí MySQL Workbench y ejecutá el archivo database.sql que está en la raíz del proyecto. Eso crea todas las tablas, el trigger, el procedimiento y carga los datos de prueba.  

4. Configurar el archivo .env
Creá un archivo .env en la raíz con estos datos (no lo subas a GitHub porque te desaprueban):  Ini, TOML

DB_HOST=localhost
DB_PORT=3306
DB_NAME=soporte_db
DB_USER=root
DB_PASSWORD=tu_contraseña
PORT=3000
JWT_SECRET=cualquier_palabra_secreta

5. Iniciar el servidor

npm run dev

6. Abrir la app

Entrá a http://localhost:3000 en el navegador.


## 👤 Usuarios de prueba

| Nombre | Email | Contraseña | Rol |
|--------|-------|------------|-----|
| Juan García | juan@mail.com | 1234 | cliente |
| María López | maria@mail.com | 1234 | cliente |
| Luis Soporte | luis@mail.com | 1234 | agente |
| Ana Agente | ana@mail.com | 1234 | agente |


🗄 Base de datos
Tablas   

usuarios: para los clientes y agentes del sistema.

categorias: tipos de problema (hardware, software, red, etc.).

tickets: el corazón del sistema, con el estado y quién lo atiende.

comentarios: acá se guarda el detalle del problema y las respuestas que se van dando.

historial_estados: registro automático de cada movimiento del ticket.


Trigger  

 Es una acción automática: cuando un agente cambia el estado de un ticket (por ejemplo de "nuevo" a "en progreso"), la base de datos registra ese cambio sola en la tabla historial_estados. Es como una cámara de seguridad: Node.js no tiene que avisarle nada, la BD se da cuenta del cambio y guarda el registro por su cuenta.

Transacción   

Sirve para asegurar que no se guarden datos a medias. Cuando un cliente crea un ticket nuevo, se ejecutan dos cosas juntas: insertar el ticket y agregar el primer comentario con el problema. Si falla el comentario, se hace un ROLLBACK y se borra el ticket que quedó vacío. O se guardan las dos cosas o no se guarda nada.



❓ Preguntas conceptuales
1. Con tus palabras, explica que es un servidor web y cómo funciona el ciclo request-response.
Un servidor web es un programa que está esperando que alguien le mande un pedido. Cuando el navegador entra a una página, le manda un mensaje al servidor (request) diciendo qué quiere. El servidor lo procesa, busca lo que necesita (en una base de datos, por ejemplo) y le responde (response) con los datos o la página pedida. Es como llamar a un mozo: vos pedís, él busca y te trae.

2. ¿Qué es Express y por qué lo usamos en lugar de usar solo Node.js?
Node.js puede crear un servidor, pero hay que escribir mucho código para manejar cada tipo de pedido. Express es como un ayudante que ya tiene todo eso resuelto: con pocas líneas creás rutas, leés datos del body, mandás respuestas en JSON y más. Usamos Express para escribir menos código y tenerlo más ordenado.

3. ¿Qué es un JWT y como se diferencia de guardar la sesión en el servidor?
Un JWT es como un carnet firmado que el servidor le da al usuario cuando se loguea. Ese carnet viaja con cada pedido y el servidor lo verifica sin necesidad de recordar nada. En cambio, guardar la sesión en el servidor significa que el servidor tiene que acordarse de cada usuario logueado, lo cual ocupa memoria y complica las cosas si hay muchos servidores. Con JWT el servidor no guarda nada, solo verifica la firma.

4. ¿Qué ventaja tiene usar un procedimiento almacenado en lugar de escribir ese SQL desde Node.js?
Un procedimiento almacenado es una función guardada dentro de la base de datos. La ventaja es que la lógica vive en la BD y no en el servidor, entonces si hay un error en medio de varias operaciones, la BD lo maneja sola. También es más rápido porque no viajan tantos datos entre Node y la base, y se puede reutilizar desde cualquier parte del sistema.

5. ¿Por qué es importante usar transacciones? Pone un ejemplo de cuando un ROLLBACK salva la integridad de los datos.
Las transacciones sirven para que un conjunto de operaciones se haga completo o no se haga nada. En este sistema, cuando un cliente crea un ticket se insertarían dos cosas: el ticket y su primer comentario. Si se guarda el ticket pero falla el comentario, quedó un ticket incompleto. Con la transacción, si algo falla se hace ROLLBACK y ninguna de las dos inserciones queda en la base. Los datos siempre quedan consistentes.

6. ¿Qué es un trigger? Describe el trigger que implementaste y en qué momento se dispara.
Un trigger es una acción automática que hace la base de datos cuando pasa algo en una tabla, sin que el servidor lo pida. In este sistema implementamos un trigger que se dispara cada vez que se actualiza el estado de un ticket. En ese momento, automáticamente inserta una fila en la tabla historial_estados con el estado anterior y el nuevo. Así siempre queda el registro de cómo evolucionó cada ticket, sin escribir nada extra en Node.js.
